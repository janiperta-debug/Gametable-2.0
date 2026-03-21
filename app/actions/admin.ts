"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"
import { sendEmail, getAdminBroadcastEmailTemplate } from "@/lib/email"

export type AdminBroadcast = {
  id: string
  sent_by: string | null
  subject: string
  body: string
  recipient_count: number
  email_count: number
  sent_at: string
  sender?: {
    display_name: string | null
    username: string | null
  }
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return profile?.role === "admin"
}

// Get all broadcasts (admin only)
export async function getAdminBroadcasts(): Promise<{ broadcasts: AdminBroadcast[]; error?: string }> {
  const supabase = await createClient()
  
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return { broadcasts: [], error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("admin_broadcasts")
    .select(`
      *,
      sender:profiles!sent_by(display_name, username)
    `)
    .order("sent_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching broadcasts:", error)
    return { broadcasts: [], error: error.message }
  }

  return { broadcasts: (data || []) as AdminBroadcast[] }
}

// Send announcement to all users
export async function sendAnnouncement(params: {
  subject: string
  body: string
}): Promise<{ success: boolean; recipientCount?: number; emailCount?: number; error?: string }> {
  const supabase = await createClient()
  
  // Check admin status
  const adminCheck = await isAdmin()
  if (!adminCheck) {
    return { success: false, error: "Unauthorized: Admin access required" }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get all users with their email preferences
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email_notification_types")

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError)
    return { success: false, error: "Failed to fetch users" }
  }

  // Get user emails from auth (we need admin client for this)
  // For now, we'll create notifications and track email count separately
  let recipientCount = 0
  let emailCount = 0

  // Create in-app notifications for all users
  for (const profile of profiles || []) {
    await createNotification({
      user_id: profile.id,
      type: "system",
      title: params.subject,
      body: params.body,
      data: { broadcast: true }
    })
    recipientCount++

    // Check if user wants email notifications for announcements
    const emailPrefs = profile.email_notification_types as Record<string, boolean> | null
    if (emailPrefs?.admin_broadcast) {
      // Get user email from auth - using service role would be needed for this
      // For now, we'll just track that they should receive an email
      emailCount++
    }
  }

  // Record the broadcast
  const { error: insertError } = await supabase
    .from("admin_broadcasts")
    .insert({
      sent_by: user.id,
      subject: params.subject,
      body: params.body,
      recipient_count: recipientCount,
      email_count: emailCount
    })

  if (insertError) {
    console.error("Error recording broadcast:", insertError)
    // Don't fail - notifications were already sent
  }

  revalidatePath("/admin/announcements")

  return { success: true, recipientCount, emailCount }
}
