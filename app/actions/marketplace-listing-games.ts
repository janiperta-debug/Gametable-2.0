"use server"

import { createClient } from "@/lib/supabase/server"

export type ListingGameCategory = "board_game" | "rpg" | "miniature" | "trading_card" | "other"

export interface ListingGame {
  id: string
  game_id: string
  game: {
    id: string
    name: string
    thumbnail_url: string | null
    category: string | null
  }
}

export async function getMarketplaceListingGames() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }

  const { data, error } = await supabase
    .from("user_games")
    .select("id, game_id, status, game:games(id, name, thumbnail_url, category)")
    .eq("user_id", user.id)
    .eq("status", "owned")
    .order("created_at", { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data || []) as ListingGame[], error: null }
}
