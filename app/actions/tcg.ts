"use server"

import { createClient } from "@/lib/supabase/server"
import { awardXP } from "./xp"
import type { TCGSearchResult } from "@/app/api/tcg/search/route"

export type TCGGame = "mtg" | "pokemon" | "lorcana" | "yugioh" | "fab" | "onepiece"

export interface AddCardResult {
  success: boolean
  error?: string
  cardId?: string
  isNew?: boolean
}

export async function addCardToCollection(
  card: TCGSearchResult,
  quantity: number = 1,
  status: "owned" | "wishlist" = "owned"
): Promise<AddCardResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Check if card already exists in tcg_cards table
    let cardId: string
    const { data: existingCard } = await supabase
      .from("tcg_cards")
      .select("id")
      .eq("external_id", card.id)
      .eq("game", card.game)
      .single()

    if (existingCard) {
      cardId = existingCard.id
    } else {
      // Insert the card
      const { data: newCard, error: cardError } = await supabase
        .from("tcg_cards")
        .insert({
          external_id: card.id,
          name: card.name,
          game: card.game,
          set_name: card.set,
          set_code: card.setCode || null,
          rarity: card.rarity || null,
          image_url: card.imageUrl || null,
          thumbnail_url: card.thumbnailUrl || null,
          card_type: card.type || null,
          description: card.description || null,
          price_usd: card.price || null,
        })
        .select("id")
        .single()

      if (cardError) {
        console.error("Error inserting card:", cardError)
        return { success: false, error: cardError.message }
      }
      cardId = newCard.id
    }

    // Check if user already has this card in their collection
    const { data: existingCollectionEntry } = await supabase
      .from("tcg_collection")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("card_id", cardId)
      .eq("status", status)
      .single()

    if (existingCollectionEntry) {
      // Update quantity
      const { error: updateError } = await supabase
        .from("tcg_collection")
        .update({ quantity: existingCollectionEntry.quantity + quantity })
        .eq("id", existingCollectionEntry.id)

      if (updateError) {
        console.error("Error updating quantity:", updateError)
        return { success: false, error: updateError.message }
      }

      return { success: true, cardId, isNew: false }
    } else {
      // Insert new collection entry
      const { error: collectionError } = await supabase
        .from("tcg_collection")
        .insert({
          user_id: user.id,
          card_id: cardId,
          quantity,
          status,
        })

      if (collectionError) {
        console.error("Error adding to collection:", collectionError)
        return { success: false, error: collectionError.message }
      }

      // Award XP for new addition
      if (status === "owned") {
        await awardXP(user.id, 5, "tcg_card_added", `Added ${card.name} to TCG collection`)
      }

      return { success: true, cardId, isNew: true }
    }
  } catch (error) {
    console.error("Error in addCardToCollection:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function bulkAddCards(
  cards: Array<{ card: TCGSearchResult; quantity: number }>,
  status: "owned" | "wishlist" = "owned"
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const { card, quantity } of cards) {
    const result = await addCardToCollection(card, quantity, status)
    if (result.success) {
      results.success++
    } else {
      results.failed++
      results.errors.push(`${card.name}: ${result.error}`)
    }
  }

  return results
}

// Parse deck list text format
// Supports formats like:
// "4 Lightning Bolt"
// "4x Lightning Bolt"
// "4 Lightning Bolt (M20) 160"
export function parseDeckList(text: string): Array<{ name: string; quantity: number; setCode?: string }> {
  const lines = text.split("\n").filter((line) => line.trim())
  const parsed: Array<{ name: string; quantity: number; setCode?: string }> = []

  for (const line of lines) {
    // Skip comments and section headers
    if (line.startsWith("//") || line.startsWith("#") || line.endsWith(":")) continue

    // Match patterns like "4 Lightning Bolt", "4x Lightning Bolt", "4 Lightning Bolt (M20) 160"
    const match = line.match(/^(\d+)x?\s+(.+?)(?:\s+\(([A-Z0-9]+)\))?(?:\s+\d+)?$/i)

    if (match) {
      parsed.push({
        quantity: parseInt(match[1], 10),
        name: match[2].trim(),
        setCode: match[3] || undefined,
      })
    }
  }

  return parsed
}

export async function getUserTCGCollection(game?: TCGGame) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", cards: [] }
  }

  let query = supabase
    .from("tcg_collection")
    .select(`
      id,
      quantity,
      status,
      added_at,
      card:tcg_cards (
        id,
        external_id,
        name,
        game,
        set_name,
        set_code,
        rarity,
        image_url,
        thumbnail_url,
        card_type,
        price_usd
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "owned")

  if (game) {
    query = query.eq("tcg_cards.game", game)
  }

  const { data, error } = await query.order("added_at", { ascending: false })

  if (error) {
    console.error("Error fetching TCG collection:", error)
    return { error: error.message, cards: [] }
  }

  return { cards: data || [] }
}

export async function getUserTCGWishlist(game?: TCGGame) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", cards: [] }
  }

  let query = supabase
    .from("tcg_collection")
    .select(`
      id,
      quantity,
      status,
      added_at,
      card:tcg_cards (
        id,
        external_id,
        name,
        game,
        set_name,
        set_code,
        rarity,
        image_url,
        thumbnail_url,
        card_type,
        price_usd
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "wishlist")

  if (game) {
    query = query.eq("tcg_cards.game", game)
  }

  const { data, error } = await query.order("added_at", { ascending: false })

  if (error) {
    console.error("Error fetching TCG wishlist:", error)
    return { error: error.message, cards: [] }
  }

  return { cards: data || [] }
}
