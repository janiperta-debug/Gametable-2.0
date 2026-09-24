"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createLeague(input: { name: string; game: string; description: string; privacy: "public" | "private"; seasonName: string; startsOn?: string; endsOn?: string }) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return { error: "Kirjaudu sisään." }
 if (input.name.trim().length < 2 || !input.seasonName.trim()) return { error: "Anna liigan ja ensimmäisen kauden nimet." }
 if (input.startsOn && input.endsOn && input.endsOn < input.startsOn) return { error: "Kauden päättymispäivä on ennen alkua." }
 const { data: league, error } = await supabase.from("leagues").insert({
  owner_id: user.id, name: input.name.trim(), game: input.game.trim() || null,
  description: input.description.trim() || null, privacy: input.privacy,
 }).select("id").single()
 if (error || !league) return { error: error?.message || "Liigan luonti epäonnistui." }
 const { error: seasonError } = await supabase.from("league_seasons").insert({
  league_id: league.id, name: input.seasonName.trim(),
  starts_on: input.startsOn || null, ends_on: input.endsOn || null,
 })
 if (seasonError) {
  await supabase.from("leagues").delete().eq("id", league.id).eq("owner_id", user.id)
  return { error: seasonError.message }
 }
 revalidatePath("/leagues")
 return { id: league.id }
}

export async function getLeague(leagueId: string) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 const { data: league, error } = await supabase.from("leagues").select("*").eq("id", leagueId).single()
 if (error || !league) return { league: null, seasons: [], events: [], available: [], error: "Liigaa ei löytynyt." }
 const { data: seasons } = await supabase.from("league_seasons").select("*").eq("league_id", leagueId).order("created_at", { ascending: false })
 const ids = (seasons || []).map((season) => season.id)
 const { data: links } = ids.length ? await supabase.from("league_season_events").select("season_id,event_id").in("season_id", ids) : { data: [] }
 const linkedIds = (links || []).map((link) => link.event_id)
 const { data: linkedEvents } = linkedIds.length ? await supabase.from("events").select("id,title,event_type,starts_at,status").in("id", linkedIds) : { data: [] }
 const events = (links || []).flatMap((link) => {
  const event = (linkedEvents || []).find((item) => item.id === link.event_id)
  return event ? [{ ...event, season_id: link.season_id }] : []
 })
 const { data: owned } = user?.id === league.owner_id ? await supabase.from("events").select("id,title,event_type,starts_at,status").eq("host_id", user.id).in("event_type", ["tournament","game_night"]).neq("status","cancelled").order("starts_at", { ascending: false }) : { data: [] }
 return { league, seasons: seasons || [], events, available: (owned || []).filter((event) => !linkedIds.includes(event.id)), error: undefined }
}

export async function addLeagueSeason(leagueId: string, name: string) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 const { data: league } = await supabase.from("leagues").select("owner_id").eq("id", leagueId).single()
 if (!user || league?.owner_id !== user.id) return { error: "Vain liigan järjestäjä voi lisätä kausia." }
 if (!name.trim()) return { error: "Anna kauden nimi." }
 const { error } = await supabase.from("league_seasons").insert({ league_id: leagueId, name: name.trim() })
 if (!error) revalidatePath("/leagues/" + leagueId)
 return { error: error?.message }
}

export async function linkSeasonEvent(leagueId: string, seasonId: string, eventId: string, linked: boolean) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 const { data: league } = await supabase.from("leagues").select("owner_id").eq("id", leagueId).single()
 const { data: season } = await supabase.from("league_seasons").select("id").eq("id", seasonId).eq("league_id", leagueId).single()
 if (!user || league?.owner_id !== user.id || !season) return { error: "Ei käyttöoikeutta." }
 const { data: event } = await supabase.from("events").select("host_id,event_type").eq("id", eventId).single()
 if (!event || event.host_id !== user.id || !["tournament","game_night"].includes(event.event_type)) return { error: "Voit liittää omia turnauksiasi ja peli-iltojasi." }
 const { error } = linked
  ? await supabase.from("league_season_events").insert({ season_id: seasonId, event_id: eventId })
  : await supabase.from("league_season_events").delete().eq("season_id", seasonId).eq("event_id", eventId)
 if (!error) revalidatePath("/leagues/" + leagueId)
 return { error: error?.message }
}
