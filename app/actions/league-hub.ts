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
 if (error || !league) return { league: null, seasons: [], events: [], available: [], members: [], results: [], isMember: false, error: "Liigaa ei löytynyt." }
 const { data: seasons } = await supabase.from("league_seasons").select("*").eq("league_id", leagueId).order("created_at", { ascending: false })
 const ids = (seasons || []).map((season) => season.id)
 const { data: links } = ids.length ? await supabase.from("league_season_events").select("season_id,event_id").in("season_id", ids) : { data: [] }
 const linkedIds = (links || []).map((link) => link.event_id)
 const { data: linkedEvents } = linkedIds.length ? await supabase.from("events").select("id,title,event_type,starts_at,status").in("id", linkedIds) : { data: [] }
 const events = (links || []).flatMap((link) => {
  const event = (linkedEvents || []).find((item) => item.id === link.event_id)
  return event ? [{ ...event, season_id: link.season_id }] : []
 })
 const { data: memberRows } = await supabase.from("league_members").select("user_id,joined_at").eq("league_id",leagueId).order("joined_at")
 const memberIds = [...new Set([league.owner_id,...(memberRows || []).map(row=>row.user_id)])]
 const { data: memberProfiles } = memberIds.length ? await supabase.from("profiles").select("id,display_name,username,avatar_url").in("id",memberIds) : {data:[]}
 const members = memberIds.map(userId => ({
  user_id:userId, isOwner:userId===league.owner_id,
  display_name:(memberProfiles || []).find(p=>p.id===userId)?.display_name || (memberProfiles || []).find(p=>p.id===userId)?.username || "Pelaaja",
  avatar_url:(memberProfiles || []).find(p=>p.id===userId)?.avatar_url || null,
 }))
 // Show only actual recorded match results from linked events, never infer scores.
 const tournamentIds = events.filter(e=>e.event_type==="tournament").map(e=>e.id)
 const {data:matchRows} = tournamentIds.length ? await supabase.from("event_matches")
  .select("id,event_id,entry_a_id,entry_b_id,score_a,score_b,result,status")
  .in("event_id",tournamentIds).eq("status","completed").order("created_at",{ascending:false}).limit(100) : {data:[]}
 const {data:entryRows} = tournamentIds.length ? await supabase.from("event_entries")
  .select("id,display_name,event_id").in("event_id",tournamentIds) : {data:[]}
 const results = (matchRows || []).map(match=>({
  ...match,
  event_title:events.find(e=>e.id===match.event_id)?.title || "Turnaus",
  player_a:(entryRows || []).find(e=>e.id===match.entry_a_id)?.display_name || "Pelaaja A",
  player_b:(entryRows || []).find(e=>e.id===match.entry_b_id)?.display_name || "Pelaaja B",
  season_id:events.find(e=>e.id===match.event_id)?.season_id || "",
 }))
 const { data: owned } = user?.id === league.owner_id ? await supabase.from("events").select("id,title,event_type,starts_at,status").eq("host_id", user.id).in("event_type", ["tournament","game_night"]).neq("status","cancelled").order("starts_at", { ascending: false }) : { data: [] }
 return { league, seasons: seasons || [], events, available: (owned || []).filter((event) => !linkedIds.includes(event.id)), members, results, isMember:!!user && memberIds.includes(user.id), isOwner: user?.id === league.owner_id, error: undefined }
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


export async function listLeagues() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 const { data, error } = await supabase.from("leagues").select("id,name,game,privacy,owner_id,legacy_event_id,league_seasons(id,name,starts_on,ends_on)").order("created_at", { ascending: false })
 if (error) return { leagues: [], error: error.message }
 return { leagues: (data || []).map((league) => ({ ...league, isOwner: league.owner_id === user?.id })), error: undefined }
}

