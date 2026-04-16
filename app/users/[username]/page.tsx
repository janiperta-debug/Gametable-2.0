import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PublicProfileClient } from "./public-profile-client"

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Check if UUID or username
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username)

  // Query profile directly
  const { data: profile } = isUuid
    ? await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, bio, location, xp, level, show_collection, game_interests")
        .eq("id", username)
        .maybeSingle()
    : await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, bio, location, xp, level, show_collection, game_interests")
        .eq("username", username)
        .maybeSingle()

  if (!profile) {
    notFound()
  }

  // Get game_interests directly from profile
  const gameInterests = profile.game_interests as string[] | null

  // Get game count
  const { count: gameCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)

  // Get user's games if show_collection is true
  let games: Array<{ 
    id: string
    name: string
    thumbnail_url: string | null
    category: string | null
    min_players: number | null
    max_players: number | null
    year: number | null
  }> = []
  if (profile.show_collection !== false) {
    const { data: userGames } = await supabase
      .from("user_games")
      .select("game:games(id, name, thumbnail_url, category, min_players, max_players, year)")
      .eq("user_id", profile.id)
      .eq("status", "owned")
    
    games = (userGames || [])
      .map(ug => ug.game)
      .filter((g): g is { 
        id: string
        name: string
        thumbnail_url: string | null
        category: string | null
        min_players: number | null
        max_players: number | null
        year: number | null
      } => g !== null)
  }

  // Calculate category counts
  const categoryCounts = {
    boardGames: 0,
    rpg: 0,
    miniatures: 0,
    tradingCards: 0,
  }
  games.forEach(game => {
    const cat = game.category?.toLowerCase() || ""
    if (cat.includes("rpg") || cat.includes("role")) categoryCounts.rpg++
    else if (cat.includes("miniature") || cat.includes("wargame")) categoryCounts.miniatures++
    else if (cat.includes("trading") || cat.includes("tcg") || cat.includes("card game")) categoryCounts.tradingCards++
    else categoryCounts.boardGames++
  })

  // Get current user for friend button
  const { data: { user } } = await supabase.auth.getUser()

  // Check friendship status if logged in
  let friendshipStatus: "none" | "pending" | "accepted" | "incoming" = "none"
  let friendshipId: string | null = null
  if (user && user.id !== profile.id) {
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id, status, requester_id")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`)
      .maybeSingle()
    
    if (friendship) {
      friendshipId = friendship.id
      if (friendship.status === "accepted") {
        friendshipStatus = "accepted"
      } else if (friendship.status === "pending") {
        friendshipStatus = friendship.requester_id === user.id ? "pending" : "incoming"
      }
    }
  }

  return (
    <PublicProfileClient 
      profile={profile}
      gameInterests={gameInterests}
      gameCount={gameCount ?? 0}
      games={games}
      categoryCounts={categoryCounts}
      currentUserId={user?.id ?? null}
      initialFriendshipStatus={friendshipStatus}
      initialFriendshipId={friendshipId}
    />
  )
}
