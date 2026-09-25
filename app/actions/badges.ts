"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase/service"
import { createNotification } from "./notifications"
import { getManorLevelFromXp } from "@/lib/manor-progression"

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
export async function getBadgeDefinitions(client?: any): Promise<{ data: BadgeDefinition[]; error?: string }> {
  const supabase = client || await createClient()
  
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
export async function getUserBadges(userId?: string, client?: any): Promise<{ data: UserBadge[]; error?: string }> {
  const supabase = client || await createClient()
  
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


// Event achievements require completed events and recorded participation.
// Tournament wins additionally require an organizer-recorded champion entry
// that actually won a completed match.
async function getVerifiedEventStats(userId: string, db: any) {
  const empty = { tournament_wins: 0, tournaments_hosted: 0, campaigns_played: 0, campaigns_hosted: 0, league_seasons_played: 0, league_seasons_hosted: 0 }
  const { data: events, error } = await db.from("events")
    .select("id,host_id,event_type,event_config").eq("status", "completed").in("event_type", ["tournament", "campaign"])
  if (error) throw new Error(error.message)
  const tournaments = (events || []).filter((e: any) => e.event_type === "tournament")
  const campaigns = (events || []).filter((e: any) => e.event_type === "campaign")
  empty.tournaments_hosted = tournaments.filter((e: any) => e.host_id === userId).length
  empty.campaigns_hosted = campaigns.filter((e: any) => e.host_id === userId).length
  const campaignIds = campaigns.filter((e: any) => e.host_id !== userId).map((e: any) => e.id)
  if (campaignIds.length) {
    const { data: participants, error: pError } = await db.from("event_participants")
      .select("event_id").eq("user_id", userId).eq("status", "attending").in("event_id", campaignIds)
    if (pError) throw new Error(pError.message)
    const { data: sessions, error: sError } = await db.from("event_sessions")
      .select("event_id").eq("status", "completed").in("event_id", campaignIds)
    if (sError) throw new Error(sError.message)
    const played = new Set((sessions || []).map((x: any) => x.event_id))
    empty.campaigns_played = new Set((participants || []).filter((x: any) => played.has(x.event_id)).map((x: any) => x.event_id)).size
  }
  const tournamentIds = tournaments.map((e: any) => e.id)
  if (tournamentIds.length) {
    const { data: entries, error: eError } = await db.from("event_entries")
      .select("id,event_id").eq("user_id", userId).in("event_id", tournamentIds)
    if (eError) throw new Error(eError.message)
    const ownEntries = new Map((entries || []).map((e: any) => [e.event_id, e.id]))
    const { data: matches, error: mError } = await db.from("event_matches")
      .select("event_id,winner_entry_id").eq("status", "completed").in("event_id", tournamentIds)
    if (mError) throw new Error(mError.message)
    const verifiedWins = new Set((matches || []).filter((m: any) => ownEntries.get(m.event_id) === m.winner_entry_id).map((m: any) => m.event_id))
    empty.tournament_wins = tournaments.filter((e: any) =>
      ownEntries.get(e.id) && e.event_config?.champion_entry_id === ownEntries.get(e.id) && verifiedWins.has(e.id)
    ).length
  }
  const { data: seasons, error: seasonError } = await db.from("league_seasons")
    .select("id,league_id,leagues!inner(owner_id)").eq("status", "completed")
  if (seasonError) throw new Error(seasonError.message)
  const completed = seasons || []
  empty.league_seasons_hosted = completed.filter((s: any) => {
    const league = Array.isArray(s.leagues) ? s.leagues[0] : s.leagues
    return league?.owner_id === userId
  }).length
  if (completed.length) {
    const { data: links, error: linkError } = await db.from("league_season_events")
      .select("season_id,event_id").in("season_id", completed.map((s: any) => s.id))
    if (linkError) throw new Error(linkError.message)
    const eventIds = [...new Set((links || []).map((l: any) => l.event_id))]
    if (eventIds.length) {
      const { data: leagueEvents, error: leError } = await db.from("events")
        .select("id").eq("status", "completed").in("id", eventIds)
      if (leError) throw new Error(leError.message)
      const completedEventIds = new Set((leagueEvents || []).map((e: any) => e.id))
      const { data: entries, error: entryError } = await db.from("event_entries")
        .select("id,event_id").eq("user_id", userId).in("event_id", eventIds)
      if (entryError) throw new Error(entryError.message)
      const entryIds = (entries || []).map((e: any) => e.id)
      if (entryIds.length) {
        const { data: matches, error: matchError } = await db.from("event_matches")
          .select("event_id,entry_a_id,entry_b_id").eq("status", "completed").in("event_id", eventIds)
        if (matchError) throw new Error(matchError.message)
        const playedEntries = new Set(entryIds)
        const playedEvents = new Set((matches || []).filter((m: any) =>
          playedEntries.has(m.entry_a_id) || playedEntries.has(m.entry_b_id)
        ).map((m: any) => m.event_id))
        empty.league_seasons_played = new Set((links || []).filter((l: any) =>
          completedEventIds.has(l.event_id) && playedEvents.has(l.event_id)
        ).map((l: any) => l.season_id)).size
      }
    }
  }
  return empty
}

/**
 * Get user stats for badge progress calculation
 */
export async function getUserStats(userId: string, client?: any): Promise<{
  game_count: number
  category_count: number
  friend_count: number
  events_hosted: number
  events_attended: number
  level: number
  manor_level: number
  bgg_imports: number
  import_operations: number
  tournament_wins: number
  tournaments_hosted: number
  campaigns_played: number
  campaigns_hosted: number
  league_seasons_played: number
  league_seasons_hosted: number
}> {
  const supabase = client || await createClient()
  
  // Count owned collection entries across all four hobby categories.
  // Card and miniature ownership lives in separate collection tables.
  const { count: gameCount, error: gameCountError } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "owned")
  if (gameCountError) throw new Error(gameCountError.message)

  const { data: userGames, error: categoryError } = await supabase
    .from("user_games")
    .select("games(category)")
    .eq("user_id", userId)
    .eq("status", "owned")
  if (categoryError) throw new Error(categoryError.message)

  const uniqueCategories = new Set<string>()
  for (const row of userGames || []) {
    const relation = row.games as unknown as { category?: string | null } | { category?: string | null }[] | null
    const game = Array.isArray(relation) ? relation[0] : relation
    const category = game?.category
    if (category === "board_game" || category === "rpg") uniqueCategories.add(category)
    if (category === "trading_card" || category === "tcg") uniqueCategories.add("tcg")
    if (category === "miniature" || category === "miniatures") uniqueCategories.add("miniature")
  }

  const [{ count: ownedCards, error: cardsError }, { count: ownedMiniatures, error: miniaturesError }] = await Promise.all([
    supabase.from("tcg_collection").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("mini_army_units").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("owned", true),
  ])
  if (cardsError) throw new Error(cardsError.message)
  if (miniaturesError) throw new Error(miniaturesError.message)
  if ((ownedCards || 0) > 0) uniqueCategories.add("tcg")
  if ((ownedMiniatures || 0) > 0) uniqueCategories.add("miniature")

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
    .eq("status", "completed")
  
  // Attendance uses the current event_participants table. Only completed
  // events count; the host's automatic participation does not count twice.
  const { data: attendedRows, error: attendanceError } = await supabase
    .from("event_participants")
    .select("event_id, events!inner(status, host_id)")
    .eq("user_id", userId)
    .eq("status", "attending")
    .eq("events.status", "completed")
  if (attendanceError) throw new Error(attendanceError.message)
  const eventsAttended = new Set((attendedRows || []).filter((row: any) => {
    const event = Array.isArray(row.events) ? row.events[0] : row.events
    return event?.host_id !== userId
  }).map((row: any) => row.event_id)).size

  // Get user level
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", userId)
    .single()
  
  const { count: importOperations, error: importError } = await supabase
    .from("collection_import_operations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
  if (importError) throw new Error(importError.message)
  
  const eventStats = await getVerifiedEventStats(userId, supabase)
  return {
    ...eventStats,
    game_count: (gameCount || 0) + (ownedCards || 0) + (ownedMiniatures || 0),
    category_count: uniqueCategories.size,
    friend_count: friendCount || 0,
    events_hosted: eventsHosted || 0,
    events_attended: eventsAttended,
    level: getManorLevelFromXp(profile?.xp || 0),
    manor_level: getManorLevelFromXp(profile?.xp || 0),
    bgg_imports: importOperations || 0,
    import_operations: importOperations || 0,
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
      return stats.manor_level
    case "bgg_imports":
    case "import_operations":
      return stats.import_operations
    case "tournament_wins": return stats.tournament_wins
    case "tournaments_hosted": return stats.tournaments_hosted
    case "campaigns_played": return stats.campaigns_played
    case "campaigns_hosted": return stats.campaigns_hosted
    case "league_seasons_played": return stats.league_seasons_played
    case "league_seasons_hosted": return stats.league_seasons_hosted
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
  const { data: definitions, error: defError } = await getBadgeDefinitions(supabase)
  if (defError) {
    return { badges: [], earnedCount: 0, totalXP: 0, error: defError }
  }
  
  // Reconcile earned badges when the owner opens the trophy page.
  const { data: { user: viewer } } = await supabase.auth.getUser()
  if (viewer?.id === targetUserId) {
    const reconciliation = await checkAndAwardBadgesInternal(targetUserId, supabase)
    if (reconciliation.error) console.error("Badge reconciliation failed:", reconciliation.error)
  }

  // Get earned badges after reconciliation.
  const { data: userBadges, error: badgeError } = await getUserBadges(targetUserId, supabase)
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) return { newBadges: [], error: "Forbidden" }
  return checkAndAwardBadgesInternal(userId, supabase)
}

async function checkAndAwardBadgesInternal(userId: string, supabase: any): Promise<{
  newBadges: string[]
  error?: string
}> {
  
  // Get all badge definitions
  const { data: definitions, error: defError } = await getBadgeDefinitions()
  if (defError || !definitions) {
    return { newBadges: [], error: defError }
  }
  
  // Get user's already earned badges
  const { data: existingBadges, error: existingError } = await getUserBadges(userId, supabase)
  if (existingError) {
    return { newBadges: [], error: existingError }
  }
  
  const earnedBadgeIds = new Set(existingBadges.map((b) => b.badge_id))
  
  // Get user stats
  let stats: Awaited<ReturnType<typeof getUserStats>>
  try {
    stats = await getUserStats(userId, supabase)
  } catch (error) {
    console.error("Badge stats failed:", error)
    return { newBadges: [], error: error instanceof Error ? error.message : "Badge stats unavailable" }
  }

  // Find badges that should be awarded
  const newBadges: string[] = []
  
  for (const badge of definitions) {
    // Skip if already earned
    if (earnedBadgeIds.has(badge.id)) {
      continue
    }
    
    // Only the verified import operation log qualifies for portal medals.
    if (!badge.requirement_type || !["game_count", "category_count", "friend_count", "events_hosted", "events_attended", "level", "import_operations", "tournament_wins", "tournaments_hosted", "campaigns_played", "campaigns_hosted", "league_seasons_played", "league_seasons_hosted"].includes(badge.requirement_type) || !badge.requirement_value || badge.requirement_value <= 0) continue

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

export async function checkAndAwardRequesterBadges(friendshipId: string): Promise<{
  newBadges: string[]
  error?: string
}> {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { newBadges: [], error: "Unauthorized" }
  const { data: friendship } = await client
    .from("friendships")
    .select("requester_id")
    .eq("id", friendshipId)
    .eq("addressee_id", user.id)
    .eq("status", "accepted")
    .single()
  if (!friendship) return { newBadges: [], error: "Forbidden" }
  return checkAndAwardBadgesInternal(friendship.requester_id, createServiceClient())
}
