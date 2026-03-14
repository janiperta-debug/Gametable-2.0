"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkAndAwardBadges } from "./badges"

export type FriendshipStatus = "pending" | "accepted" | "rejected"

export interface UserProfile {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  location: string | null
  bio: string | null
}

export interface FriendRequest {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  requester?: UserProfile
  addressee?: UserProfile
}

export interface DiscoverUser extends UserProfile {
  games_count: number
  interests: string[]
  friendship_status?: FriendshipStatus | null
  friendship_id?: string | null
}

/**
 * Search users by location and/or game interest
 */
export async function searchUsers(params: {
  location?: string
  gameTitle?: string
  gameType?: string
}): Promise<{ data: DiscoverUser[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Start with profiles query
  let query = supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      username,
      avatar_url,
      location,
      bio
    `)
    .limit(50)

  // Exclude current user if logged in
  if (user?.id) {
    query = query.neq("id", user.id)
  }

  // Filter by location if provided
  if (params.location && params.location.trim()) {
    query = query.ilike("location", `%${params.location.trim()}%`)
  }

  const { data: profiles, error } = await query

  if (error) {
    console.error("Error searching users:", error)
    return { data: [], error: "Failed to search users" }
  }

  if (!profiles || profiles.length === 0) {
    return { data: [] }
  }

  // Get game counts for each user
  const userIds = profiles.map(p => p.id)
  
  const { data: gameCounts } = await supabase
    .from("user_games")
    .select("user_id")
    .in("user_id", userIds)

  // Count games per user
  const gameCountMap: Record<string, number> = {}
  gameCounts?.forEach(g => {
    gameCountMap[g.user_id] = (gameCountMap[g.user_id] || 0) + 1
  })

  // Get friendship status for logged-in user
  let friendshipMap: Record<string, { status: FriendshipStatus; id: string }> = {}
  if (user) {
    const { data: friendships } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    friendships?.forEach(f => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
      friendshipMap[otherId] = { status: f.status as FriendshipStatus, id: f.id }
    })
  }

  // If game title filter, find users with that game
  let userIdsWithGame: Set<string> | null = null
  if (params.gameTitle && params.gameTitle.trim()) {
    const { data: gamesWithTitle } = await supabase
      .from("games")
      .select("id")
      .ilike("name", `%${params.gameTitle.trim()}%`)

    if (gamesWithTitle && gamesWithTitle.length > 0) {
      const gameIds = gamesWithTitle.map(g => g.id)
      const { data: userGames } = await supabase
        .from("user_games")
        .select("user_id")
        .in("game_id", gameIds)
        .in("user_id", userIds)

      userIdsWithGame = new Set(userGames?.map(ug => ug.user_id) || [])
    } else {
      userIdsWithGame = new Set()
    }
  }

  // Build result
  const result: DiscoverUser[] = profiles
    .filter(p => !userIdsWithGame || userIdsWithGame.has(p.id))
    .map(p => ({
      ...p,
      games_count: gameCountMap[p.id] || 0,
      interests: [], // Could be populated from user preferences later
      friendship_status: friendshipMap[p.id]?.status || null,
      friendship_id: friendshipMap[p.id]?.id || null,
    }))

  return { data: result }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(addresseeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
    .single()

  if (existing) {
    return { success: false, error: "Friend request already exists" }
  }

  const { error } = await supabase
    .from("friendships")
    .insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: "pending"
    })

  if (error) {
    console.error("Error sending friend request:", error)
    return { success: false, error: "Failed to send friend request" }
  }

  revalidatePath("/discover")
  revalidatePath("/profile")

  return { success: true }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  // Only the addressee can accept
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id)

  if (error) {
    console.error("Error accepting friend request:", error)
    return { success: false, error: "Failed to accept friend request" }
  }

  // Check and award badges for both users
  await checkAndAwardBadges(user.id)

  revalidatePath("/discover")
  revalidatePath("/profile")
  revalidatePath("/trophies")

  return { success: true }
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("friendships")
    .update({ status: "rejected" })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id)

  if (error) {
    console.error("Error rejecting friend request:", error)
    return { success: false, error: "Failed to reject friend request" }
  }

  revalidatePath("/discover")
  revalidatePath("/profile")

  return { success: true }
}

/**
 * Remove a friend (or cancel request)
 */
export async function removeFriend(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  if (error) {
    console.error("Error removing friend:", error)
    return { success: false, error: "Failed to remove friend" }
  }

  revalidatePath("/discover")
  revalidatePath("/profile")

  return { success: true }
}

/**
 * Get pending friend requests for current user
 */
export async function getPendingRequests(): Promise<{ data: FriendRequest[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: [], error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("friendships")
    .select(`
      id,
      requester_id,
      addressee_id,
      status,
      created_at,
      requester:profiles!friendships_requester_id_fkey(id, display_name, username, avatar_url, location, bio)
    `)
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pending requests:", error)
    return { data: [], error: "Failed to fetch pending requests" }
  }

  return { data: data as FriendRequest[] }
}

/**
 * Get friend count and pending request count for current user
 */
export async function getFriendStats(): Promise<{ friendCount: number; pendingCount: number; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { friendCount: 0, pendingCount: 0, error: "Unauthorized" }
  }

  // Get accepted friends count (both directions)
  const { count: friendCount } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  // Get pending requests count (where user is addressee)
  const { count: pendingCount } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("addressee_id", user.id)

  return { 
    friendCount: friendCount || 0, 
    pendingCount: pendingCount || 0 
  }
}

/**
 * Get list of friends for current user
 */
export async function getFriends(): Promise<{ data: UserProfile[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: [], error: "Unauthorized" }
  }

  // Get friendships where user is either requester or addressee and status is accepted
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select(`
      requester_id,
      addressee_id,
      requester:profiles!friendships_requester_id_fkey(id, display_name, username, avatar_url, location, bio),
      addressee:profiles!friendships_addressee_id_fkey(id, display_name, username, avatar_url, location, bio)
    `)
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  if (error) {
    console.error("Error fetching friends:", error)
    return { data: [], error: "Failed to fetch friends" }
  }

  // Extract friend profiles (the other person in each friendship)
  const friends: UserProfile[] = friendships?.map(f => {
    if (f.requester_id === user.id) {
      return f.addressee as unknown as UserProfile
    }
    return f.requester as unknown as UserProfile
  }) || []

  return { data: friends }
}

/**
 * Get recent friend activity (game additions and event joins)
 */
export async function getFriendActivity(): Promise<{ data: any[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: [], error: "Unauthorized" }
  }

  // First get friend IDs
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  if (!friendships || friendships.length === 0) {
    return { data: [] }
  }

  const friendIds = friendships.map(f => 
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )

  // Get recent game additions from friends
  const { data: gameAdditions } = await supabase
    .from("user_games")
    .select(`
      id,
      created_at,
      user_id,
      game:games(id, name, thumbnail_url),
      profile:profiles!user_games_user_id_fkey(id, display_name, avatar_url)
    `)
    .in("user_id", friendIds)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get recent event participations from friends
  const { data: eventJoins } = await supabase
    .from("event_participants")
    .select(`
      id,
      created_at,
      user_id,
      status,
      event:events(id, title),
      profile:profiles!event_participants_user_id_fkey(id, display_name, avatar_url)
    `)
    .in("user_id", friendIds)
    .eq("status", "attending")
    .order("created_at", { ascending: false })
    .limit(10)

  // Combine and sort by date
  const activities: any[] = []

  gameAdditions?.forEach(ga => {
    activities.push({
      id: `game-${ga.id}`,
      type: "game_added",
      user: ga.profile,
      game: ga.game,
      created_at: ga.created_at,
    })
  })

  eventJoins?.forEach(ej => {
    activities.push({
      id: `event-${ej.id}`,
      type: "event_joined",
      user: ej.profile,
      event: ej.event,
      created_at: ej.created_at,
    })
  })

  // Sort by date descending
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return { data: activities.slice(0, 10) }
}
