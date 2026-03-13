"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Calculate level from XP
 * Level = floor(xp / 100) + 1
 * Level 1: 0-99 XP
 * Level 2: 100-199 XP
 * etc.
 */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1
}

/**
 * Get XP required for next level
 */
export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * 100
}

/**
 * Get XP required for current level start
 */
export function xpForCurrentLevel(currentLevel: number): number {
  return (currentLevel - 1) * 100
}

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

  return { success: true, newXP, newLevel }
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
