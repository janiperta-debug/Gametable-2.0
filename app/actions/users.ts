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
  game_interests: string[]
  show_collection: boolean
  created_at: string
}

export interface UserGame {
  id: string
  added_at: string
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
