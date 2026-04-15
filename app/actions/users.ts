"use server"

import { createClient } from "@/lib/supabase/server"

export interface PublicUserProfile {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  location: string | null
  bio: string | null
  xp: number
  level: number
  active_room: string | null
  preferred_theme: string | null
  game_interests: string[]
  show_collection: boolean
  created_at: string
}

// Alias for backwards compatibility
export type PublicProfile = PublicUserProfile

export interface UserGame {
  id: string
  added_at: string
  play_count?: number
  game: {
    id: string
    name: string
    thumbnail_url: string | null
    category: string | null
  }
}

export interface FriendshipInfo {
  status: "none" | "pending_sent" | "pending_received" | "accepted"
  friendship_id: string | null
}

export interface UserFriend {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

/**
 * Get a public user profile by username or ID
 */
export async function getUserByUsername(usernameOrId: string): Promise<{
  profile: PublicUserProfile | null
  error?: string
}> {
  const supabase = await createClient()
  
  console.log("[v0] getUserByUsername called with:", usernameOrId)
  
  if (!usernameOrId) {
    console.log("[v0] No usernameOrId provided")
    return { profile: null, error: "No username or ID provided" }
  }

  // Check if it's a UUID (ID) format
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId)
  console.log("[v0] isUuid:", isUuid)
  
  if (isUuid) {
    // Try ID lookup first
    console.log("[v0] Trying ID lookup for:", usernameOrId)
    const { data: profileById, error: errorById } = await supabase
      .from("profiles")
      .select(`
        id,
        display_name,
        username,
        avatar_url,
        location,
        bio,
        xp,
        level,
        active_room,
        preferred_theme,
        game_interests,
        show_collection,
        created_at
      `)
      .eq("id", usernameOrId)
      .maybeSingle()
    
    console.log("[v0] ID lookup result:", { profileById: profileById?.id, errorById })
    
    if (errorById) {
      console.error("[v0] Error fetching profile by ID:", errorById)
    }
    
    if (profileById) {
      console.log("[v0] Found profile by ID:", profileById.display_name)
      return {
        profile: {
          ...profileById,
          game_interests: profileById.game_interests || [],
          show_collection: profileById.show_collection ?? true,
        }
      }
    }
    console.log("[v0] No profile found by ID, trying username lookup")
  }

// Try exact username match
  console.log("[v0] Trying exact username match for:", usernameOrId)
  let { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      username,
      avatar_url,
      location,
      bio,
      xp,
      level,
      active_room,
      preferred_theme,
      game_interests,
      show_collection,
      created_at
    `)
    .eq("username", usernameOrId)
    .maybeSingle()

  console.log("[v0] Exact username match result:", { found: !!profile, error: error?.message })

  // If not found, try case-insensitive match
  if (error || !profile) {
    console.log("[v0] Trying case-insensitive username match")
    const { data: profileLower, error: errorLower } = await supabase
      .from("profiles")
      .select(`
        id,
        display_name,
        username,
        avatar_url,
        location,
        bio,
        xp,
        level,
        active_room,
        preferred_theme,
        game_interests,
        show_collection,
        created_at
      `)
      .ilike("username", usernameOrId)
      .maybeSingle()
    
    console.log("[v0] Case-insensitive result:", { found: !!profileLower })
    if (profileLower) {
      profile = profileLower
      error = null
    } else {
      // Try matching by display_name as fallback
      console.log("[v0] Trying display_name match")
      const { data: profileByName, error: errorByName } = await supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          username,
          avatar_url,
          location,
          bio,
          xp,
          level,
          active_room,
          preferred_theme,
          game_interests,
          show_collection,
          created_at
        `)
        .ilike("display_name", usernameOrId)
        .maybeSingle()
      
      console.log("[v0] Display_name match result:", { found: !!profileByName })
      if (profileByName) {
        profile = profileByName
        error = null
      }
    }
  }

  if (error || !profile) {
    console.log("[v0] No profile found, returning error")
    return { profile: null, error: "User not found" }
  }
  
  console.log("[v0] Profile found:", profile.display_name, "username:", profile.username)

  return {
    profile: {
      ...profile,
      game_interests: profile.game_interests || [],
      show_collection: profile.show_collection ?? true,
    }
  }
}

/**
 * Get a public user profile by ID
 */
