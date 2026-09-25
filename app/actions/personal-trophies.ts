"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type PersonalTrophy = {
 id: string; recipient_id: string; source_type: "tournament" | "league_season"
 source_name: string; category: string; placement: number; award_variant: string | null; awarded_at: string
 event_id: string | null; season_id: string | null
}

export async function getMyPersonalTrophies(): Promise<{ trophies: PersonalTrophy[]; error?: string }> {
 const db = await createClient()
 const { data: { user } } = await db.auth.getUser()
 if (!user) return { trophies: [] }
 const { data, error } = await db.from("personal_trophies")
  .select("id,recipient_id,source_type,source_name,category,placement,award_variant,awarded_at,event_id,season_id")
  .eq("recipient_id", user.id).order("awarded_at", { ascending: false })
 return { trophies: (data || []) as PersonalTrophy[], error: error?.message }
}

export async function getSourcePersonalTrophies(sourceType: "tournament" | "league_season", sourceId: string) {
 const db = await createClient()
 const { data: { user } } = await db.auth.getUser()
 if (!user) return { awarded: false }
 // Only the organizer needs to see whether issuance has already happened.
 const source = sourceType === "tournament"
  ? await db.from("events").select("host_id").eq("id", sourceId).maybeSingle()
  : await db.from("league_seasons").select("leagues!inner(owner_id)").eq("id", sourceId).maybeSingle()
 const owner = sourceType === "tournament"
  ? (source.data as {host_id?:string}|null)?.host_id
  : ((source.data as {leagues?:{owner_id:string}|{owner_id:string}[]}|null)?.leagues)
 const ownerId = typeof owner === "string" ? owner : Array.isArray(owner) ? owner[0]?.owner_id : owner?.owner_id
 if (ownerId !== user.id) return { awarded: false }
 const column = sourceType === "tournament" ? "event_id" : "season_id"
 const { count } = await db.from("personal_trophies").select("*", { count: "exact", head: true }).eq(column, sourceId)
 return { awarded: (count || 0) > 0 }
}

export async function awardPersonalTrophies(sourceType: "tournament" | "league_season", sourceId: string, recipients: string[]) {
 const db = await createClient()
 const { data: { user } } = await db.auth.getUser()
 if (!user) return { success: false, error: "Kirjaudu sisään." }
 if (!recipients.length || recipients.length > 3 || new Set(recipients).size !== recipients.length)
  return { success: false, error: "Valitse 1–3 eri palkinnonsaajaa." }
 const { data, error } = await db.rpc("issue_personal_trophies", {
  p_source_type: sourceType, p_source_id: sourceId, p_recipients: recipients
 })
 if (error) return { success: false, error: error.message }
 revalidatePath("/trophies")
 revalidatePath("/events")
 if (sourceType === "tournament") revalidatePath(`/events/${sourceId}`)
 return { success: true, count: Number(data || 0) }
}

export async function awardLeagueWinnerTrophy(seasonId: string, recipientId: string, variant: "crystal" | "pennant" | "sculpture") {
 const db = await createClient()
 const { data: { user } } = await db.auth.getUser()
 if (!user) return { success: false, error: "Kirjaudu sisään." }
 const { error } = await db.rpc("issue_league_winner_trophy", { p_season_id: seasonId, p_recipient_id: recipientId, p_variant: variant })
 if (error) return { success: false, error: error.message }
 revalidatePath("/trophies")
 return { success: true }
}
