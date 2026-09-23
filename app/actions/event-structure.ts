"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type EventSession = {
  id: string
  event_id: string
  title: string
  session_number: number | null
  starts_at: string | null
  ends_at: string | null
  notes: string | null
  status: string
  config: Record<string, unknown>
}

export type EventRound = {
  id: string
  event_id: string
  round_number: number
  title: string | null
  starts_at: string | null
  status: string
  config: Record<string, unknown>
}

async function requireHost(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: "Unauthorized" as const }
  const { data: event } = await supabase.from("events").select("host_id").eq("id", eventId).single()
  if (!event || event.host_id !== user.id) return { supabase, error: "Only the event organizer can manage its structure." as const }
  return { supabase, user }
}

export async function getEventStructure(eventId: string) {
  const supabase = await createClient()
  const [{ data: sessions, error: sessionsError }, { data: rounds, error: roundsError }] = await Promise.all([
    supabase.from("event_sessions").select("*").eq("event_id", eventId).order("session_number", { ascending: true }),
    supabase.from("event_rounds").select("*").eq("event_id", eventId).order("round_number", { ascending: true }),
  ])
  const { data: matches, error: matchesError } = await supabase.from("event_matches").select("*").eq("event_id", eventId).order("created_at", { ascending: true })
  const { data: participants } = await supabase.from("event_participants").select("user_id, status").eq("event_id", eventId).in("status", ["attending", "maybe"])
  const userIds = (participants || []).map((p) => p.user_id)
  const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, display_name, username").in("id", userIds) : { data: [] as any[] }
  return { sessions: sessions || [], rounds: rounds || [], matches: matches || [], participants: participants || [], profiles: profiles || [], error: sessionsError?.message || roundsError?.message || matchesError?.message }
}

export async function addEventSession(eventId: string, data: { title: string; starts_at?: string; notes?: string }) {
  const { supabase, error } = await requireHost(eventId)
  if (error) return { error }
  const { count } = await supabase.from("event_sessions").select("*", { count: "exact", head: true }).eq("event_id", eventId)
  const { data: session, error: insertError } = await supabase.from("event_sessions").insert({
    event_id: eventId, title: data.title.trim(), session_number: (count || 0) + 1,
    starts_at: data.starts_at || null, notes: data.notes?.trim() || null,
  }).select().single()
  if (insertError) return { error: insertError.message }
  revalidatePath("/events/" + eventId)
  return { session }
}

export async function addEventRound(eventId: string, data: { title?: string; starts_at?: string }) {
  const { supabase, error } = await requireHost(eventId)
  if (error) return { error }
  const { data: existing } = await supabase.from("event_rounds").select("round_number").eq("event_id", eventId).order("round_number", { ascending: false }).limit(1)
  const roundNumber = (existing?.[0]?.round_number || 0) + 1
  const { data: round, error: insertError } = await supabase.from("event_rounds").insert({
    event_id: eventId, round_number: roundNumber, title: data.title?.trim() || null, starts_at: data.starts_at || null,
  }).select().single()
  if (insertError) return { error: insertError.message }
  revalidatePath("/events/" + eventId)
  return { round }
}

export async function addEventMatch(eventId: string, data: { round_id: string; player_a_id?: string; player_b_id?: string }) {
  const { supabase, error } = await requireHost(eventId)
  if (error) return { error }
  const { data: match, error: insertError } = await supabase.from("event_matches").insert({
    event_id: eventId, round_id: data.round_id, player_a_id: data.player_a_id || null, player_b_id: data.player_b_id || null,
  }).select().single()
  if (insertError) return { error: insertError.message }
  revalidatePath("/events/" + eventId)
  return { match }
}

export async function recordEventMatch(eventId: string, matchId: string, data: { winner_id?: string; score_a?: number; score_b?: number; points_a?: number; points_b?: number; result?: string }) {
  const { supabase, error } = await requireHost(eventId)
  if (error) return { error }
  const { data: match, error: updateError } = await supabase.from("event_matches").update({
    winner_id: data.winner_id || null, score_a: data.score_a ?? null, score_b: data.score_b ?? null, points_a: data.points_a ?? null, points_b: data.points_b ?? null,
    result: data.result?.trim() || null, status: "completed",
  }).eq("id", matchId).eq("event_id", eventId).select().single()
  if (updateError) return { error: updateError.message }
  revalidatePath("/events/" + eventId)
  return { match }
}

export async function getEventStandings(eventId: string) {
  const { supabase } = await requireHost(eventId).then(async (x) => x)
  const { data: matches, error } = await supabase.from("event_matches").select("*").eq("event_id", eventId).eq("status", "completed")
  if (error) return { standings: [], error: error.message }
  const { data: participants } = await supabase.from("event_participants").select("user_id, status").eq("event_id", eventId).in("status", ["attending", "maybe"])
  const userIds = (participants || []).map((p) => p.user_id)
  const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, display_name, username").in("id", userIds) : { data: [] as any[] }
  const rows = new Map<string, any>()
  for (const p of profiles || []) rows.set(p.id, { user_id: p.id, name: p.display_name || p.username || "Pelaaja", played: 0, wins: 0, draws: 0, losses: 0, score_for: 0, score_against: 0, points: 0 })
  for (const m of matches || []) {
    for (const side of ["a", "b"] as const) {
      const id = side === "a" ? m.player_a_id : m.player_b_id
      if (!id || !rows.has(id)) continue
      const row = rows.get(id)
      row.played += 1
      row.score_for += Number(side === "a" ? m.score_a || 0 : m.score_b || 0)
      row.score_against += Number(side === "a" ? m.score_b || 0 : m.score_a || 0)
      row.points += Number(side === "a" ? m.points_a || 0 : m.points_b || 0)
      if (m.winner_id === id) row.wins += 1
      else if (m.winner_id === null && m.score_a !== null && m.score_b !== null && Number(m.score_a) === Number(m.score_b)) row.draws += 1
      else if (m.winner_id) row.losses += 1
    }
  }
  return { standings: Array.from(rows.values()).sort((a,b) => b.points - a.points || b.wins - a.wins || b.score_for - a.score_for), error: undefined }
}