// Convert an old event-based league without deleting its entries, matches or history.
// Repeated calls return the same destination league. Existing tournament links are
// copied into the first season, and the original event stays available for audit.
export async function convertLegacyLeague(eventId: string) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return { error: "Kirjaudu sisään." }
 const { data: source } = await supabase.from("events")
  .select("id,host_id,title,description,privacy,starts_at,ends_at,event_type,event_config")
  .eq("id", eventId).eq("event_type", "league").single()
 if (!source || source.host_id !== user.id) return { error: "Vain alkuperäinen järjestäjä voi siirtää liigan." }
 const { data: existing } = await supabase.from("leagues").select("id").eq("legacy_event_id", eventId).maybeSingle()
 if (existing) return { id: existing.id }
 const config = (source.event_config || {}) as Record<string, unknown>
 const { data: league, error } = await supabase.from("leagues").insert({
  owner_id: user.id, name: source.title, description: source.description,
  privacy: source.privacy === "public" ? "public" : "private", legacy_event_id: eventId,
 }).select("id").single()
 if (error || !league) {
  const { data: concurrent } = await supabase.from("leagues").select("id").eq("legacy_event_id", eventId).maybeSingle()
  return concurrent ? { id: concurrent.id } : { error: error?.message || "Siirto epäonnistui." }
 }
 const rawPoints = Array.isArray(config.placementPoints) ? config.placementPoints : [10,7,5,3,1]
 const points = rawPoints.filter((value): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1000).slice(0,20)
 const { data: season, error: seasonError } = await supabase.from("league_seasons").insert({
  league_id: league.id, name: "Ensimmäinen kausi",
  starts_on: source.starts_at?.slice(0,10) || null,
  ends_on: source.ends_at?.slice(0,10) || null,
  placement_points: points.length ? points : [10,7,5,3,1],
 }).select("id").single()
 if (seasonError || !season) {
  await supabase.from("leagues").delete().eq("id", league.id)
  return { error: seasonError?.message || "Kauden luonti epäonnistui." }
 }
 const { data: tournaments, error: tournamentError } = await supabase.from("events")
  .select("id,event_config").eq("host_id", user.id).eq("event_type", "tournament")
 if (tournamentError) return { id: league.id, warning: "Liiga siirrettiin, mutta turnausten haku epäonnistui. Vanhat tiedot säilyvät." }
 const linked = (tournaments || []).filter((event) => (event.event_config as Record<string, unknown> | null)?.league_id === eventId)
 if (linked.length) {
  const { error: linkError } = await supabase.from("league_season_events").insert(linked.map((event) => ({ season_id: season.id, event_id: event.id })))
  if (linkError) return { id: league.id, warning: "Liiga siirrettiin, mutta turnausten liittäminen vaatii tarkistuksen. Vanhat tiedot säilyvät." }
 }
 revalidatePath("/events")
 revalidatePath("/leagues/" + league.id)
 return { id: league.id }
}


export async function updateLeague(leagueId: string, input: { name: string; game: string; description: string; privacy: "public" | "private" }) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return { error: "Kirjaudu sisään." }
 if (input.name.trim().length < 2 || input.name.trim().length > 120) return { error: "Liigan nimessä tulee olla 2–120 merkkiä." }
 const { data, error } = await supabase.from("leagues").update({
  name: input.name.trim(), game: input.game.trim() || null,
  description: input.description.trim() || null, privacy: input.privacy,
 }).eq("id", leagueId).eq("owner_id", user.id).select("id").maybeSingle()
 if (error || !data) return { error: error?.message || "Liigan muokkaus ei onnistunut." }
 revalidatePath("/leagues/" + leagueId)
 revalidatePath("/events")
 return { success: true }
}

