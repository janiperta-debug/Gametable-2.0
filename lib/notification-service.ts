import { supabase } from "./supabase"
import type { Notification } from "./types"

// Get notifications for a user
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  if (!supabase) return []
  console.log("[v0] Fetching notifications for user:", userId)
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data || []).map((notif) => ({
      id: notif.id,
      userId: notif.user_id,
      type: notif.type,
      message: notif.message,
      read: notif.read || false,
      createdAt: new Date(notif.created_at),
      relatedId: notif.related_id,
    })) as Notification[]
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return []
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (!supabase) return 0
  console.log("[v0] Fetching unread notification count for user:", userId)
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false)

    if (error) throw error
    console.log(`[v0] Found ${count} unread notifications`)
    return count || 0
  } catch (error) {
    console.error("[v0] Error fetching unread count:", error)
    return 0
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!supabase) return
  console.log("[v0] Marking notification as read:", notificationId)
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)

    if (error) throw error
    console.log("[v0] Notification marked as read")
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error)
  }
}
