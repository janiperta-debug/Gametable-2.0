"use server"

import { createClient } from "@/lib/supabase/server"
import type { DiscoverUser, FriendshipStatus } from "./friends"

export async function searchUsers(params: {
  location?: string
  gameTitle?: string
  gameType?: string
}): Promise<{ data: DiscoverUser[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, location, bio")
    .limit(50)

  if (user?.id) query = query.neq("id", user.id)
  if (params.location?.trim()) {
    query = query.ilike("location", `%${params.location.trim()}%`)
  }

  const { data: profiles, error } = await query
  if (error) {
    console.error("Error searching users:", error)
    return { data: [], error: "Failed to search users" }
  }
  if (!profiles?.length) return { data: [] }

  const userIds = profiles.map(p => p.id)
  const { data: gameCounts } = await supabase
    .from("user_games")
    .select("user_id")
    .in("user_id", userIds)

  const gameCountMap: Record<string, number> = {}
  gameCounts?.forEach(g => {
    gameCountMap[g.user_id] = (gameCountMap[g.user_id] || 0) + 1
  })

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

  let userIdsWithGame: Set<string> | null = null
  if (params.gameTitle?.trim() || params.gameType?.trim()) {
    let gamesQuery = supabase.from("games").select("id")
    if (params.gameTitle?.trim()) {
      gamesQuery = gamesQuery.ilike("name", `%${params.gameTitle.trim()}%`)
    }
    if (params.gameType?.trim()) {
      gamesQuery = gamesQuery.eq("category", params.gameType.trim())
    }

    const { data: matchingGames } = await gamesQuery
    const gameIds = matchingGames?.map(g => g.id) || []

    if (gameIds.length) {
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

  return {
    data: profiles
      .filter(p => !userIdsWithGame || userIdsWithGame.has(p.id))
      .map(p => ({
        ...p,
        games_count: gameCountMap[p.id] || 0,
        interests: [],
        friendship_status: friendshipMap[p.id]?.status || null,
        friendship_id: friendshipMap[p.id]?.id || null,
      }))
  }
}
