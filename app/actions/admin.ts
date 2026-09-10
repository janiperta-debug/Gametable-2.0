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

export async function checkIsAdmin(): Promise<{ isAdmin: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isAdmin: false }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  return { isAdmin: profile?.role === "admin" }
}

export async function getBroadcastHistory(): Promise<{ broadcasts: BroadcastHistory[]; error?: string }> {
  const supabase = await createClient()
  const { isAdmin } = await checkIsAdmin()
  if (!isAdmin) return { broadcasts: [], error: "Unauthorized" }
  const { data, error } = await supabase.from("admin_broadcasts").select("*").order("sent_at", { ascending: false }).limit(50)
  if (error) return { broadcasts: [], error: error.message }
  return { broadcasts: (data || []) as BroadcastHistory[] }
}

export async function sendBroadcast(params: {
  subject: string
  body: string
  testMode?: boolean
}): Promise<{ success: boolean; recipientCount?: number; emailCount?: number; error?: string }> {
  const supabase = await createClient()
  const { isAdmin } = await checkIsAdmin()
  if (!isAdmin) return { success: false, error: "Unauthorized: Admin access required" }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  if (params.testMode) {
    await createNotification({
      user_id: user.id,
      type: "system",
      title: params.subject,
      body: params.body,
      data: { broadcast: true, test: true },
      sendEmail: false,
    })

    const emailTemplate = getAdminBroadcastEmailTemplate(params.subject, params.body)
    const emailResult = await sendEmail({
      to: user.email!,
      subject: `[TEST] ${emailTemplate.subject}`,
      html: emailTemplate.html,
    })

    return { success: true, recipientCount: 1, emailCount: emailResult.success ? 1 : 0 }
  }

  let recipientCount = 0
  let emailCount = 0

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email_notification_types")

  if (profilesError) return { success: false, error: "Failed to fetch users" }

  // Broadcast emails are deliberately handled here so the recorded email_count
  // reflects actual send attempts and we do not double-send through createNotification.
  const notificationPromises = (profiles || []).map(async (profile) => {
    const result = await createNotification({
      user_id: profile.id,
      type: "system",
      title: params.subject,
      body: params.body,
      data: { broadcast: true },
      sendEmail: false,
    })
    if (result.success) recipientCount++

    const emailPrefs = profile.email_notification_types as Record<string, boolean> | null
    return { profileId: profile.id, wantsEmail: emailPrefs?.admin_broadcast === true }
  })

  const notificationResults = await Promise.all(notificationPromises)
  const usersWantingEmail = notificationResults.filter(r => r.wantsEmail).map(r => r.profileId)

  if (usersWantingEmail.length > 0) {
    const serviceClient = createServiceClient()
    const emailTemplate = getAdminBroadcastEmailTemplate(params.subject, params.body)
    for (const profileId of usersWantingEmail) {
      try {
        const { data: authData } = await serviceClient.auth.admin.getUserById(profileId)
        if (authData?.user?.email) {
          const result = await sendEmail({ to: authData.user.email, subject: emailTemplate.subject, html: emailTemplate.html })
          if (result.success) emailCount++
        }
      } catch (error) {
        console.error("Error sending broadcast email:", error)
      }
    }
  }

  const { error: insertError } = await supabase.from("admin_broadcasts").insert({
    sent_by: user.id,
    subject: params.subject,
    body: params.body,
    recipient_count: recipientCount,
    email_count: emailCount,
  })
  if (insertError) console.error("Error recording broadcast:", insertError)

  revalidatePath("/admin/announcements")
  return { success: true, recipientCount, emailCount }
}
