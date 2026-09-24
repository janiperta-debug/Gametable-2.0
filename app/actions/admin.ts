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
  image_url?: string | null
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
  imageUrl?: string | null
}): Promise<{ success: boolean; recipientCount?: number; emailCount?: number; error?: string }> {
  const supabase = await createClient()
  const { isAdmin } = await checkIsAdmin()
  if (!isAdmin) return { success: false, error: "Unauthorized: Admin access required" }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const imageUrl = params.imageUrl || null
  if (imageUrl && !isNewsletterImageUrl(imageUrl)) return { success: false, error: "Invalid newsletter image" }

  if (params.testMode) {
    await createNotification({
      user_id: user.id,
      type: "system",
      title: params.subject,
      body: params.body,
      data: { broadcast: true, test: true, image_url: imageUrl },
      sendEmail: false,
    })

    const emailTemplate = getAdminBroadcastEmailTemplate(params.subject, params.body, imageUrl)
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
      data: { broadcast: true, image_url: imageUrl },
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
    const emailTemplate = getAdminBroadcastEmailTemplate(params.subject, params.body, imageUrl)
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
    image_url: imageUrl,
    recipient_count: recipientCount,
    email_count: emailCount,
  })
  if (insertError) console.error("Error recording broadcast:", insertError)

  revalidatePath("/admin/announcements")
  return { success: true, recipientCount, emailCount }
}

const IMAGE_BUCKET = "newsletter-images"
const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
}

function isNewsletterImageUrl(value: string) {
  try {
    const url = new URL(value)
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    return url.origin === supabaseUrl.origin &&
      url.pathname.startsWith("/storage/v1/object/public/" + IMAGE_BUCKET + "/")
  } catch { return false }
}

export async function uploadNewsletterImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const { isAdmin } = await checkIsAdmin()
  if (!isAdmin) return { error: "Unauthorized" }
  const file = formData.get("image")
  if (!(file instanceof File)) return { error: "Valitse kuva." }
  const extension = imageTypes[file.type]
  if (!extension || file.size > 5 * 1024 * 1024 || file.size === 0) {
    return { error: "Kuvan tulee olla JPG, PNG, WebP tai GIF ja enintään 5 Mt." }
  }
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (!user) return { error: "Kirjaudu sisään." }
  const path = user.id + "/" + crypto.randomUUID() + "." + extension
  const service = createServiceClient()
  const { error } = await service.storage.from(IMAGE_BUCKET).upload(path, file, {
    contentType: file.type, upsert: false, cacheControl: "31536000",
  })
  if (error) return { error: error.message }
  return { url: service.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl }
}

export async function listNewsletterImages(): Promise<{ images: string[]; error?: string }> {
  const { isAdmin } = await checkIsAdmin()
  if (!isAdmin) return { images: [], error: "Unauthorized" }
  const service = createServiceClient()
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (!user) return { images: [], error: "Kirjaudu sisään." }
  const { data, error } = await service.storage.from(IMAGE_BUCKET).list(user.id, {
    limit: 100, sortBy: { column: "created_at", order: "desc" },
  })
  if (error) return { images: [], error: error.message }
  return { images: (data || []).filter((item) => /\.(jpg|jpeg|png|webp|gif)$/i.test(item.name))
    .map((item) => service.storage.from(IMAGE_BUCKET).getPublicUrl(user.id + "/" + item.name).data.publicUrl) }
}
