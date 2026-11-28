"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function confirmCampaign(eventId: string): Promise<{ success: boolean; error?: string; confirmedAt?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: "Kirjautuminen vaaditaan." }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, host_id, event_type, campaign_status, status")
    .eq("id", eventId)
    .maybeSingle()

  if (eventError || !event) return { success: false, error: "Kampanjaa ei löytynyt." }
  if (event.host_id !== user.id) return { success: false, error: "Vain kampanjanjohtaja voi vahvistaa kampanjan." }
  if (event.event_type !== "campaign") return { success: false, error: "Tämä tapahtuma ei ole kampanja." }
  if (event.status === "cancelled" || event.status === "completed") {
    return { success: false, error: "Päättynyttä tai peruttua kampanjaa ei voi vahvistaa." }
  }
  if (event.campaign_status === "confirmed") {
    return { success: true, confirmedAt: undefined }
  }
  if (event.campaign_status !== "setup") {
    return { success: false, error: "Kampanja ei ole vahvistettavassa tilassa." }
  }

  const confirmedAt = new Date().toISOString()
  const { data: updated, error: updateError } = await supabase
    .from("events")
    .update({ campaign_status: "confirmed", campaign_confirmed_at: confirmedAt, campaign_confirmed_by: user.id })
    .eq("id", eventId)
    .eq("host_id", user.id)
    .eq("campaign_status", "setup")
    .select("id")
    .maybeSingle()

  if (updateError || !updated) {
    return { success: false, error: updateError?.message || "Kampanjan vahvistaminen ei onnistunut. Päivitä sivu ja yritä uudelleen." }
  }

  revalidatePath("/events")
  revalidatePath(`/events/${eventId}`)
  return { success: true, confirmedAt }
}


export async function finishCampaign(eventId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: "Kirjautuminen vaaditaan." }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, host_id, event_type, campaign_status, status")
    .eq("id", eventId)
    .maybeSingle()

  if (eventError || !event) return { success: false, error: "Kampanjaa ei löytynyt." }
  if (event.host_id !== user.id) return { success: false, error: "Vain kampanjanjohtaja voi päättää kampanjan." }
  if (event.event_type !== "campaign") return { success: false, error: "Tämä tapahtuma ei ole kampanja." }
  if (event.status === "cancelled") return { success: false, error: "Peruttua kampanjaa ei voi päättää." }
  if (event.status === "completed") return { success: true }
  if (event.campaign_status !== "confirmed") return { success: false, error: "Vahvista kampanja ennen sen päättämistä." }

  const { data: updated, error: updateError } = await supabase
    .from("events")
    .update({ status: "completed" })
    .eq("id", eventId)
    .eq("host_id", user.id)
    .eq("event_type", "campaign")
    .eq("campaign_status", "confirmed")
    .neq("status", "completed")
    .neq("status", "cancelled")
    .select("id")
    .maybeSingle()

  if (updateError || !updated) {
    return { success: false, error: updateError?.message || "Kampanjan päättäminen ei onnistunut. Päivitä sivu ja yritä uudelleen." }
  }

  revalidatePath("/events")
  revalidatePath(`/events/${eventId}`)
  return { success: true }
}
