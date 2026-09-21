"use server"

import { createClient } from "@/lib/supabase/server"
import { awardXP } from "./xp"
import type { TCGSearchResult } from "@/app/api/tcg/search/route"

export type TCGGame = "mtg" | "pokemon" | "lorcana" | "yugioh" | "fab" | "onepiece"

type SearchTCGGame = "magic" | "pokemon" | "lorcana" | "yugioh" | "flesh-and-blood" | "one-piece"

type TCGCollectionCard = TCGSearchResult & { game: SearchTCGGame }

function toDbTCGSystem(game: SearchTCGGame): TCGGame {
  if (game === "magic") return "mtg"
  if (game === "flesh-and-blood") return "fab"
  if (game === "one-piece") return "onepiece"
  return game
}

export interface AddCardResult {
  success: boolean
  error?: string
  cardId?: string
  isNew?: boolean
}

export async function addCardToCollection(
  card: TCGCollectionCard,
  quantity: number = 1,
  status: "owned" | "wishlist" = "owned",
  isImport: boolean = false
): Promise<AddCardResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // The search API uses descriptive game codes while tcg_cards stores the
    // canonical database codes (e.g. magic -> mtg).
    const dbTcgSystem = toDbTCGSystem(card.game)

    // Check if card already exists in tcg_cards table
    let cardId: string
    const { data: existingCard } = await supabase
      .from("tcg_cards")
      .select("id")
      .eq("external_id", String(card.id))
      .eq("tcg_system", dbTcgSystem)
      .single()

    if (existingCard) {
      cardId = existingCard.id
    } else {
      // Insert the card into tcg_cards table
      const { data: newCard, error: cardError } = await supabase
        .from("tcg_cards")
        .insert({
          external_id: String(card.id),
          name: card.name,
          tcg_system: dbTcgSystem,
          set_name: card.set,
          set_code: card.setCode || null,
          rarity: card.rarity || null,
          image_url: card.imageUrl || null,
          mana_cost: card.manaCost || null,
          type_line: card.type || null,
          cmc: card.cmc || null,
          price_usd: card.price || null,
          price_updated: card.price ? new Date().toISOString() : null,
        })
        .select("id")
        .single()

      if (cardError) {
        console.error("Error inserting card:", cardError)
        return { success: false, error: cardError.message }
      }
      cardId = newCard.id
    }

    if (status === "wishlist") {
      // tcg_wishlist is the canonical wishlist table and has no quantity
      // concept — it only tracks that the user wants a card, plus an
      // optional target price.
      const { data: existingWishlistEntry } = await supabase
        .from("tcg_wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("card_id", cardId)
        .single()

      if (existingWishlistEntry) {
        return { success: true, cardId, isNew: false }
      }

      const { error: wishlistError } = await supabase
        .from("tcg_wishlist")
        .insert({
          user_id: user.id,
          card_id: cardId,
        })

      if (wishlistError) {
        console.error("Error adding to wishlist:", wishlistError)
        return { success: false, error: wishlistError.message }
      }

      return { success: true, cardId, isNew: true }
    }

    // status === "owned": tcg_collection has no `status` column — every row
    // in this table represents an owned card.
    const { data: existingCollectionEntry } = await supabase
      .from("tcg_collection")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("card_id", cardId)
      .eq("condition", "near_mint")
      .eq("foil", false)
      .maybeSingle()

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
      const { data: collectionEntry, error: collectionError } = await supabase
        .from("tcg_collection")
        .insert({
          user_id: user.id,
          card_id: cardId,
          quantity,
        })
        .select("id")
        .single()

      if (collectionError) {
        console.error("Error adding to collection:", collectionError)
        return { success: false, error: collectionError.message }
      }

      // Award XP for new addition
      if (!isImport) {
        if (collectionEntry?.id) await awardXP(user.id, "tcg_card_added", 5, collectionEntry.id)
      } else {
        const { awardCategoryImportXP } = await import("@/lib/xp-engine")
        await awardCategoryImportXP(user.id, "tcg")
      }

      return { success: true, cardId, isNew: true }
    }
  } catch (error) {
    console.error("Error in addCardToCollection:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export interface RemoveCardResult {
  success: boolean
  error?: string
}

export async function removeCardFromCollection(collectionEntryId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase
    .from("tcg_collection")
    .delete()
    .eq("id", collectionEntryId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error removing TCG card from collection:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateTCGCollectionQuantity(
  collectionEntryId: string,
  delta: number,
  alternateEntryIds: string[] = [],
): Promise<{ success: boolean; error?: string }> {
  if (!Number.isInteger(delta) || delta === 0) {
    return { success: false, error: "Invalid quantity change" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const candidateIds = [collectionEntryId, ...alternateEntryIds.filter((id) => id !== collectionEntryId)]
  let row: { id: string; quantity: number | null } | null = null
  let fetchError: { message: string } | null = null

  for (const candidateId of candidateIds) {
    const result = await supabase
      .from("tcg_collection")
      .select("id, quantity")
      .eq("id", candidateId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (result.error) {
      fetchError = result.error
      break
    }

    if (result.data) {
      row = result.data
      break
    }
  }

  if (fetchError) return { success: false, error: fetchError.message }
  if (!row) return { success: false, error: "Card collection entry not found" }

  const nextQuantity = (row.quantity ?? 1) + delta
  if (nextQuantity <= 0) {
    const { error } = await supabase
      .from("tcg_collection")
      .delete()
      .eq("id", row.id)
      .eq("user_id", user.id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  const { error } = await supabase
    .from("tcg_collection")
    .update({ quantity: nextQuantity })
    .eq("id", row.id)
    .eq("user_id", user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
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
export async function parseDeckList(text: string): Promise<Array<{ name: string; quantity: number; setCode?: string }>> {
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

  // tcg_collection has no `status` column — every row is an owned card.
  let query = supabase
    .from("tcg_collection")
    .select(`
      id,
      quantity,
      condition,
      foil,
      added_at,
      card:tcg_cards (
        id,
        external_id,
        name,
        tcg_system,
        set_name,
        set_code,
        rarity,
        image_url,
        mana_cost,
        type_line,
        card_type,
        cmc,
        price_usd
      )
    `)
    .eq("user_id", user.id)

  if (game) {
    query = query.eq("tcg_cards.tcg_system", game)
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

  // tcg_wishlist is the canonical wishlist model — a separate table from
  // tcg_collection, keyed by card_id with an optional target_price.
  let query = supabase
    .from("tcg_wishlist")
    .select(`
      id,
      target_price,
      added_at,
      card:tcg_cards (
        id,
        external_id,
        name,
        tcg_system,
        set_name,
        set_code,
        rarity,
        image_url,
        mana_cost,
        type_line,
        card_type,
        cmc,
        price_usd
      )
    `)
    .eq("user_id", user.id)

  if (game) {
    query = query.eq("tcg_cards.tcg_system", game)
  }

  const { data, error } = await query.order("added_at", { ascending: false })

  if (error) {
    console.error("Error fetching TCG wishlist:", error)
    return { error: error.message, cards: [] }
  }

  return { cards: data || [] }
}