export async function getPublicUserProfile(userId: string): Promise<{
  profile: PublicUserProfile | null
  error?: string
}> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      username,
      avatar_url,
      location,
      bio,
      xp,
      level,
      active_room,
      preferred_theme,
      game_interests,
      show_collection,
      created_at
    `)
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching public profile:", error)
    return { profile: null, error: "User not found" }
  }

  return {
    profile: {
      ...profile,
      game_interests: profile.game_interests || [],
      show_collection: profile.show_collection ?? true,
    }
  }
}

/**
 * Get user's collection (if they allow it to be shown)
 */
export async function getUserCollection(userId: string): Promise<{
  games: UserGame[]
  categoryCounts: Record<string, number>
  error?: string
}> {
  const supabase = await createClient()

  // First check if user allows collection viewing
  const { data: profile } = await supabase
    .from("profiles")
    .select("show_collection")
    .eq("id", userId)
    .single()

  if (!profile?.show_collection) {
    return { games: [], categoryCounts: {}, error: "Collection is private" }
  }

  const { data: userGames, error } = await supabase
    .from("user_games")
    .select(`
      id,
      added_at,
      game:games(id, name, thumbnail_url, category)
    `)
    .eq("user_id", userId)
    .order("added_at", { ascending: false })

  if (error) {
    console.error("Error fetching user collection:", error)
    return { games: [], categoryCounts: {}, error: "Failed to fetch collection" }
  }

  // Calculate category counts
  const categoryCounts: Record<string, number> = {}
  const games: UserGame[] = []

  for (const ug of userGames || []) {
    if (ug.game) {
      const game = ug.game as { id: string; name: string; thumbnail_url: string | null; category: string | null }
      games.push({
        id: ug.id,
        added_at: ug.added_at,
        game
      })
      const category = game.category || "Other"
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    }
  }

  return { games, categoryCounts }
}

/**
 * Get recent game additions for a user
 */
export async function getUserRecentActivity(userId: string, limit: number = 5): Promise<{
  games: UserGame[]
  error?: string
}> {
  const supabase = await createClient()

  // Check if collection is public
  const { data: profile } = await supabase
    .from("profiles")
    .select("show_collection")
    .eq("id", userId)
    .single()

  if (!profile?.show_collection) {
    return { games: [], error: "Activity is private" }
  }

  const { data: userGames, error } = await supabase
    .from("user_games")
    .select(`
      id,
      added_at,
      game:games(id, name, thumbnail_url, category)
    `)
    .eq("user_id", userId)
    .order("added_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching recent activity:", error)
    return { games: [], error: "Failed to fetch activity" }
  }

  const games: UserGame[] = (userGames || [])
    .filter(ug => ug.game)
    .map(ug => ({
      id: ug.id,
      added_at: ug.added_at,
      game: ug.game as { id: string; name: string; thumbnail_url: string | null; category: string | null }
    }))

  return { games }
}

/**
 * Get friendship status between current user and target user
 */
export async function getFriendshipStatus(targetUserId: string): Promise<FriendshipInfo> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { status: "none", friendship_id: null }
  }

  // Check for existing friendship in either direction
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
    .maybeSingle()

  if (!friendship) {
    return { status: "none", friendship_id: null }
  }

  if (friendship.status === "accepted") {
    return { status: "accepted", friendship_id: friendship.id }
  }

  if (friendship.status === "pending") {
    if (friendship.requester_id === user.id) {
      return { status: "pending_sent", friendship_id: friendship.id }
    } else {
      return { status: "pending_received", friendship_id: friendship.id }
    }
  }

  return { status: "none", friendship_id: null }
}

/**
 * Get friends list for a user (public profiles only)
 */
export async function getUserFriends(usernameOrId: string): Promise<{
  friends: UserFriend[]
  error?: string
}> {
  const supabase = await createClient()

  // First get the user ID from username or ID
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id")
    .or(`id.eq.${usernameOrId},username.eq.${usernameOrId}`)
    .single()

  if (!targetUser) {
    return { friends: [], error: "User not found" }
  }

  // Get accepted friendships where user is either requester or addressee
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select(`
      requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url),
      addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("status", "accepted")
    .or(`requester_id.eq.${targetUser.id},addressee_id.eq.${targetUser.id}`)

  if (error) {
    console.error("Error fetching friends:", error)
    return { friends: [], error: "Failed to fetch friends" }
  }

  // Extract the friend profiles (the one that's not the target user)
  const friends: UserFriend[] = (friendships || []).map(f => {
    const requester = f.requester as unknown as UserFriend
    const addressee = f.addressee as unknown as UserFriend
    return requester.id === targetUser.id ? addressee : requester
  })

  return { friends }
}

/**
 * Get user's collection by username or ID
 */
export async function getUserCollectionByUsername(usernameOrId: string): Promise<{
  games: UserGame[]
  error?: string
}> {
  const supabase = await createClient()

  // Check if it's a UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId)

  // First get the user profile by ID or username
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, show_collection")
    .or(`id.eq.${usernameOrId},username.eq.${usernameOrId}`)
    .single()

  if (!profile) {
    return { games: [], error: "User not found" }
  }

  if (!profile.show_collection) {
    return { games: [], error: "Collection is private" }
  }

  const { data: userGames, error } = await supabase
    .from("user_games")
    .select(`
      id,
      added_at,
      play_count,
      game:games(id, name, thumbnail_url, category)
    `)
    .eq("user_id", profile.id)
    .order("added_at", { ascending: false })

  if (error) {
    console.error("Error fetching user collection:", error)
    return { games: [], error: "Failed to fetch collection" }
  }

  const games: UserGame[] = (userGames || [])
    .filter(ug => ug.game)
    .map(ug => ({
      id: ug.id,
      added_at: ug.added_at,
      play_count: (ug as { play_count?: number }).play_count,
      game: ug.game as { id: string; name: string; thumbnail_url: string | null; category: string | null }
    }))

  return { games }
}
