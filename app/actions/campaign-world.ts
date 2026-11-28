"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type CampaignVisibility = "gm_only" | "players"

export async function approveCampaignImportItems(batchId: string, itemIds: string[]) {
  if (!Array.isArray(itemIds) || itemIds.length < 1 || itemIds.length > 100 ||
      itemIds.some((id) => typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    return { success: false as const, error: "Valitse vähintään yksi kelvollinen ehdotus." }
  }

  const access = await requireCampaignGMFromBatch(batchId)
  if ("error" in access) return { success: false as const, error: access.error }
  if (!["review", "partial"].includes(access.status)) {
    return { success: false as const, error: "Tämä tuontierä ei ole hyväksyttävässä tilassa." }
  }

  const db = createServiceClient()
  const { data: items, error: itemsError } = await db
    .from("campaign_import_items")
    .select("id, entity_type, name, raw_text, parsed_data, source_id, source_reference, proposed_relationships, status")
    .eq("batch_id", batchId)
    .eq("event_id", access.eventId)
    .in("id", itemIds)

  if (itemsError) return { success: false as const, error: itemsError.message }
  if (!items?.length) return { success: false as const, error: "Valittuja ehdotuksia ei löytynyt." }

  const { data: existingEntities, error: existingError } = await db
    .from("campaign_entities")
    .select("id, entity_type, name")
    .eq("event_id", access.eventId)
    .eq("status", "active")
  if (existingError) return { success: false as const, error: existingError.message }

  const entityByKey = new Map<string, { id: string; entity_type: string; name: string }>()
  for (const entity of existingEntities ?? []) {
    entityByKey.set(`${entity.entity_type}:${entity.name.trim().toLocaleLowerCase("fi-FI")}`, entity)
  }

  const relationshipCandidates: Array<{ sourceEntityId: string; relationships: any[] }> = []
  const errors: string[] = []
  let imported = 0

  for (const item of items) {
    if (item.status === "imported") {
      const { data: prior } = await db.from("campaign_entity_sources")
        .select("entity_id").eq("import_item_id", item.id).maybeSingle()
      if (prior?.entity_id && Array.isArray(item.proposed_relationships) && item.proposed_relationships.length) {
        relationshipCandidates.push({ sourceEntityId: prior.entity_id, relationships: item.proposed_relationships })
      }
      continue
    }
    if (!["needs_review", "accepted"].includes(item.status)) continue

    const entityType = item.entity_type as CampaignEntityType
    const name = (item.name ?? "").trim()
    if (!name) {
      errors.push("Yhdeltä ehdotukselta puuttuu nimi.")
      continue
    }

    const key = `${entityType}:${name.toLocaleLowerCase("fi-FI")}`
    let entity = entityByKey.get(key)

    if (!entity) {
      const { data: created, error: createError } = await db
        .from("campaign_entities")
        .insert({
          event_id: access.eventId,
          entity_type: entityType,
          name,
          summary: typeof item.raw_text === "string" ? item.raw_text : "",
          details: item.parsed_data && typeof item.parsed_data === "object" ? item.parsed_data : {},
          visibility: "gm_only",
          status: "active",
          created_by: access.userId,
        })
        .select("id, entity_type, name")
        .single()

      if (createError || !created) {
        const { data: retryMatch } = await db.from("campaign_entities")
          .select("id, entity_type, name")
          .eq("event_id", access.eventId)
          .eq("entity_type", entityType)
          .eq("status", "active")
          .limit(100)
        const exactRetryMatch = (retryMatch ?? []).find((candidate) => candidate.name.trim().toLocaleLowerCase("fi-FI") === name.toLocaleLowerCase("fi-FI"))
        if (!exactRetryMatch) {
          errors.push(`${name}: ${createError?.message ?? "Kohteen luonti epäonnistui."}`)
          continue
        }
        entity = exactRetryMatch
      } else {
        entity = created
      }
      entityByKey.set(key, entity)
    }

    const { data: priorProvenance, error: provenanceLookupError } = await db
      .from("campaign_entity_sources")
      .select("id, entity_id")
      .eq("import_item_id", item.id)
      .maybeSingle()
    if (provenanceLookupError) {
      errors.push(`${name}: lähdeviitteen tarkistus epäonnistui.`)
      continue
    }

    if (!priorProvenance) {
      const { error: provenanceInsertError } = await db.from("campaign_entity_sources").insert({
        event_id: access.eventId,
        entity_id: entity.id,
        import_item_id: item.id,
        source_id: item.source_id,
        source_reference: item.source_reference ?? {},
        quote: typeof item.source_reference?.quote === "string" ? item.source_reference.quote : null,
      })
      if (provenanceInsertError) {
        errors.push(`${name}: lähdeviitteen tallennus epäonnistui (${provenanceInsertError.message}).`)
        continue
      }
    } else {
      entity = { ...entity, id: priorProvenance.entity_id }
    }

    const { error: markError } = await db.from("campaign_import_items")
      .update({ status: "imported", reviewed_by: access.userId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .eq("event_id", access.eventId)
    if (markError) {
      errors.push(`${name}: tuontitilan päivitys epäonnistui.`)
      continue
    }

    const relationships = Array.isArray(item.proposed_relationships) ? item.proposed_relationships : []
    if (relationships.length) relationshipCandidates.push({ sourceEntityId: entity.id, relationships })
    imported += 1
  }

  let relationshipsCreated = 0
  for (const candidate of relationshipCandidates) {
    for (const relationship of candidate.relationships.slice(0, 20)) {
      const targetName = typeof relationship?.targetName === "string" ? relationship.targetName.trim() : ""
      const relationType = typeof relationship?.relationshipType === "string" ? relationship.relationshipType.trim().slice(0, 80) : ""
      if (!targetName || !relationType) continue
      const target = [...entityByKey.values()].find((entity) => entity.name.trim().toLocaleLowerCase("fi-FI") === targetName.toLocaleLowerCase("fi-FI"))
      if (!target || target.id === candidate.sourceEntityId) continue
      const { error: relationError } = await db.from("campaign_entity_relations").upsert({
        event_id: access.eventId,
        source_entity_id: candidate.sourceEntityId,
        target_entity_id: target.id,
        relation_type: relationType,
        description: typeof relationship.description === "string" ? relationship.description.slice(0, 500) : "",
        visibility: "gm_only",
        created_by: access.userId,
      }, { onConflict: "event_id,source_entity_id,target_entity_id,relation_type", ignoreDuplicates: true })
      if (!relationError) relationshipsCreated += 1
      else errors.push(`Suhteen tallennus epäonnistui: ${relationError.message}`)
    }
  }

  const { count: pendingCount } = await db.from("campaign_import_items")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId)
    .in("status", ["needs_review", "accepted"])
  const completed = (pendingCount ?? 0) === 0 && errors.length === 0
  await db.from("campaign_import_batches").update({
    status: completed ? "completed" : "review",
    completed_at: completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
    error_message: errors.length ? errors.slice(0, 10).join(" ") : null,
  }).eq("id", batchId).eq("event_id", access.eventId)

  revalidatePath("/events/" + access.eventId)
  return { success: errors.length === 0, error: errors.length ? errors.join(" ") : undefined, imported, relationshipsCreated, remaining: pendingCount ?? 0, errors }
}

async function requireCampaignGM(eventId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Kirjautuminen vaaditaan." as const }

  const db = createServiceClient()
  const { data: event, error } = await db.from("events")
    .select("id, host_id, event_type")
    .eq("id", eventId)
    .maybeSingle()

  if (error || !event || event.event_type !== "campaign") return { error: "Kampanjaa ei löytynyt." as const }
  if (event.host_id !== user.id) return { error: "Vain kampanjanjohtaja voi muokata kampanjan tietoja." as const }
  return { userId: user.id, eventId }
}

export async function updateCampaignEntityVisibility(eventId: string, entityId: string, visibility: CampaignVisibility) {
  if (!["gm_only", "players"].includes(visibility)) return { success: false as const, error: "Virheellinen näkyvyysasetus." }
  const access = await requireCampaignGM(eventId)
  if ("error" in access) return { success: false as const, error: access.error }

  const db = createServiceClient()
  const { data, error } = await db.from("campaign_entities")
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq("id", entityId).eq("event_id", eventId).eq("status", "active")
    .select("id, visibility").maybeSingle()

  if (error || !data) return { success: false as const, error: error?.message ?? "Kohteen näkyvyyden muuttaminen epäonnistui." }
  revalidatePath(`/events/${eventId}`)
  return { success: true as const, visibility: data.visibility as CampaignVisibility }
}

export async function assignCampaignCharacter(eventId: string, entityId: string, participantUserId: string | null) {
  const access = await requireCampaignGM(eventId)
  if ("error" in access) return { success: false as const, error: access.error }

  const db = createServiceClient()
  if (participantUserId) {
    const { data: participant, error: participantError } = await db.from("event_participants")
      .select("id").eq("event_id", eventId).eq("user_id", participantUserId).eq("status", "attending").maybeSingle()
    if (participantError || !participant) return { success: false as const, error: "Hahmon voi kohdistaa vain kampanjaan liittyneelle osallistujalle." }
  }

  const { data, error } = await db.from("campaign_entities")
    .update({ assigned_to_user_id: participantUserId, updated_at: new Date().toISOString() })
    .eq("id", entityId).eq("event_id", eventId).eq("entity_type", "character").eq("status", "active")
    .select("id, assigned_to_user_id").maybeSingle()

  if (error || !data) return { success: false as const, error: error?.message ?? "Hahmon kohdistaminen epäonnistui." }
  revalidatePath(`/events/${eventId}`)
  return { success: true as const, assignedToUserId: data.assigned_to_user_id as string | null }
}

export async function getCampaignWorldEntities(eventId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false as const, error: "Kirjautuminen vaaditaan.", entities: [], relationships: [], participants: [], isGM: false }

  const { data: event, error: eventError } = await supabase.from("events")
    .select("id, event_type, host_id").eq("id", eventId).maybeSingle()
  if (eventError || !event || event.event_type !== "campaign") return { success: false as const, error: "Kampanjaa ei löytynyt.", entities: [], relationships: [], participants: [], isGM: false }

  const isGM = event.host_id === user.id
  const [{ data: entities, error: entitiesError }, { data: relationships, error: relationsError }] = await Promise.all([
    supabase.from("campaign_entities")
      .select("id, entity_type, name, summary, details, visibility, assigned_to_user_id, status, created_at")
      .eq("event_id", eventId).eq("status", "active")
      .order("entity_type", { ascending: true }).order("name", { ascending: true }),
    supabase.from("campaign_entity_relations")
      .select("id, source_entity_id, target_entity_id, relation_type, description, visibility")
      .eq("event_id", eventId),
  ])

  if (entitiesError || relationsError) return {
    success: false as const,
    error: entitiesError?.message ?? relationsError?.message ?? "Kampanjatietojen lataaminen epäonnistui.",
    entities: [], relationships: [], participants: [], isGM,
  }

  let participants: Array<{ user_id: string; display_name: string | null; username: string | null }> = []
  if (isGM) {
    const db = createServiceClient()
    const { data: rows } = await db.from("event_participants")
      .select("user_id, user:profiles!event_participants_user_id_fkey(display_name, username)")
      .eq("event_id", eventId).eq("status", "attending")
    participants = (rows ?? []).map((row: any) => {
      const profile = Array.isArray(row.user) ? row.user[0] : row.user
      return { user_id: row.user_id, display_name: profile?.display_name ?? null, username: profile?.username ?? null }
    })
  }

  return { success: true as const, entities: entities ?? [], relationships: relationships ?? [], participants, isGM }
}
