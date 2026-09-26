"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createLeague(input: { name: string; game: string; description: string; privacy: "public" | "private"; seasonName: string; startsOn?: string; endsOn?: string; awardCategory?: "none" | "league" | "board-games" | "role-playing-games" | "miniatures" | "trading-card-games" }) {
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
  award_config: { category: ["league", "board-games", "role-playing-games", "miniatures", "trading-card-games"].includes(input.awardCategory || "") ? input.awardCategory : "none", places: input.awardCategory && input.awardCategory !== "none" ? [1] : [], confirmed: false },
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
 if (error || !league) return { league: null, seasons: [], events: [], available: [], members: [], results: [], standings: [], isMember: false, error: "Liigaa ei löytynyt." }
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
 // Season standings aggregate completed matches across linked tournaments.
 // A registered user keeps one identity across tournaments; guest entries remain event-specific.
 const {data:allEntries} = tournamentIds.length ? await supabase.from("event_entries")
  .select("id,event_id,user_id,display_name").in("event_id",tournamentIds) : {data:[]}
 const {data:allMatches} = tournamentIds.length ? await supabase.from("event_matches")
  .select("event_id,entry_a_id,entry_b_id,player_a_id,player_b_id,winner_entry_id,winner_id,score_a,score_b,points_a,points_b,status")
  .in("event_id",tournamentIds).eq("status","completed") : {data:[]}
 type Standing = {key:string;name:string;season_id:string;played:number;wins:number;draws:number;losses:number;points:number;score_for:number;score_against:number;events:Set<string>}
 const standingRows=new Map<string,Standing>()
 const allEntryById=new Map((allEntries||[]).map(entry=>[entry.id,entry]))
 const tournamentUserIds=[...new Set((allEntries||[]).map(entry=>entry.user_id).filter((id):id is string=>!!id))]
 const {data:tournamentProfiles}=tournamentUserIds.length?await supabase.from("profiles").select("id,display_name,username").in("id",tournamentUserIds):{data:[]}
 const profileById=new Map([...(memberProfiles||[]),...(tournamentProfiles||[])].map(profile=>[profile.id,profile]))
 for(const match of allMatches||[]){
  const event=events.find(item=>item.id===match.event_id)
  if(!event)continue
  const sideA=match.entry_a_id?allEntryById.get(match.entry_a_id):null
  const sideB=match.entry_b_id?allEntryById.get(match.entry_b_id):null
  const resolvedA=sideA?.user_id||match.player_a_id
  const resolvedB=sideB?.user_id||match.player_b_id
  const sides=[{entry:sideA,userId:resolvedA,score:match.score_a,opponent:match.score_b,points:match.points_a,won:match.winner_entry_id===match.entry_a_id&&!!match.entry_a_id||!!resolvedA&&match.winner_id===resolvedA},
   {entry:sideB,userId:resolvedB,score:match.score_b,opponent:match.score_a,points:match.points_b,won:match.winner_entry_id===match.entry_b_id&&!!match.entry_b_id||!!resolvedB&&match.winner_id===resolvedB}]
  const draw=match.score_a!==null&&match.score_b!==null&&Number(match.score_a)===Number(match.score_b)&&!match.winner_id&&!match.winner_entry_id
  const hasWinner=!!match.winner_id||!!match.winner_entry_id
  for(const side of sides){
   if(!side.entry&&!side.userId)continue
   const key=side.userId?"user:"+side.userId:"guest:"+event.id+":"+side.entry!.id
   const rowKey=event.season_id+":"+key
   const profile=side.userId?profileById.get(side.userId):null
   const name=profile?.display_name||profile?.username||side.entry?.display_name||"Kilpailija"
   let row=standingRows.get(rowKey)
   if(!row){row={key,name,season_id:event.season_id,played:0,wins:0,draws:0,losses:0,points:0,score_for:0,score_against:0,events:new Set()};standingRows.set(rowKey,row)}
   row.played++;row.events.add(event.id)
   if(side.won)row.wins++
   else if(draw)row.draws++
   else if(hasWinner)row.losses++
   if(side.score!==null)row.score_for+=Number(side.score)
   if(side.opponent!==null)row.score_against+=Number(side.opponent)
   // Use the actual points recorded for this match. Unscored matches contribute no points.
   if(side.points!==null)row.points+=Number(side.points)
   else if(side.won)row.points+=3
   else if(draw)row.points+=1
  }
 }
 const standings=Array.from(standingRows.values()).map(({events:playedEvents,...row})=>({...row,tournaments:playedEvents.size}))
  .sort((a,b)=>a.season_id.localeCompare(b.season_id)||b.points-a.points||b.wins-a.wins||(b.score_for-b.score_against)-(a.score_for-a.score_against)||a.name.localeCompare(b.name,"fi"))
 const { data: trophyRows } = ids.length ? await supabase.from("personal_trophies")
  .select("season_id,recipient_id,award_variant,awarded_at")
  .in("season_id", ids).eq("source_type", "league_season") : { data: [] }
 const winnerIds = [...new Set((trophyRows || []).map(trophy => trophy.recipient_id))]
 const { data: winnerProfiles } = winnerIds.length ? await supabase.from("profiles")
  .select("id,display_name,username").in("id", winnerIds) : { data: [] }
 const seasonTrophies = (trophyRows || []).map(trophy => ({
  ...trophy, winner_name: (winnerProfiles || []).find(profile => profile.id === trophy.recipient_id)?.display_name
   || (winnerProfiles || []).find(profile => profile.id === trophy.recipient_id)?.username || "Voittaja",
 }))
 const { data: owned } = user?.id === league.owner_id ? await supabase.from("events").select("id,title,event_type,starts_at,status").eq("host_id", user.id).in("event_type", ["tournament","game_night"]).neq("status","cancelled").order("starts_at", { ascending: false }) : { data: [] }
 return { league, seasons: seasons || [], events, available: (owned || []).filter((event) => !linkedIds.includes(event.id)), members, results, standings, seasonTrophies, isMember:!!user && memberIds.includes(user.id), isOwner: user?.id === league.owner_id, error: undefined }
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
 const { data: season } = await supabase.from("league_seasons").select("id,status").eq("id", seasonId).eq("league_id", leagueId).single()
 if (!user || league?.owner_id !== user.id || !season) return { error: "Ei käyttöoikeutta." }
 if (season.status === "completed") return { error: "Päättyneen kauden tapahtumia ei voi enää muuttaa." }
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
 const { data, error } = await supabase.from("leagues").select("id,name,game,privacy,owner_id,legacy_event_id,league_seasons(id,name,starts_on,ends_on,status)").order("created_at", { ascending: false })
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
 const { data: currentSeason } = await supabase.from("league_seasons").select("status").eq("id", seasonId).eq("league_id", leagueId).single()
 if (currentSeason?.status === "completed") return { error: "Päättynyttä kautta ei voi enää muokata." }
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

