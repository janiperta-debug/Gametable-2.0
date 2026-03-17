"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
export async function createNotification(
  userId: string,
  type: Notification["type"],
  title: string,
  body?: string,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      data: data || {},
      read: false,
    })

  if (error) {
    console.error("Error creating notification:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
