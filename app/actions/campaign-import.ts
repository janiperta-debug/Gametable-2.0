"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

const STORAGE_BUCKET = "campaign-import-sources"
const MAX_SOURCE_SIZE = 25 * 1024 * 1024
const MAX_FILE_NAME_LENGTH = 255
const MAX_TEXT_LENGTH = 200_000

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/webp",
])

type CampaignImportSourceKind = "pdf" | "document" | "image" | "text" | "other"

async function requireCampaignGM(eventId: string) {
  if (typeof eventId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) {
    return { error: "Virheellinen kampanja." as const }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Kirjautuminen vaaditaan." as const }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, host_id, event_type")
    .eq("id", eventId)
    .maybeSingle()

  if (eventError || !event) return { error: "Kampanjaa ei löytynyt." as const }
  if (event.event_type !== "campaign") return { error: "Tuonti on käytettävissä vain kampanjoissa." as const }
  if (event.host_id !== user.id) return { error: "Vain kampanjanjohtaja voi hallita tuontia." as const }

  return { user, event }
}

function sourceKindFromMime(mimeType: string): CampaignImportSourceKind {
  if (mimeType === "application/pdf") return "pdf"
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType === "text/plain" || mimeType === "text/markdown") return "text"
  if (mimeType === "application/msword" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "document"
  }
  return "other"
}

export async function createCampaignImportBatch(eventId: string) {
  const access = await requireCampaignGM(eventId)
  if ("error" in access) return { success: false as const, error: access.error }

  try {
    const db = createServiceClient()
    const { data: batch, error } = await db
      .from("campaign_import_batches")
      .insert({
        event_id: eventId,
        created_by: access.user.id,
        status: "uploaded",
      })
      .select("id, event_id, status, source_count, item_count, created_at")
      .single()

    if (error) return { success: false as const, error: error.message }

    revalidatePath("/events/" + eventId)
    return { success: true as const, batch }
  } catch (error) {
    console.error("Create campaign import batch failed:", error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Tuontierän luonti epäonnistui.",
    }
  }
}

export type RegisterCampaignImportSourceInput = {
  batchId: string
  fileName: string
  storagePath?: string
  sourceText?: string
  mimeType?: string
  metadata?: Record<string, unknown>
}

/**
 * Registers a source after the browser has uploaded the file directly to the
 * private bucket. The server verifies both campaign ownership and that the
 * uploaded object exists under this GM's campaign folder.
 */
export async function registerCampaignImportSource(input: RegisterCampaignImportSourceInput) {
  if (!input || typeof input.batchId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.batchId)) {
    return { success: false as const, error: "Virheellinen tuontierä." }
  }

  const fileName = typeof input.fileName === "string" ? input.fileName.trim() : ""
  if (!fileName || fileName.length > MAX_FILE_NAME_LENGTH) {
    return { success: false as const, error: "Tiedoston nimi puuttuu tai on liian pitkä." }
  }

  const storagePath = typeof input.storagePath === "string" ? input.storagePath.trim() : ""
  const sourceText = typeof input.sourceText === "string" ? input.sourceText.trim() : ""
  if ((!storagePath && !sourceText) || (storagePath && sourceText)) {
    return { success: false as const, error: "Lähteellä täytyy olla joko tiedosto tai tekstisisältö." }
  }
  if (sourceText.length > MAX_TEXT_LENGTH) {
    return { success: false as const, error: "Tekstilähde on liian pitkä." }
  }

  const access = await requireCampaignGMFromBatch(input.batchId)
  if ("error" in access) return { success: false as const, error: access.error }

  try {
    const db = createServiceClient()
    let sourceKind: CampaignImportSourceKind = "text"
    let mimeType = "text/plain"
    let fileSizeBytes: number | null = null

    if (storagePath) {
      const segments = storagePath.split("/")
      if (segments.length !== 3 || segments[0] !== access.eventId || segments[1] !== access.userId ||
          !segments[2] || segments[2] === "." || segments[2] === "..") {
        return { success: false as const, error: "Tiedoston tallennuspolku ei ole sallittu." }
      }

      const { data: objects, error: storageError } = await db.storage
        .from(STORAGE_BUCKET)
        .list(`${access.eventId}/${access.userId}`, { search: segments[2], limit: 10 })

      if (storageError) return { success: false as const, error: storageError.message }
      const storedObject = (objects ?? []).find((object) => object.name === segments[2])
      if (!storedObject) return { success: false as const, error: "Ladattua tiedostoa ei löytynyt yksityisestä tallennustilasta." }

      const objectMetadata = (storedObject.metadata ?? {}) as Record<string, unknown>
      const actualMimeType = typeof objectMetadata.mimetype === "string" ? objectMetadata.mimetype : ""
      const actualSize = Number(objectMetadata.size)

      if (!ALLOWED_MIME_TYPES.has(actualMimeType)) {
        return { success: false as const, error: "Tiedoston tyyppi ei ole sallittu." }
      }
      if (!Number.isFinite(actualSize) || actualSize <= 0 || actualSize > MAX_SOURCE_SIZE) {
        return { success: false as const, error: "Tiedoston koko ei ole sallittu (enintään 25 Mt)." }
      }

      mimeType = actualMimeType
      fileSizeBytes = actualSize
      sourceKind = sourceKindFromMime(actualMimeType)
    }

    const { data: batch, error: batchError } = await db
      .from("campaign_import_batches")
      .select("id, status")
      .eq("id", input.batchId)
      .eq("event_id", access.eventId)
      .maybeSingle()

    if (batchError) return { success: false as const, error: batchError.message }
    if (!batch || batch.status !== "uploaded") {
      return { success: false as const, error: "Tähän tuontierään ei voi enää lisätä lähteitä." }
    }

    const { data: source, error: insertError } = await db
      .from("campaign_import_sources")
      .insert({
        batch_id: input.batchId,
        event_id: access.eventId,
        uploaded_by: access.userId,
        source_kind: sourceKind,
        file_name: fileName,
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
        storage_path: storagePath || null,
        source_text: sourceText || null,
        metadata: input.metadata ?? {},
      })
      .select("id, batch_id, source_kind, file_name, mime_type, file_size_bytes, created_at")
      .single()

    if (insertError) return { success: false as const, error: insertError.message }

    const { count, error: countError } = await db
      .from("campaign_import_sources")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", input.batchId)

    if (!countError) {
      await db.from("campaign_import_batches")
        .update({ source_count: count ?? 0, updated_at: new Date().toISOString() })
        .eq("id", input.batchId)
        .eq("event_id", access.eventId)
    }

    revalidatePath("/events/" + access.eventId)
    return { success: true as const, source }
  } catch (error) {
    console.error("Register campaign import source failed:", error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Lähteen rekisteröinti epäonnistui.",
    }
  }
}

