import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PublicProfileClient } from "./public-profile-client"

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
        .select("id, display_name, username, avatar_url, bio, location, xp, level, game_interests, show_collection")
        .eq("id", username)
        .maybeSingle()
    : await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, bio, location, xp, level, game_interests, show_collection")
        .eq("username", username)
        .maybeSingle()

  if (!profile) {
    notFound()
  }

  // Get game count
  const { count: gameCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)

  // Get user's games if show_collection is true
  let games: Array<{ id: string; name: string; thumbnail_url: string | null }> = []
  if (profile.show_collection !== false) {
    const { data: userGames } = await supabase
      .from("user_games")
      .select("game:games(id, name, thumbnail_url)")
      .eq("user_id", profile.id)
      .limit(12)
    
    games = (userGames || [])
      .map(ug => ug.game)
      .filter((g): g is { id: string; name: string; thumbnail_url: string | null } => g !== null)
  }

  // Get current user for friend button
  const { data: { user } } = await supabase.auth.getUser()

  // Check friendship status if logged in
  let friendshipStatus: "none" | "pending" | "accepted" | "incoming" = "none"
  if (user && user.id !== profile.id) {
    const { data: friendship } = await supabase
      .from("friendships")
      .select("status, requester_id")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`)
      .maybeSingle()
    
    if (friendship) {
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
      gameCount={gameCount ?? 0}
      games={games}
      currentUserId={user?.id ?? null}
      initialFriendshipStatus={friendshipStatus}
    />
  )
}
