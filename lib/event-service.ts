import { supabase } from "./supabase"
import type { Event } from "./types"

// Get all public events
export async function getPublicEvents(): Promise<Event[]> {
  console.log("[v0] Fetching public events")
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_public", true)
      .order("date", { ascending: false })

    if (error) throw error
    return (data || []).map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      location: event.location,
      maxAttendees: event.max_attendees,
      attendees: event.attendees || [],
      createdBy: event.created_by,
      isPublic: event.is_public,
      status: event.status,
      gameType: event.game_type,
    })) as Event[]
  } catch (error) {
    console.error("[v0] Error fetching public events:", error)
    return []
  }
}

// Get events for a specific user (created by them or RSVP'd)
export async function getUserEvents(userId: string): Promise<Event[]> {
  console.log("[v0] Fetching events for user:", userId)
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("created_by", userId)
      .order("date", { ascending: false })

    if (error) throw error
    return (data || []).map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      location: event.location,
      maxAttendees: event.max_attendees,
      attendees: event.attendees || [],
      createdBy: event.created_by,
      isPublic: event.is_public,
      status: event.status,
      gameType: event.game_type,
    })) as Event[]
  } catch (error) {
    console.error("[v0] Error fetching user events:", error)
    return []
  }
}

// Get a single event by ID
export async function getEventById(eventId: string): Promise<Event | null> {
  console.log("[v0] Fetching event:", eventId)
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      console.log("[v0] Event not found")
      return null
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      location: data.location,
      maxAttendees: data.max_attendees,
      attendees: data.attendees || [],
      createdBy: data.created_by,
      isPublic: data.is_public,
      status: data.status,
      gameType: data.game_type,
    } as Event
  } catch (error) {
    console.error("[v0] Error fetching event:", error)
    return null
  }
}
