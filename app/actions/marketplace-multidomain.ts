"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type MarketplaceSourceType = "board_game" | "tcg" | "miniature"
export type MarketplaceListingType = "sell" | "trade" | "give"
export type MarketplaceCondition = "new" | "like_new" | "good" | "fair" | "poor"

export interface MarketplaceSource {
  id: string
  sourceType: MarketplaceSourceType
  title: string
  image: string | null
  subtitle: string
  ownershipId: string
}

export async function getMarketplaceSources(): Promise<{ data: MarketplaceSource[]; error: string | null }> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { data: [], error: "Not authenticated" }

  const [games, cards, miniatures] = await Promise.all([
    supabase.from("user_games").select("id, game_id, game:games(name, thumbnail_url)").eq("user_id", auth.user.id).eq("status", "owned"),
    supabase.from("tcg_collection").select("id, card_id, foil, card:tcg_cards(name, image_url, set_name, rarity)").eq("user_id", auth.user.id),
    supabase.from("mini_army_units").select("id, unit_id, model_count, unit:mini_units(name, unit_type)").eq("user_id", auth.user.id).eq("owned", true),
  ])
  if (games.error) return { data: [], error: games.error.message }
  if (cards.error) return { data: [], error: cards.error.message }
  if (miniatures.error) return { data: [], error: miniatures.error.message }

  const data: MarketplaceSource[] = []
  for (const row of games.data ?? []) {
    const game = Array.isArray(row.game) ? row.game[0] : row.game
    data.push({ id: `board_game:${row.id}`, sourceType: "board_game", title: game?.name ?? "Unknown game", image: game?.thumbnail_url ?? null, subtitle: "Board game", ownershipId: row.id })
  }
  for (const row of cards.data ?? []) {
    const card = Array.isArray(row.card) ? row.card[0] : row.card
    data.push({ id: `tcg:${row.id}`, sourceType: "tcg", title: card?.name ?? "Unknown card", image: card?.image_url ?? null, subtitle: [card?.set_name, card?.rarity, row.foil ? "Foil" : null].filter(Boolean).join(" · ") || "TCG", ownershipId: row.id })
  }
  for (const row of miniatures.data ?? []) {
    const unit = Array.isArray(row.unit) ? row.unit[0] : row.unit
    data.push({ id: `miniature:${row.id}`, sourceType: "miniature", title: unit?.name ?? "Unknown miniature", image: null, subtitle: [unit?.unit_type, row.model_count ? `${row.model_count} models` : null].filter(Boolean).join(" · ") || "Miniature", ownershipId: row.id })
  }
  return { data, error: null }
}

export async function createMultidomainListing(input: { sourceType: MarketplaceSourceType; ownershipId: string; listingType: MarketplaceListingType; condition: MarketplaceCondition; price?: number; description?: string }) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { success: false, error: "Not authenticated" }

  const payload: Record<string, unknown> = { seller_id: auth.user.id, source_type: input.sourceType, listing_type: input.listingType, condition: input.condition, price: input.price ?? null, description: input.description ?? null, status: "active", game_id: null }
  if (input.sourceType === "board_game") {
    const { data } = await supabase.from("user_games").select("id, game_id").eq("id", input.ownershipId).eq("user_id", auth.user.id).eq("status", "owned").maybeSingle()
    if (!data) return { success: false, error: "Game not found in your collection" }
    payload.user_game_id = data.id
    payload.game_id = data.game_id
  } else if (input.sourceType === "tcg") {
    const { data } = await supabase.from("tcg_collection").select("id").eq("id", input.ownershipId).eq("user_id", auth.user.id).maybeSingle()
    if (!data) return { success: false, error: "Card not found in your collection" }
    payload.tcg_collection_id = data.id
  } else {
    const { data } = await supabase.from("mini_army_units").select("id").eq("id", input.ownershipId).eq("user_id", auth.user.id).eq("owned", true).maybeSingle()
    if (!data) return { success: false, error: "Miniature not found in your collection" }
    payload.mini_army_unit_id = data.id
  }

  const { error } = await supabase.from("marketplace_listings").insert(payload)
  if (error) return { success: false, error: error.message }
  revalidatePath("/marketplace")
  revalidatePath("/collection")
  return { success: true }
}
