"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ListingCondition, ListingType } from "./marketplace"

export type MarketplaceSourceType = "board_game" | "tcg" | "miniature"

export interface MarketplaceSource {
  id: string
  sourceType: MarketplaceSourceType
  title: string
  image: string | null
  subtitle: string | null
  ownershipId: string
  catalogId: string | null
}

export async function getMarketplaceSources(): Promise<{ data: MarketplaceSource[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }

  const [games, cards, miniatures] = await Promise.all([
    supabase.from("user_games").select("id, game_id, game:games(id, name, thumbnail_url)").eq("user_id", user.id).eq("status", "owned"),
    supabase.from("tcg_collection").select("id, card_id, quantity, condition, foil, card:tcg_cards(id, name, image_url, set_name, rarity)").eq("user_id", user.id),
    supabase.from("mini_army_units").select("id, unit_id, model_count, paint_status, owned, unit:mini_units(id, name, unit_type, faction:mini_factions(name, system:mini_systems(code)))").eq("user_id", user.id).eq("owned", true),
  ])

  if (games.error) return { data: [], error: games.error.message }
  if (cards.error) return { data: [], error: cards.error.message }
  if (miniatures.error) return { data: [], error: miniatures.error.message }

  const result: MarketplaceSource[] = []
  for (const row of games.data ?? []) {
    const game = Array.isArray(row.game) ? row.game[0] : row.game
    result.push({ id: `board_game:${row.id}`, sourceType: "board_game", title: game?.name ?? "Unknown game", image: game?.thumbnail_url ?? null, subtitle: "Board Game", ownershipId: row.id, catalogId: row.game_id })
  }
  for (const row of cards.data ?? []) {
    const card = Array.isArray(row.card) ? row.card[0] : row.card
    result.push({ id: `tcg:${row.id}`, sourceType: "tcg", title: card?.name ?? "Unknown card", image: card?.image_url ?? null, subtitle: [card?.set_name, card?.rarity, row.foil ? "Foil" : null].filter(Boolean).join(" · ") || "TCG", ownershipId: row.id, catalogId: row.card_id })
  }
  for (const row of miniatures.data ?? []) {
    const unit = Array.isArray(row.unit) ? row.unit[0] : row.unit
    const faction = Array.isArray(unit?.faction) ? unit?.faction[0] : unit?.faction
    const system = Array.isArray(faction?.system) ? faction?.system[0] : faction?.system
    result.push({ id: `miniature:${row.id}`, sourceType: "miniature", title: unit?.name ?? "Unknown miniature", image: null, subtitle: [system?.code, faction?.name, row.model_count ? `${row.model_count} models` : null].filter(Boolean).join(" · ") || "Miniature", ownershipId: row.id, catalogId: row.unit_id })
  }
  return { data: result, error: null }
}

export async function createMultidomainListing(input: { sourceType: MarketplaceSourceType; ownershipId: string; listingType: ListingType; condition: ListingCondition; price?: number; description?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  let payload: Record<string, unknown> = { seller_id: user.id, source_type: input.sourceType, listing_type: input.listingType, condition: input.condition, price: input.price ?? null, description: input.description ?? null, status: "active" }
  if (input.sourceType === "board_game") {
    const { data } = await supabase.from("user_games").select("id, game_id").eq("id", input.ownershipId).eq("user_id", user.id).eq("status", "owned").maybeSingle()
    if (!data) return { success: false, error: "Game not found in your collection" }
    payload = { ...payload, user_game_id: data.id, game_id: data.game_id }
  } else if (input.sourceType === "tcg") {
    const { data } = await supabase.from("tcg_collection").select("id").eq("id", input.ownershipId).eq("user_id", user.id).maybeSingle()
    if (!data) return { success: false, error: "Card not found in your collection" }
    payload = { ...payload, tcg_collection_id: data.id, game_id: null }
  } else {
    const { data } = await supabase.from("mini_army_units").select("id, owned").eq("id", input.ownershipId).eq("user_id", user.id).eq("owned", true).maybeSingle()
    if (!data) return { success: false, error: "Miniature not found in your collection" }
    payload = { ...payload, mini_army_unit_id: data.id, game_id: null }
  }

  const { error } = await supabase.from("marketplace_listings").insert(payload)
  if (error) return { success: false, error: error.message }
  revalidatePath("/marketplace")
  revalidatePath("/collection")
  return { success: true }
}
