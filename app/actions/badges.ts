"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"

export interface BadgeDefinition {
  id: string
  series: string
  tier: string
  name: string
  description: string | null
  requirement_type: string | null
  requirement_value: number | null
  xp_reward: number | null
  image_url: string | null
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
}

export interface BadgeWithProgress extends BadgeDefinition {
  earned: boolean
  earned_at?: string
  current_progress: number
}

/**
 * Get all badge definitions from the database
 */
export async function getBadgeDefinitions(): Promise<{ data: BadgeDefinition[]; error?: string }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("badge_definitions")
    .select("*")
    .order("series")
    .order("tier")
  
  if (error) {
    console.error("Error fetching badge definitions:", error)
    return { data: [], error: error.message }
  }
  
  return { data: data || [] }
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId?: string): Promise<{ data: UserBadge[]; error?: string }> {
  const supabase = await createClient()
  
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    targetUserId = user?.id
  }
  
  if (!targetUserId) {
    return { data: [], error: "Not authenticated" }
  }
  
  const { data, error } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", targetUserId)
  
  if (error) {
    console.error("Error fetching user badges:", error)
    return { data: [], error: error.message }
  }
  
  return { data: data || [] }
}

/**
 * Get user stats for badge progress calculation
 */
export async function getUserStats(userId: string): Promise<{
  game_count: number
  category_count: number
  friend_count: number
  events_hosted: number
  events_attended: number
  level: number
  bgg_imports: number
}> {
  const supabase = await createClient()
  
  // Get game count
  const { count: gameCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
  
  // Get unique categories from user's games
  const { data: userGames } = await supabase
    .from("user_games")
    .select("games(game_type)")
    .eq("user_id", userId)
  
  const uniqueCategories = new Set<string>()
  if (userGames) {
    for (const ug of userGames) {
      const game = ug.games as { game_type?: string } | null
      if (game?.game_type) {
        uniqueCategories.add(game.game_type)
      }
    }
  }
  
  // Get friend count (accepted friendships)
  const { count: friendCount } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  
  // Get events hosted count
  const { count: eventsHosted } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("host_id", userId)
  
  // Get events attended count (RSVP with 'attending' status)
  const { count: eventsAttended } = await supabase
    .from("event_rsvps")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "attending")
  
  // Get user level
  const { data: profile } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", userId)
    .single()
  
  // Get BGG imports count (games with bgg_id set)
  const { count: bggImports } = await supabase
    .from("user_games")
    .select("games!inner(bgg_id)", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("games.bgg_id", "is", null)
  
  return {
    game_count: gameCount || 0,
    category_count: uniqueCategories.size,
    friend_count: friendCount || 0,
    events_hosted: eventsHosted || 0,
    events_attended: eventsAttended || 0,
    level: profile?.level || 1,
    bgg_imports: bggImports || 0,
  }
}

/**
 * Get progress value for a specific requirement type
 */
function getProgressForRequirement(
  stats: Awaited<ReturnType<typeof getUserStats>>,
  requirementType: string | null
): number {
  switch (requirementType) {
    case "game_count":
      return stats.game_count
    case "category_count":
      return stats.category_count
    case "friend_count":
      return stats.friend_count
    case "events_hosted":
      return stats.events_hosted
    case "events_attended":
      return stats.events_attended
    case "level":
      return stats.level
    case "bgg_imports":
      return stats.bgg_imports
    default:
      return 0
  }
}

/**
 * Get badges with progress for a user
 */
export async function getBadgesWithProgress(userId?: string): Promise<{
  badges: BadgeWithProgress[]
  earnedCount: number
  totalXP: number
  error?: string
}> {
  const supabase = await createClient()
  
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    targetUserId = user?.id
  }
  
  if (!targetUserId) {
    return { badges: [], earnedCount: 0, totalXP: 0, error: "Not authenticated" }
  }
  
  // Get all badge definitions
  const { data: definitions, error: defError } = await getBadgeDefinitions()
  if (defError) {
    return { badges: [], earnedCount: 0, totalXP: 0, error: defError }
  }
  
  // Get user's earned badges
  const { data: userBadges, error: badgeError } = await getUserBadges(targetUserId)
  if (badgeError) {
    return { badges: [], earnedCount: 0, totalXP: 0, error: badgeError }
  }
  
  // Get user stats for progress calculation
  const stats = await getUserStats(targetUserId)
  
  // Create a map of earned badges for quick lookup
  const earnedMap = new Map<string, UserBadge>()
  for (const ub of userBadges) {
    earnedMap.set(ub.badge_id, ub)
  }
  
  // Combine definitions with progress
  const badges: BadgeWithProgress[] = definitions.map((def) => {
    const earned = earnedMap.get(def.id)
    const currentProgress = getProgressForRequirement(stats, def.requirement_type)
    
    return {
      ...def,
      earned: !!earned,
      earned_at: earned?.earned_at,
      current_progress: currentProgress,
    }
  })
  
  // Calculate totals
  const earnedCount = badges.filter((b) => b.earned).length
  const totalXP = badges
    .filter((b) => b.earned)
    .reduce((sum, b) => sum + (b.xp_reward || 0), 0)
  
  return { badges, earnedCount, totalXP }
}

