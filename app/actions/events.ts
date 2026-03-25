"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type EventType = "board_game_night" | "rpg_session" | "tournament" | "custom"
export type EventPrivacy = "public" | "friends" | "private"
export type EventStatus = "upcoming" | "active" | "completed" | "cancelled"
export type RSVPStatus = "invited" | "attending" | "declined" | "maybe"

export interface Event {
  id: string
  host_id: string
  title: string
  description: string | null
  event_type: EventType | null
  privacy: EventPrivacy | null
  location: string | null
  starts_at: string
  ends_at: string | null
  max_players: number | null
  status: EventStatus | null
  created_at: string | null
  // Joined data
  host?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
  participant_count?: number
  user_rsvp?: RSVPStatus | null
}

export interface EventParticipant {
  id: string
  event_id: string
  user_id: string
  status: RSVPStatus | null
  joined_at: string | null
  user?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

/**
 * Get public events, ordered by start date
 */
export async function getPublicEvents(): Promise<{ events: Event[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: events, error } = await supabase
    .from("events")
    .select(`
      *,
      host:profiles!events_host_id_fkey(id, display_name, avatar_url)
    `)
    .eq("privacy", "public")
    .in("status", ["upcoming", "active"])
    .order("starts_at", { ascending: true })

  if (error) {
    console.error("Error fetching events:", error)
    return { events: [], error: error.message }
  }

  // Get participant counts and user RSVP status
  const eventsWithCounts = await Promise.all(
    (events || []).map(async (event) => {
      const { count } = await supabase
        .from("event_participants")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("status", "attending")

      let userRsvp = null
      if (user) {
        const { data: rsvpData } = await supabase
          .from("event_participants")
          .select("status")
          .eq("event_id", event.id)
          .eq("user_id", user.id)
          .single()
        userRsvp = rsvpData?.status || null
      }

      return {
        ...event,
        participant_count: count || 0,
        user_rsvp: userRsvp,
      }
    })
  )

  return { events: eventsWithCounts }
}

/**
 * Get events where user is host or participant
 */
export async function getMyEvents(): Promise<{ events: Event[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { events: [], error: "Unauthorized" }
  }

  // Get events user is hosting
  const { data: hostedEvents, error: hostError } = await supabase
    .from("events")
    .select(`
      *,
      host:profiles!events_host_id_fkey(id, display_name, avatar_url)
    `)
    .eq("host_id", user.id)
    .in("status", ["upcoming", "active"])
    .order("starts_at", { ascending: true })

  if (hostError) {
    console.error("Error fetching hosted events:", hostError)
  }

  // Get events user is participating in
  const { data: participations, error: partError } = await supabase
    .from("event_participants")
    .select("event_id")
    .eq("user_id", user.id)
    .in("status", ["attending", "maybe"])

  if (partError) {
    console.error("Error fetching participations:", partError)
  }

  const participatingEventIds = (participations || []).map(p => p.event_id)
  
  let participatingEvents: Event[] = []
  if (participatingEventIds.length > 0) {
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(`
        *,
        host:profiles!events_host_id_fkey(id, display_name, avatar_url)
      `)
      .in("id", participatingEventIds)
      .neq("host_id", user.id) // Exclude events user is hosting (already included)
      .in("status", ["upcoming", "active"])
      .order("starts_at", { ascending: true })

    if (!eventsError && events) {
      participatingEvents = events
    }
  }

  // Combine and deduplicate
  const allEvents = [...(hostedEvents || []), ...participatingEvents]
  
  // Get participant counts and user RSVP status
  const eventsWithCounts = await Promise.all(
    allEvents.map(async (event) => {
      const { count } = await supabase
        .from("event_participants")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("status", "attending")

      const { data: rsvpData } = await supabase
        .from("event_participants")
        .select("status")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .single()

      return {
        ...event,
        participant_count: count || 0,
        user_rsvp: rsvpData?.status || null,
      }
    })
  )

  // Sort by start date
  eventsWithCounts.sort((a, b) => 
    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )

  return { events: eventsWithCounts }
}

/**
 * Create a new event
 */
export async function createEvent(data: {
  title: string
  description?: string
  event_type: EventType
  privacy: EventPrivacy
  location?: string
  starts_at: string
  max_players?: number
}): Promise<{ event?: Event; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      host_id: user.id,
      title: data.title,
      description: data.description || null,
      event_type: data.event_type,
      privacy: data.privacy,
      location: data.location || null,
      starts_at: data.starts_at,
      max_players: data.max_players || null,
      status: "upcoming",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating event:", error)
    return { error: error.message }
  }

  // Auto-add host as attending
  await supabase.from("event_participants").insert({
    event_id: event.id,
    user_id: user.id,
    status: "attending",
  })

  revalidatePath("/events")

  return { event }
}

/**
 * Update RSVP status for an event
 */
export async function updateRSVP(
  eventId: string,
  status: RSVPStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  // Check if participant record exists
  const { data: existing } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single()

  if (existing) {
    // Update existing RSVP
    const { error } = await supabase
      .from("event_participants")
      .update({ status })
      .eq("id", existing.id)

    if (error) {
      console.error("Error updating RSVP:", error)
      return { success: false, error: error.message }
    }
  } else {
    // Create new RSVP
    const { error } = await supabase
      .from("event_participants")
      .insert({
        event_id: eventId,
        user_id: user.id,
        status,
      })

    if (error) {
      console.error("Error creating RSVP:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath("/events")

  return { success: true }
}

/**
 * Get participants for an event
 */
export async function getEventParticipants(
  eventId: string
): Promise<{ participants: EventParticipant[]; error?: string }> {
  const supabase = await createClient()

  const { data: participants, error } = await supabase
    .from("event_participants")
    .select(`
      *,
      user:profiles!event_participants_user_id_fkey(id, display_name, avatar_url)
    `)
    .eq("event_id", eventId)
    .in("status", ["attending", "maybe"])
    .order("joined_at", { ascending: true })

  if (error) {
    console.error("Error fetching participants:", error)
    return { participants: [], error: error.message }
  }

  return { participants: participants || [] }
}

/**
 * Cancel an event (host only)
 */
export async function cancelEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  // Verify user is the host
  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single()

  if (!event || event.host_id !== user.id) {
    return { success: false, error: "Only the host can cancel this event" }
  }

  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", eventId)

  if (error) {
    console.error("Error cancelling event:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/events")

  return { success: true }
}
