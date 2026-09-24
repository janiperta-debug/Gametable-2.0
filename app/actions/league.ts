"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// A tournament belongs to at most one league. The relationship is stored in
// event_config so existing events and matches remain unchanged.
export async function getLeagueTournaments(leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: league } = await supabase.from("events").select("id, host_id, event_type, privacy").eq("id", leagueId).single()
  if (!league || league.event_type !== "league") return { tournaments: [], available: [], error: "Liigaa ei löytynyt." }
  if (league.privacy === "private" && league.host_id !== user?.id) {
    const { data: membership } = user ? await supabase.from("event_participants").select("user_id").eq("event_id", leagueId).eq("user_id", user.id).maybeSingle() : { data: null }
    if (!membership) return { tournaments: [], available: [], error: "Ei käyttöoikeutta." }
  }
  const { data, error } = await supabase.from("events")
    .select("id, title, starts_at, status, host_id, event_config")
    .eq("event_type", "tournament")
    .eq("host_id", league.host_id)
    .order("starts_at", { ascending: true })
  if (error) return { tournaments: [], available: [], error: error.message }
  const tournaments = (data || []).filter((t) => (t.event_config as Record<string, unknown> | null)?.league_id === leagueId)
  const available = user?.id === league.host_id
    ? (data || []).filter((t) => !(t.event_config as Record<string, unknown> | null)?.league_id && t.status !== "cancelled")
    : []
  return { tournaments, available, error: undefined }
}

export async function setTournamentLeague(leagueId: string, tournamentId: string, linked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Kirjaudu sisään." }
  const { data: league } = await supabase.from("events").select("id, host_id, event_type").eq("id", leagueId).single()
  if (!league || league.event_type !== "league" || league.host_id !== user.id) return { error: "Vain liigan järjestäjä voi muokata turnauksia." }
  const { data: tournament } = await supabase.from("events").select("id, host_id, event_type, event_config").eq("id", tournamentId).single()
  if (!tournament || tournament.event_type !== "tournament" || tournament.host_id !== user.id) return { error: "Voit liittää vain omia turnauksiasi." }
  const config = (tournament.event_config as Record<string, unknown> | null) || {}
  if (linked && config.league_id && config.league_id !== leagueId) return { error: "Turnaus kuuluu jo toiseen liigaan." }
  if (!linked && config.league_id !== leagueId) return { error: "Turnaus ei kuulu tähän liigaan." }
  const { error } = await supabase.from("events").update({
    event_config: { ...config, league_id: linked ? leagueId : undefined },
  }).eq("id", tournamentId).eq("host_id", user.id)
  if (error) return { error: error.message }
  revalidatePath(`/events/${leagueId}`)
  revalidatePath(`/events/${tournamentId}`)
  return { error: undefined }
}
