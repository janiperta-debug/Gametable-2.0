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
 * Get a single event by ID with full details
 */
export async function getEventById(
  eventId: string
): Promise<{ event?: Event & { participants?: EventParticipant[] }; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // First get the event
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single()

  console.log("[v0] getEventById:", { eventId, userId: user?.id, event: event?.id, error: error?.message })

  if (error) {
    console.error("[v0] Error fetching event:", error)
    return { error: error.message }
  }

  if (!event) {
    return { error: "Event not found" }
  }

  // Get host profile separately
  let host = null
  if (event.host_id) {
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", event.host_id)
      .single()
    host = hostProfile
  }

  // Check access for private events only - public and friends events are visible
  if (event.privacy === "private" && event.host_id !== user?.id) {
    // Check if user is a participant
    if (user) {
      const { data: participation } = await supabase
        .from("event_participants")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .single()

      if (!participation) {
        return { error: "You don't have access to this event" }
      }
    } else {
      return { error: "You don't have access to this event" }
    }
  }

  // Get participant count
  const { count } = await supabase
    .from("event_participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "attending")

  // Get participants list
  const { data: participants } = await supabase
    .from("event_participants")
    .select("*")
    .eq("event_id", eventId)
    .in("status", ["attending", "maybe"])
    .order("joined_at", { ascending: true })

  // Get user's RSVP status
  let userRsvp = null
  if (user) {
    const { data: rsvpData } = await supabase
      .from("event_participants")
      .select("status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single()
    userRsvp = rsvpData?.status || null
  }

  return {
    event: {
      ...event,
      host,
      participant_count: count || 0,
      user_rsvp: userRsvp,
      participants: participants || [],
    },
  }
}

/**
 * Update an event (host only)
 */
export async function updateEvent(
  eventId: string,
  data: {
    title?: string
    description?: string
    event_type?: EventType
    privacy?: EventPrivacy
    location?: string
    starts_at?: string
    max_players?: number
    status?: EventStatus
  }
): Promise<{ event?: Event; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  // Verify user is the host
  const { data: existingEvent } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single()

  if (!existingEvent || existingEvent.host_id !== user.id) {
    return { error: "Only the host can edit this event" }
  }

  const { data: event, error } = await supabase
    .from("events")
    .update({
      title: data.title,
      description: data.description,
      event_type: data.event_type,
      privacy: data.privacy,
      location: data.location,
      starts_at: data.starts_at,
      max_players: data.max_players,
      status: data.status,
    })
    .eq("id", eventId)
    .select()
    .single()

  if (error) {
    console.error("Error updating event:", error)
    return { error: error.message }
  }

  revalidatePath("/events")
  revalidatePath(`/events/${eventId}`)

  return { event }
}

/**
 * Get messages for an event
 */
export async function getEventMessages(
  eventId: string
): Promise<{ messages: EventMessage[]; error?: string }> {
  const supabase = await createClient()

  const { data: messages, error } = await supabase
    .from("event_messages")
    .select(`
      *,
      sender:profiles!event_messages_sender_id_fkey(id, display_name, avatar_url)
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching event messages:", error)
    return { messages: [], error: error.message }
  }

  return { messages: messages || [] }
}

/**
 * Send a message in an event chat
 */
export async function sendEventMessage(
  eventId: string,
  content: string
): Promise<{ message?: EventMessage; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  // Verify user is a participant or host
  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single()

  if (!event) {
    return { error: "Event not found" }
  }

  if (event.host_id !== user.id) {
    const { data: participation } = await supabase
      .from("event_participants")
      .select("status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .eq("status", "attending")
      .single()

    if (!participation) {
      return { error: "Only participants can send messages" }
    }
  }

  const { data: message, error } = await supabase
    .from("event_messages")
    .insert({
      event_id: eventId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select(`
      *,
      sender:profiles!event_messages_sender_id_fkey(id, display_name, avatar_url)
    `)
    .single()

  if (error) {
    console.error("Error sending message:", error)
    return { error: error.message }
  }

  return { message }
}

export interface EventMessage {
  id: string
  event_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

/**
 * Invite a user to an event (host only)
 */
export async function inviteToEvent(
  eventId: string,
  userId: string
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
    return { success: false, error: "Only the host can invite users" }
  }

  // Check if already a participant
  const { data: existing } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) {
    return { success: false, error: "User is already invited" }
  }

  const { error } = await supabase
    .from("event_participants")
    .insert({
      event_id: eventId,
      user_id: userId,
      status: "invited",
    })

  if (error) {
    console.error("Error inviting user:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

/**
 * Remove invitation / uninvite a user (host only)
 */
export async function uninviteFromEvent(
  eventId: string,
  participantId: string
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
    return { success: false, error: "Only the host can manage invitations" }
  }

  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("id", participantId)

  if (error) {
    console.error("Error removing participant:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

/**
 * Get users that can be invited (friends or all users depending on privacy)
 */
export async function getInvitableUsers(
  eventId: string
): Promise<{ users: Array<{ id: string; display_name: string | null; avatar_url: string | null }>; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { users: [], error: "Unauthorized" }
  }

  // Get current participants to exclude
  const { data: participants } = await supabase
    .from("event_participants")
    .select("user_id")
    .eq("event_id", eventId)

  const excludeIds = [user.id, ...(participants || []).map(p => p.user_id)]

  // Get friends of the host
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const friendIds = (friendships || []).map(f => 
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  ).filter(id => !excludeIds.includes(id))

  if (friendIds.length === 0) {
    return { users: [] }
  }

  const { data: friends, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", friendIds)

  if (error) {
    console.error("Error fetching invitable users:", error)
    return { users: [], error: error.message }
  }

  return { users: friends || [] }
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
