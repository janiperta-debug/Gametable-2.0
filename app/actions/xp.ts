"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { revalidatePath } from "next/cache"
import { checkAndAwardBadges } from "./badges"
import { canUnlockManorRoom, isManorRoomUnlocked, getManorRoomEntitlement } from "@/lib/manor-progression"

/**
 * Award XP to a user - Server-side only, never trust client
 * This inserts into xp_events table AND updates profiles.xp and profiles.level
 */
export async function awardXP(
  userId: string,
  reason: string,
  amount: number,
  referenceId?: string,
  evaluateBadges: boolean = true
): Promise<{ success: boolean; newXP?: number; newLevel?: number; error?: string }> {
  const supabase = await createClient()

  // Verify the request is coming from an authenticated context
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }
  if (user.id !== userId) return { success: false, error: "Forbidden" }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Invalid XP amount" }
  }

  const allowedRewards: Record<string, number> = {
    add_game: 10,
    add_expansion: 5,
    tcg_card_added: 5,
    miniature_added: 5,
    new_friend: 50,
  }
  if (allowedRewards[reason] !== amount) {
    return { success: false, error: "Invalid XP reward" }
  }
  const trusted = createServiceClient()
  const { data, error } = await trusted.rpc("award_xp_trusted", {
    p_target_user: userId,
    p_reason: reason,
    p_amount: amount,
    p_reference_id: referenceId || null,
    p_event_key: referenceId ? `${reason}:${referenceId}` : `${reason}:${crypto.randomUUID()}`,
  })
  if (error || !data?.[0]) {
    return { success: false, error: error?.message || "Failed to award XP" }
  }
  const result = data[0] as { new_xp: number; new_level: number }

  // Revalidate pages that show XP data
  revalidatePath("/profile")
  revalidatePath("/themes")
  revalidatePath("/home")

  // Check and award any badges the user has now earned. Badge rewards invoke
  // this engine with evaluation disabled to avoid nested badge processing.
  if (evaluateBadges) {
    await checkAndAwardBadges(userId)
  }

  return { success: true, newXP: result.new_xp, newLevel: result.new_level }
}

/**
 * Open a Manor room after its XP threshold has been reached.
 *
 * XP grants the opening right. This records the explicit opened state and
 * intentionally leaves profiles.preferred_theme unchanged.
 */
export async function unlockManorRoom(roomId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { success: false, error: "Unauthorized" }
  if (roomId === "main-hall") return { success: true }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("xp, unlocked_themes")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) return { success: false, error: "Profile not found" }

  if (!canUnlockManorRoom(roomId, { xp: profile.xp, unlocked_themes: profile.unlocked_themes })) {
    return { success: false, error: "Room is not yet available to unlock" }
  }

  const unlocked = Array.from(new Set([...(profile.unlocked_themes ?? []), roomId]))
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ unlocked_themes: unlocked })
    .eq("id", user.id)

  if (updateError) {
    console.error("Error unlocking Manor room:", updateError)
    return { success: false, error: "Failed to unlock room" }
  }

  revalidatePath("/themes")
  revalidatePath("/home")
  return { success: true }
}

/**
 * Update user's active room/theme
 */
export async function updateActiveRoom(
  roomId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("unlocked_themes")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) return { success: false, error: "Profile not found" }

  const room = getManorRoomEntitlement(roomId)
  if (!room) return { success: false, error: "Unknown Manor room" }

  if (!isManorRoomUnlocked(roomId, { unlocked_themes: profile.unlocked_themes })) {
    return { success: false, error: "Room is not unlocked" }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ preferred_theme: roomId })
    .eq("id", user.id)

  if (updateError) {
    console.error("Error updating active room:", updateError)
    return { success: false, error: "Failed to update room" }
  }

  revalidatePath("/themes")
  revalidatePath("/home")

  return { success: true }
}

/**
 * Update user profile
 */
export async function updateProfile(
  updates: { bio?: string; avatar_url?: string; display_name?: string; location?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)

  if (updateError) {
    console.error("Error updating profile:", updateError)
    return { success: false, error: "Failed to update profile" }
  }

  revalidatePath("/profile")

  return { success: true }
}

/**
 * Get user's XP history
 */
export async function getXPHistory(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("xp_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching XP history:", error)
    return { events: [], error: error.message }
  }

  return { events: data, error: null }
}