export async function searchLeaguePlayers(leagueId:string, query:string) {
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)return {players:[],error:"Kirjaudu sisään."}
 const {data:league}=await supabase.from("leagues").select("owner_id").eq("id",leagueId).single()
 if(league?.owner_id!==user.id)return {players:[],error:"Vain järjestäjä voi hakea osallistujia."}
 const term=query.trim().replace(/^@/,"").slice(0,60)
 if(term.length<2)return {players:[]}
 // Escape PostgREST filter syntax and SQL LIKE wildcards from user input.
 const safe=term.replace(/[,%()\\]/g," ").replace(/[%_]/g," ").trim()
 if(safe.length<2)return {players:[]}
 const {data,error}=await supabase.from("profiles")
  .select("id,username,display_name,avatar_url")
  .or(`username.ilike.%${safe}%,display_name.ilike.%${safe}%`)
  .neq("id",user.id).limit(12)
 if(error)return {players:[],error:"Pelaajien haku epäonnistui."}
 return {players:data||[]}
}

export async function addLeagueMemberById(leagueId:string,playerId:string) {
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)return {error:"Kirjaudu sisään."}
 const {data:league}=await supabase.from("leagues").select("owner_id").eq("id",leagueId).single()
 if(league?.owner_id!==user.id)return {error:"Vain järjestäjä voi lisätä osallistujia."}
 if(playerId===user.id)return {error:"Olet jo liigan järjestäjä."}
 const {data:profile}=await supabase.from("profiles").select("id").eq("id",playerId).maybeSingle()
 if(!profile)return {error:"Pelaajaa ei löytynyt."}
 const {error}=await supabase.from("league_members").upsert({league_id:leagueId,user_id:playerId},{onConflict:"league_id,user_id",ignoreDuplicates:true})
 if(error)return {error:error.message}
 revalidatePath("/leagues/"+leagueId)
 return {success:true}
}

export async function setLeagueSeasonTrophy(leagueId: string, seasonId: string, variant: "crystal" | "pennant" | "sculpture") {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user || !["crystal","pennant","sculpture"].includes(variant)) return { error: "Ei käyttöoikeutta." }
 const { data: league } = await supabase.from("leagues").select("owner_id").eq("id",leagueId).maybeSingle()
 if (league?.owner_id !== user.id) return { error: "Vain liigan järjestäjä voi valita palkinnon." }
 const { data: season } = await supabase.from("league_seasons").select("award_config,status")
  .eq("id",seasonId).eq("league_id",leagueId).maybeSingle()
 if (!season) return { error: "Kautta ei löytynyt." }
 const config = (season.award_config || {}) as Record<string,unknown>
 if (!config.category || config.category === "none") return { error: "Kaudella ei ole palkintoa käytössä." }
 if (season.status === "completed") return { error: "Päättyneen kauden palkintoa ei voi vaihtaa." }
 const { error } = await supabase.from("league_seasons").update({
  award_config: { ...config, category:"league", places:[1], variant, confirmed:false }
 }).eq("id",seasonId).eq("league_id",leagueId).neq("status","completed")
 if (!error) revalidatePath("/leagues/"+leagueId)
 return { error: error?.message }
}
