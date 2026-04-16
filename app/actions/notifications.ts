"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { 
  sendEmail, 
  getFriendRequestEmailTemplate, 
  getBadgeEarnedEmailTemplate,
  getEventRsvpEmailTemplate,
  getNewMessageEmailTemplate,
  getAdminBroadcastEmailTemplate,
  type EmailNotificationType 
} from "@/lib/email"

export interface Notification {
  id: string
  user_id: string
  type: "friend_request" | "friend_accepted" | "event_invite" | "event_reminder" | "badge_earned" | "message" | "system"
  title: string
  body: string | null
  data: Record<string, any>
  read: boolean
  created_at: string
}

// Get all notifications for the current user
export async function getNotifications(): Promise<{ data: Notification[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching notifications:", error)
    return { data: [], error: error.message }
  }

  return { data: data || [] }
}

// Get unread notification count
export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { count: 0 }
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false)

  if (error) {
    console.error("Error fetching unread count:", error)
    return { count: 0 }
  }

  return { count: count || 0 }
}

// Mark a single notification as read
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/notifications")
  return { success: true }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false)

  if (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/notifications")
  return { success: true }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/notifications")
  return { success: true }
}

// Create a notification (called from other server actions)
export async function createNotification(params: {
  user_id: string
  type: Notification["type"]
  title: string
  body?: string
  data?: Record<string, any>
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  console.log("[v0] createNotification called with:", params)

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.user_id,
      type: params.type,
      title: params.title,
      body: params.body || null,
      data: params.data || {},
      read: false,
    })
    .select()

  console.log("[v0] createNotification insert result:", { data, error: error?.message })

  if (error) {
    console.error("Error creating notification:", error)
    return { success: false, error: error.message }
  }

  // Check if user wants email for this notification type
  const emailType = mapNotificationTypeToEmailType(params.type)
  if (emailType) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_notification_types")
      .eq("id", params.user_id)
      .single()

    const emailPrefs = profile?.email_notification_types as Record<string, boolean> | null
    if (emailPrefs?.[emailType]) {
      // Get user's email from auth
      const { data: authData } = await supabase.auth.admin.getUserById(params.user_id)
      const userEmail = authData?.user?.email

      if (userEmail) {
        const emailTemplate = getEmailTemplate(emailType, params)
        if (emailTemplate) {
          await sendEmail({
            to: userEmail,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          })
        }
      }
    }
  }

  return { success: true }
}

// Map notification type to email type
function mapNotificationTypeToEmailType(type: Notification["type"]): EmailNotificationType | null {
  const mapping: Record<string, EmailNotificationType> = {
    friend_request: "friend_request",
    friend_accepted: "friend_request",
    badge_earned: "badge_earned",
    event_invite: "event_rsvp",
    event_reminder: "event_rsvp",
    message: "new_message",
    system: "admin_broadcast",
  }
  return mapping[type] || null
}

// Get email template based on type
function getEmailTemplate(
  type: EmailNotificationType, 
  params: { title: string; body?: string; data?: Record<string, any> }
) {
  switch (type) {
    case "friend_request":
      return getFriendRequestEmailTemplate(params.data?.sender_name || "Someone")
    case "badge_earned":
      return getBadgeEarnedEmailTemplate(params.data?.badge_name || "a new badge")
    case "event_rsvp":
      return getEventRsvpEmailTemplate(
        params.data?.event_name || "your event",
        params.data?.attendee_name || "Someone"
      )
    case "new_message":
      return getNewMessageEmailTemplate(params.data?.sender_name || "Someone")
    case "admin_broadcast":
      return getAdminBroadcastEmailTemplate(params.title, params.body || "")
    default:
      return null
  }
}