/**
 * Check and award badges for a user based on their current stats
 * Call this after actions that might trigger badge awards (adding games, making friends, etc.)
 */
export async function checkAndAwardBadges(userId: string): Promise<{
  newBadges: string[]
  error?: string
}> {
  const supabase = await createClient()
  
  // Get all badge definitions
  const { data: definitions, error: defError } = await getBadgeDefinitions()
  if (defError || !definitions) {
    return { newBadges: [], error: defError }
  }
  
  // Get user's already earned badges
  const { data: existingBadges, error: existingError } = await getUserBadges(userId)
  if (existingError) {
    return { newBadges: [], error: existingError }
  }
  
  const earnedBadgeIds = new Set(existingBadges.map((b) => b.badge_id))
  
  // Get user stats
  const stats = await getUserStats(userId)
  
  // Find badges that should be awarded
  const newBadges: string[] = []
  
  for (const badge of definitions) {
    // Skip if already earned
    if (earnedBadgeIds.has(badge.id)) continue
    
    // Check if requirement is met
    const currentProgress = getProgressForRequirement(stats, badge.requirement_type)
    const requiredValue = badge.requirement_value || 0
    
    if (currentProgress >= requiredValue) {
      // Award the badge
      const { error: insertError } = await supabase
        .from("user_badges")
        .insert({
          user_id: userId,
          badge_id: badge.id,
        })
      
      if (!insertError) {
        newBadges.push(badge.id)
        
        // Send notification for the new badge
        await createNotification({
          user_id: userId,
          type: "badge_earned",
          title: "Badge Earned!",
          body: `You've unlocked the "${badge.name}" badge`,
          data: { badge_id: badge.id, badge_name: badge.name }
        })
        
        // Award XP for the badge (import awardXP inline to avoid circular dependency)
        if (badge.xp_reward) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("xp, level")
            .eq("id", userId)
            .single()
          
          if (profile) {
            const newXP = (profile.xp || 0) + badge.xp_reward
            // Calculate new level (same formula as in xp-utils)
            const newLevel = Math.floor(newXP / 100) + 1
            
            await supabase
              .from("profiles")
              .update({ xp: newXP, level: newLevel })
              .eq("id", userId)
            
            // Record XP event
            await supabase
              .from("xp_events")
              .insert({
                user_id: userId,
                amount: badge.xp_reward,
                reason: `badge_earned:${badge.id}`,
                reference_id: badge.id,
              })
          }
        }
      } else {
        console.error("Error awarding badge:", badge.id, insertError)
      }
    }
  }
  
  if (newBadges.length > 0) {
    revalidatePath("/trophies")
    revalidatePath("/profile")
  }
  
  return { newBadges }
}
