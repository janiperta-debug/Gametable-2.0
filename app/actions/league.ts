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

export type LeagueStanding = {
  key: string
  name: string
  tournaments: number
  leaguePoints: number
  matchPoints: number
  points: number
}

// Completed tournament standings contribute placement points to the season.
// League matches retain their existing match scoring, independently.
export async function getLeagueStandings(leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: league } = await supabase.from("events")
    .select("id, host_id, event_type, privacy, event_config").eq("id", leagueId).single()
  if (!league || league.event_type !== "league") return { standings: [] as LeagueStanding[], error: "Liigaa ei löytynyt." }
  if (league.privacy === "private" && league.host_id !== user?.id) {
    const { data: membership } = user ? await supabase.from("event_participants")
      .select("user_id").eq("event_id", leagueId).eq("user_id", user.id).maybeSingle() : { data: null }
    if (!membership) return { standings: [] as LeagueStanding[], error: "Ei käyttöoikeutta." }
  }
  const { getEventStandings } = await import("./event-structure")
  const [{ data: tournaments, error: tournamentError }, { standings: leagueMatches, error: matchError }] = await Promise.all([
    supabase.from("events").select("id, status, event_config").eq("event_type", "tournament").eq("host_id", league.host_id),
    getEventStandings(leagueId),
  ])
  if (tournamentError || matchError) return { standings: [] as LeagueStanding[], error: tournamentError?.message || matchError }
  const config = (league.event_config as Record<string, unknown> | null) || {}
  const rawPoints = Array.isArray(config.placementPoints) ? config.placementPoints : [10, 7, 5, 3, 1]
  const placementPoints = rawPoints.map((point) => Number(point)).filter((point) => Number.isFinite(point) && point >= 0).slice(0, 20)
  const rows = new Map<string, LeagueStanding>()
  for (const row of leagueMatches || []) {
    const key = row.user_id || `league:${row.entry_id}`
    rows.set(key, { key, name: row.name, tournaments: 0, leaguePoints: 0, matchPoints: row.points, points: row.points })
  }
  const linked = (tournaments || []).filter((t) => t.status === "completed" && (t.event_config as Record<string, unknown> | null)?.league_id === leagueId)
  for (const tournament of linked) {
    const { standings, error } = await getEventStandings(tournament.id)
    if (error) continue
    // Tied ranks share placement points; the next rank is skipped.
    let previousSignature = ""
    let rank = 0
    for (const [index, row] of standings.entries()) {
      if (!row.played) continue
      const signature = `${row.points}:${row.wins}:${row.score_for}`
      if (signature !== previousSignature) rank = index + 1
      previousSignature = signature
      const key = row.user_id || `tournament:${tournament.id}:${row.entry_id}`
      const current = rows.get(key) || { key, name: row.name, tournaments: 0, leaguePoints: 0, matchPoints: 0, points: 0 }
      const awarded = placementPoints[rank - 1] || 0
      current.tournaments += 1
      current.leaguePoints += awarded
      current.points = current.leaguePoints + current.matchPoints
      rows.set(key, current)
    }
  }
  return { standings: Array.from(rows.values()).sort((a, b) => b.points - a.points || b.leaguePoints - a.leaguePoints || a.name.localeCompare(b.name)), error: undefined }
}

export async function updateLeaguePlacementPoints(leagueId: string, points: number[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: league } = await supabase.from("events").select("host_id, event_type, event_config").eq("id", leagueId).single()
  if (!user || !league || league.host_id !== user.id || league.event_type !== "league") return { error: "Vain liigan järjestäjä voi muuttaa pisteytystä." }
  if (!Array.isArray(points) || points.length < 1 || points.length > 20 || points.some((p) => !Number.isInteger(p) || p < 0 || p > 1000)) {
    return { error: "Anna 1–20 sijoituspistettä (0–1000)." }
  }
  const config = (league.event_config as Record<string, unknown> | null) || {}
  const { error } = await supabase.from("events").update({ event_config: { ...config, placementPoints: points } }).eq("id", leagueId)
  if (error) return { error: error.message }
  revalidatePath(`/events/${leagueId}`)
  return { error: undefined }
}
