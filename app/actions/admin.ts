"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"
import { sendEmail, getAdminBroadcastEmailTemplate } from "@/lib/email"

export type BroadcastHistory = {
  id: string
  sent_by: string | null
  subject: string
  body: string
  recipient_count: number
  email_count: number
  sent_at: string
}

// Check if current user is admin
export async function checkIsAdmin(): Promise<{ isAdmin: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { isAdmin: false }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return { isAdmin: profile?.role === "admin" }
}

// Get broadcast history (admin only)
export async function getBroadcastHistory(): Promise<{ broadcasts: BroadcastHistory[]; error?: string }> {
  const supabase = await createClient()
  
  const { isAdmin } = await checkIsAdmin()
  if (!isAdmin) {
    return { broadcasts: [], error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("admin_broadcasts")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching broadcast history:", error)
    return { broadcasts: [], error: error.message }
  }

  return { broadcasts: (data || []) as BroadcastHistory[] }
}

// Send broadcast to all users or test mode (admin only)
export async function sendBroadcast(params: {
  subject: string
  body: string
  testMode?: boolean
}): Promise<{ success: boolean; recipientCount?: number; emailCount?: number; error?: string }> {
  const supabase = await createClient()
  
  // Check admin status
  const { isAdmin } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin access required" }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Test mode - only send to current admin
  if (params.testMode) {
    // Create notification for self
    await createNotification({
      user_id: user.id,
      type: "system",
      title: params.subject,
      body: params.body,
      data: { broadcast: true, test: true }
    })

    // Send test email to self
    const emailTemplate = getAdminBroadcastEmailTemplate(params.subject, params.body)
    await sendEmail({
      to: user.email!,
      subject: `[TEST] ${emailTemplate.subject}`,
      html: emailTemplate.html,
    })

    return { success: true, recipientCount: 1, emailCount: 1 }
  }

  // Full broadcast mode
  let recipientCount = 0
  let emailCount = 0

  // Get all users with their email preferences
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email_notification_types")

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError)
    return { success: false, error: "Failed to fetch users" }
  }

  // Create in-app notifications for all users
  const notificationPromises = (profiles || []).map(async (profile) => {
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
    return { profileId: profile.id, wantsEmail: emailPrefs?.admin_broadcast === true }
  })

  const notificationResults = await Promise.all(notificationPromises)

  // Get emails for users who want broadcast emails using service client
  const usersWantingEmail = notificationResults.filter(r => r.wantsEmail).map(r => r.profileId)
  
  if (usersWantingEmail.length > 0) {
    try {
      const serviceClient = createServiceClient()
      
      // Fetch user emails in batches
      for (const profileId of usersWantingEmail) {
        const { data: authData } = await serviceClient.auth.admin.getUserById(profileId)
        if (authData?.user?.email) {
          const emailTemplate = getAdminBroadcastEmailTemplate(params.subject, params.body)
          await sendEmail({
            to: authData.user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          })
          emailCount++
        }
      }
    } catch (error) {
      console.error("Error sending broadcast emails:", error)
      // Continue - notifications were still sent
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