export async function updateLeagueSeason(leagueId: string, seasonId: string, input: { name: string; startsOn: string; endsOn: string }) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 const { data: league } = await supabase.from("leagues").select("owner_id").eq("id", leagueId).single()
 if (!user || league?.owner_id !== user.id) return { error: "Vain järjestäjä voi muokata kautta." }
 if (!input.name.trim() || input.name.trim().length > 120) return { error: "Anna kauden nimi (enintään 120 merkkiä)." }
 if (input.startsOn && input.endsOn && input.endsOn < input.startsOn) return { error: "Päättymispäivä ei voi olla ennen alkua." }
 const { data, error } = await supabase.from("league_seasons").update({
  name: input.name.trim(), starts_on: input.startsOn || null, ends_on: input.endsOn || null,
 }).eq("id", seasonId).eq("league_id", leagueId).select("id").maybeSingle()
 if (error || !data) return { error: error?.message || "Kauden muokkaus ei onnistunut." }
 revalidatePath("/leagues/" + leagueId)
 return { success: true }
}

export async function deleteLeague(leagueId: string) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return { error: "Kirjaudu sisään." }
 const { data: league } = await supabase.from("leagues").select("id,owner_id").eq("id", leagueId).single()
 if (!league || league.owner_id !== user.id) return { error: "Vain järjestäjä voi poistaa liigan." }
 // Cascades remove seasons and their links; linked tournaments and game nights remain.
 const { data, error } = await supabase.from("leagues").delete().eq("id", leagueId).eq("owner_id", user.id).select("id").maybeSingle()
 if (error || !data) return { error: error?.message || "Liigan poistaminen ei onnistunut." }
 revalidatePath("/events")
 revalidatePath("/leagues")
 return { success: true }
}

export async function joinLeague(leagueId:string) {
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)return {error:"Kirjaudu sisään."}
 const {data:league}=await supabase.from("leagues").select("id,privacy,owner_id").eq("id",leagueId).single()
 if(!league || league.privacy!=="public")return {error:"Vain julkisiin liigoihin voi liittyä itse."}
 if(league.owner_id===user.id)return {success:true}
 const {error}=await supabase.from("league_members").upsert({league_id:leagueId,user_id:user.id},{onConflict:"league_id,user_id",ignoreDuplicates:true})
 if(error)return {error:error.message}
 revalidatePath("/leagues/"+leagueId);revalidatePath("/events")
 return {success:true}
}

export async function leaveLeague(leagueId:string) {
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)return {error:"Kirjaudu sisään."}
 const {error}=await supabase.from("league_members").delete().eq("league_id",leagueId).eq("user_id",user.id)
 if(error)return {error:error.message}
 revalidatePath("/leagues/"+leagueId);revalidatePath("/events")
 return {success:true}
}

export async function addLeagueMember(leagueId:string, username:string) {
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 const {data:league}=await supabase.from("leagues").select("owner_id").eq("id",leagueId).single()
 if(!user || league?.owner_id!==user.id)return {error:"Vain järjestäjä voi lisätä jäseniä."}
 const clean=username.trim().replace(/^@/,"")
 if(!clean)return {error:"Anna käyttäjätunnus."}
 const {data:profile}=await supabase.from("profiles").select("id").ilike("username",clean).maybeSingle()
 if(!profile)return {error:"Käyttäjätunnusta ei löytynyt."}
 if(profile.id===user.id)return {error:"Olet jo liigan järjestäjä."}
 const {error}=await supabase.from("league_members").upsert({league_id:leagueId,user_id:profile.id},{onConflict:"league_id,user_id",ignoreDuplicates:true})
 if(error)return {error:error.message}
 revalidatePath("/leagues/"+leagueId)
 return {success:true}
}

export async function removeLeagueMember(leagueId:string,memberId:string) {
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 const {data:league}=await supabase.from("leagues").select("owner_id").eq("id",leagueId).single()
 if(!user || league?.owner_id!==user.id)return {error:"Vain järjestäjä voi poistaa jäseniä."}
 const {error}=await supabase.from("league_members").delete().eq("league_id",leagueId).eq("user_id",memberId)
 if(error)return {error:error.message}
 revalidatePath("/leagues/"+leagueId)
 return {success:true}
}
