"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type CampaignVisibility = "gm_only" | "players"

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