async function requireCampaignGMFromBatch(batchId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Kirjautuminen vaaditaan." as const }

  const db = createServiceClient()
  const { data: batch, error } = await db
    .from("campaign_import_batches")
    .select("id, event_id, created_by, event:events!inner(id, host_id, event_type)")
    .eq("id", batchId)
    .maybeSingle()

  if (error || !batch) return { error: "Tuontierää ei löytynyt." as const }
  const event = Array.isArray(batch.event) ? batch.event[0] : batch.event
  if (!event || event.event_type !== "campaign" || event.host_id !== user.id) {
    return { error: "Vain kampanjanjohtaja voi hallita tämän kampanjan tuontia." as const }
  }

  return { userId: user.id, eventId: batch.event_id }
}

export async function listCampaignImportBatches(eventId: string) {
  const access = await requireCampaignGM(eventId)
  if ("error" in access) return { success: false as const, error: access.error, batches: [] }

  try {
    const db = createServiceClient()
    const { data: batches, error } = await db
      .from("campaign_import_batches")
      .select("id, status, source_count, item_count, ai_model, error_message, created_at, updated_at, completed_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) return { success: false as const, error: error.message, batches: [] }

    return { success: true as const, batches: batches ?? [] }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Tuontierien lataaminen epäonnistui.",
      batches: [],
    }
  }
}

export async function cancelCampaignImportBatch(batchId: string) {
  if (typeof batchId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchId)) {
    return { success: false as const, error: "Virheellinen tuontierä." }
  }

  const access = await requireCampaignGMFromBatch(batchId)
  if ("error" in access) return { success: false as const, error: access.error }

  const db = createServiceClient()
  const { data: batch, error: updateError } = await db
    .from("campaign_import_batches")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", batchId)
    .eq("event_id", access.eventId)
    .in("status", ["uploaded", "review", "failed"])
    .select("id, status")
    .maybeSingle()

  if (updateError) return { success: false as const, error: updateError.message }
  if (!batch) return { success: false as const, error: "Tuontierää ei voi perua sen nykyisessä tilassa." }

  revalidatePath("/events/" + access.eventId)
  return { success: true as const, batch }
}


/**
 * Creates a private campaign draft that can receive source files before the
 * final event details are generated from the imported material.
 */
export async function createCampaignImportDraft() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false as const, error: "Kirjautuminen vaaditaan." }

  try {
    const db = createServiceClient()
    const { data: existingDraft, error: existingError } = await db
      .from("events")
      .select("id")
      .eq("host_id", user.id)
      .eq("event_type", "campaign")
      .contains("event_config", { campaignImportSetup: { status: "awaiting_sources" } })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) throw new Error(existingError.message)
    if (existingDraft) return { success: true as const, eventId: existingDraft.id }

    const now = new Date().toISOString()
    const { data: event, error: eventError } = await db
      .from("events")
      .insert({
        host_id: user.id,
        title: "Kampanjan valmistelu",
        description: null,
        event_type: "campaign",
        privacy: "private",
        starts_at: now,
        ends_at: null,
        status: "upcoming",
        event_config: {
          campaignImportSetup: {
            status: "awaiting_sources",
            createdAt: now,
          },
        },
      })
      .select("id")
      .single()

    if (eventError || !event) {
      return { success: false as const, error: eventError?.message || "Kampanjan valmistelun luonti epäonnistui." }
    }

    const { error: participantError } = await db
      .from("event_participants")
      .insert({
        event_id: event.id,
        user_id: user.id,
        status: "attending",
      })

    if (participantError) {
      await db.from("events").delete().eq("id", event.id).eq("host_id", user.id)
      return { success: false as const, error: participantError.message }
    }

    revalidatePath("/events")
    return { success: true as const, eventId: event.id }
  } catch (error) {
    console.error("Create campaign import draft failed:", error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Kampanjan valmistelun luonti epäonnistui.",
    }
  }
}
