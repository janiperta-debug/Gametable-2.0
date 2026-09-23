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
  return { sessions: sessions || [], rounds: rounds || [], error: sessionsError?.message || roundsError?.message }
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
