"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkAndAwardBadges } from "./badges"

// Completion is explicit and only the league owner can confirm it.
// Every linked event must be completed and at least one match must have
// a recorded result; an empty season cannot produce an achievement.
export async function completeLeagueSeason(seasonId: string) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const { data: season, error } = await db.from("league_seasons")
    .select("id,status,league_id,leagues!inner(owner_id)").eq("id", seasonId).maybeSingle()
  if (error || !season) return { success: false, error: error?.message || "Season not found" }
  const league = Array.isArray(season.leagues) ? season.leagues[0] : season.leagues
  if (league?.owner_id !== user.id) return { success: false, error: "Only the league owner can complete a season" }
  if (season.status !== "active") return { success: false, error: "Season is not active" }
  const { data: links, error: linksError } = await db.from("league_season_events")
    .select("event_id").eq("season_id", seasonId)
  if (linksError) return { success: false, error: linksError.message }
  if (!links?.length) return { success: false, error: "Season has no linked events" }
  const ids = links.map((link) => link.event_id)
  const { data: events, error: eventsError } = await db.from("events").select("id,status").in("id", ids)
  if (eventsError) return { success: false, error: eventsError.message }
  if (events?.length !== ids.length || events.some((event) => event.status !== "completed"))
    return { success: false, error: "Every linked event must be completed" }
  const { count, error: matchError } = await db.from("event_matches")
    .select("*", { count: "exact", head: true }).in("event_id", ids).eq("status", "completed")
  if (matchError) return { success: false, error: matchError.message }
  if (!count) return { success: false, error: "Season requires a completed match" }
  const { data: updated, error: updateError } = await db.from("league_seasons")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", seasonId).eq("status", "active").select("id").maybeSingle()
  if (updateError || !updated) return { success: false, error: updateError?.message || "Season was already updated" }
  const awarded = await checkAndAwardBadges(user.id)
  if (awarded.error) console.error("League organizer badge reconciliation failed:", awarded.error)
  revalidatePath("/trophies")
  return { success: true }
}
