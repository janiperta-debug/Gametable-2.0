"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type CampaignEntityType = "character" | "person" | "location" | "faction" | "quest" | "item" | "creature" | "history" | "rule" | "other"

async function requireCampaignGMFromBatch(batchId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Kirjautuminen vaaditaan." as const }

  const db = createServiceClient()
  const { data: batch, error } = await db
    .from("campaign_import_batches")
    .select("id, event_id, status, event:events!inner(id, host_id, event_type)")
    .eq("id", batchId)
    .maybeSingle()

  if (error || !batch) return { error: "Tuontierää ei löytynyt." as const }
  const event = Array.isArray(batch.event) ? batch.event[0] : batch.event
  if (!event || event.event_type !== "campaign" || event.host_id !== user.id) {
    return { error: "Vain kampanjanjohtaja voi käsitellä tämän kampanjan aineistoa." as const }
  }

  return { userId: user.id, eventId: batch.event_id, status: batch.status }
}

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
    if (item.status === "imported") continue
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
          .ilike("name", name)
          .eq("status", "active")
          .maybeSingle()
        if (!retryMatch) {
          errors.push(`${name}: ${createError?.message ?? "Kohteen luonti epäonnistui."}`)
          continue
        }
        entity = retryMatch
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
  return { success: errors.length === 0, imported, relationshipsCreated, remaining: pendingCount ?? 0, errors }
}

export async function getCampaignWorldEntities(eventId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false as const, error: "Kirjautuminen vaaditaan.", entities: [], relationships: [] }

  const { data: event, error: eventError } = await supabase.from("events")
    .select("id, event_type").eq("id", eventId).maybeSingle()
  if (eventError || !event || event.event_type !== "campaign") {
    return { success: false as const, error: "Kampanjaa ei löytynyt.", entities: [], relationships: [] }
  }

  const [{ data: entities, error: entitiesError }, { data: relationships, error: relationsError }] = await Promise.all([
    supabase.from("campaign_entities")
      .select("id, entity_type, name, summary, details, visibility, status, created_at")
      .eq("event_id", eventId).eq("status", "active")
      .order("entity_type", { ascending: true }).order("name", { ascending: true }),
    supabase.from("campaign_entity_relations")
      .select("id, source_entity_id, target_entity_id, relation_type, description, visibility")
      .eq("event_id", eventId),
  ])

  if (entitiesError || relationsError) {
    return { success: false as const, error: entitiesError?.message ?? relationsError?.message ?? "Kampanjatietojen lataaminen epäonnistui.", entities: [], relationships: [] }
  }

  return { success: true as const, entities: entities ?? [], relationships: relationships ?? [] }
}
