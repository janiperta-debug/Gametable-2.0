"use server"

import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/app/actions/notifications"
import { revalidatePath } from "next/cache"

export { getPublicEvents, getMyEvents, createEvent, updateRSVP, getEventParticipants, getEventById, updateEvent, getEventMessages, sendEventMessage, uninviteFromEvent, getInvitableUsers, cancelEvent } from "./events-core"
export type { EventType, EventPrivacy, EventStatus, RSVPStatus, Event, EventParticipant, EventMessage } from "./events-core"

export async function inviteToEvent(
  eventId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: "Unauthorized" }

  const { data: event } = await supabase
    .from("events")
    .select("host_id, title")
    .eq("id", eventId)
    .single()

  if (!event || event.host_id !== user.id) {
    return { success: false, error: "Only the host can invite users" }
  }

  const { data: existing } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) return { success: false, error: "User is already invited" }

  const { error } = await supabase
    .from("event_participants")
    .insert({ event_id: eventId, user_id: userId, status: "invited" })

  if (error) {
    console.error("Error inviting user:", error)
    return { success: false, error: error.message }
  }

  try {
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()

    const notificationResult = await createNotification({
      user_id: userId,
      type: "event_invite",
      title: "Event Invitation",
      body: `${hostProfile?.display_name || "Someone"} invited you to ${event.title || "an event"}`,
      data: {
        notification_type: "event_invite",
        event_id: eventId,
        event_name: event.title || "an event",
        host_name: hostProfile?.display_name || "Someone",
      },
    })

    if (!notificationResult.success) {
      console.error("[Events] Failed to create invitation notification:", notificationResult.error)
    }
  } catch (notificationError) {
    console.error("[Events] Failed to deliver invitation notification:", notificationError)
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}
