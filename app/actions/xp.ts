"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { calculateLevel } from "@/lib/xp-utils"
import { checkAndAwardBadges } from "./badges"

/**
 * Award XP to a user - Server-side only, never trust client
 * This inserts into xp_events table AND updates profiles.xp and profiles.level
 */
export async function awardXP(
  userId: string,
  reason: string,
  amount: number,
  referenceId?: string
): Promise<{ success: boolean; newXP?: number; newLevel?: number; error?: string }> {
  const supabase = await createClient()

  // Verify the request is coming from an authenticated context
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }
  if (user.id !== userId) {
    return { success: false, error: "Forbidden" }
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Invalid XP amount" }
  }

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .single()

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" }
  }

  const currentXP = profile.xp ?? 0
  const newXP = currentXP + amount
  const newLevel = calculateLevel(newXP)

  if (referenceId) {
    const { data: existingEvent, error: identityError } = await supabase
      .from("xp_events")
      .select("id")
      .eq("user_id", userId)
      .eq("reason", reason)
      .eq("reference_id", referenceId)
      .limit(1)
      .maybeSingle()

    if (identityError) {
      console.error("Error checking XP event identity:", identityError)
      return { success: false, error: "Failed to check XP event" }
    }
    if (existingEvent) {
      return { success: true, newXP: currentXP, newLevel: profile.level ?? calculateLevel(currentXP) }
    }
  }

  // Insert XP event
  const { error: eventError } = await supabase
    .from("xp_events")
    .insert({
      user_id: userId,
      amount,
      reason,
      reference_id: referenceId || null,
    })

  if (eventError) {
    console.error("Error inserting xp_event:", eventError)
    return { success: false, error: "Failed to record XP event" }
  }

  // Update profile with new XP and level
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      xp: newXP,
      level: newLevel,
    })
    .eq("id", userId)

  if (updateError) {
    console.error("Error updating profile XP:", updateError)
    return { success: false, error: "Failed to update profile" }
  }

  // Revalidate pages that show XP data
  revalidatePath("/profile")
  revalidatePath("/themes")
  revalidatePath("/home")

  // Check and award any badges the user has now earned
  await checkAndAwardBadges(userId)

  return { success: true, newXP, newLevel }
}

export type CollectionCategory = "board_game" | "rpg" | "tcg" | "miniatures"

export async function awardCategoryImportXP(
  userId: string,
  category: CollectionCategory,
): Promise<{ success: boolean; error?: string }> {
  return awardXP(userId, "category_import", 200, `first_collection_import:${category}`)
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

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ theme: roomId })
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
