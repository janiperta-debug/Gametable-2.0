"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { revalidatePath } from "next/cache"
import {
  sendEmail,
  getFriendRequestEmailTemplate,
  getBadgeEarnedEmailTemplate,
  getEventRsvpEmailTemplate,
  getEventInvitationEmailTemplate,
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

export async function getNotifications(): Promise<{ data: Notification[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
  if (error) return { data: [], error: error.message }
  return { data: data || [] }
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { count: 0 }
  const { count, error } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false)
  if (error) return { count: 0 }
  return { count: count || 0 }
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId).eq("user_id", user.id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/notifications")
  return { success: true }
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)
  if (error) return { success: false, error: error.message }
  revalidatePath("/notifications")
  return { success: true }
}

export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const { error } = await supabase.from("notifications").delete().eq("id", notificationId).eq("user_id", user.id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/notifications")
  return { success: true }
}

export async function createNotification(params: {
  user_id: string
  type: Notification["type"]
  title: string
  body?: string
  data?: Record<string, any>
  sendEmail?: boolean
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("notifications").insert({
    user_id: params.user_id,
    type: params.type,
    title: params.title,
    body: params.body || null,
    data: params.data || {},
    read: false,
  })
  if (error) return { success: false, error: error.message }

  if (params.sendEmail === false) return { success: true }

  const emailType = mapNotificationTypeToEmailType(params.type)
  if (emailType) {
    const { data: profile } = await supabase.from("profiles").select("email_notification_types").eq("id", params.user_id).single()
    const emailPrefs = profile?.email_notification_types as Record<string, boolean> | null
    if (emailPrefs?.[emailType]) {
      try {
        const serviceClient = createServiceClient()
        const { data: authData } = await serviceClient.auth.admin.getUserById(params.user_id)
        const userEmail = authData?.user?.email
        if (userEmail) {
          const emailTemplate = getEmailTemplate(emailType, params)
          if (emailTemplate) await sendEmail({ to: userEmail, subject: emailTemplate.subject, html: emailTemplate.html })
        }
      } catch (error) {
        console.error("[Email] Failed to resolve recipient:", error)
      }
    }
  }
  return { success: true }
}

function mapNotificationTypeToEmailType(type: Notification["type"]): EmailNotificationType | null {
  const mapping: Record<string, EmailNotificationType> = {
    friend_request: "friend_request",
    friend_accepted: "friend_request",
    badge_earned: "badge_earned",
    event_invite: "event_invite",
    event_reminder: "event_invite",
    message: "new_message",
    system: "admin_broadcast",
  }
  return mapping[type] || null
}

function getEmailTemplate(type: EmailNotificationType, params: { title: string; body?: string; data?: Record<string, any> }) {
  switch (type) {
    case "friend_request":
      return getFriendRequestEmailTemplate(params.data?.sender_name || "Someone")
    case "badge_earned":
      return getBadgeEarnedEmailTemplate(params.data?.badge_name || "a new badge")
    case "event_rsvp":
      return getEventRsvpEmailTemplate(params.data?.event_name || "your event", params.data?.attendee_name || "Someone")
    case "event_invite":
      return getEventInvitationEmailTemplate(params.data?.event_name || "an event", params.data?.host_name || "Someone")
    case "new_message":
      return getNewMessageEmailTemplate(params.data?.sender_name || "Someone")
    case "admin_broadcast":
      return getAdminBroadcastEmailTemplate(params.title, params.body || "")
    default:
      return null
  }
}
