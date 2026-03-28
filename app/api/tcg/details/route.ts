import { NextRequest, NextResponse } from "next/server"
import type { TCGGame, TCGSearchResult } from "../search/route"

export interface TCGCardDetails extends TCGSearchResult {
  artist?: string
  flavorText?: string
  legalities?: Record<string, string>
  relatedCards?: string[]
}

// Get detailed card info from APITCG
async function getAPITCGDetails(cardId: string, game: string): Promise<TCGCardDetails | null> {
  const gameMap: Record<string, string> = {
    mtg: "magic",
    pokemon: "pokemon",
    lorcana: "lorcana",
    fab: "flesh-and-blood",
    onepiece: "one-piece",
  }

  const apiGame = gameMap[game]
  if (!apiGame) return null

  try {
    const response = await fetch(
      `https://apitcg.com/api/${apiGame}/cards/${cardId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      console.error(`APITCG details error: ${response.status}`)
      return null
    }

    const card = await response.json()
    
    return {
      id: String(card.id || cardId),
      name: String(card.name || ""),
      game: game as TCGGame,
      set: String(card.set?.name || card.setName || "Unknown Set"),
      setCode: String(card.set?.code || card.setCode || ""),
      rarity: String(card.rarity || ""),
      imageUrl: String(card.images?.large || card.images?.normal || card.image || ""),
      thumbnailUrl: String(card.images?.small || card.thumbnail || ""),
      price: card.prices?.usd ? parseFloat(String(card.prices.usd)) : undefined,
      type: String(card.type || card.supertype || ""),
      description: String(card.text || card.description || ""),
      artist: String(card.artist || ""),
      flavorText: String(card.flavorText || ""),
    }
  } catch (error) {
    console.error("APITCG details error:", error)
    return null
  }
}

// Get detailed card info from YGOProDeck
async function getYGOProDeckDetails(cardId: string): Promise<TCGCardDetails | null> {
  try {
    const response = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      console.error(`YGOProDeck details error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const card = data.data?.[0]

    if (!card) return null

    return {
      id: String(card.id),
      name: String(card.name || ""),
      game: "yugioh",
      set: String(card.card_sets?.[0]?.set_name || "Unknown Set"),
      setCode: String(card.card_sets?.[0]?.set_code || ""),
      rarity: String(card.card_sets?.[0]?.set_rarity || ""),
      imageUrl: String(card.card_images?.[0]?.image_url || ""),
      thumbnailUrl: String(card.card_images?.[0]?.image_url_small || ""),
      price: card.card_prices?.[0]?.tcgplayer_price
        ? parseFloat(String(card.card_prices[0].tcgplayer_price))
        : undefined,
      type: String(card.type || ""),
      description: String(card.desc || ""),
      artist: undefined, // YGO doesn't have artist info in the API
      flavorText: undefined,
    }
  } catch (error) {
    console.error("YGOProDeck details error:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const cardId = searchParams.get("id")
  const game = searchParams.get("game") || "mtg"

  if (!cardId) {
    return NextResponse.json({ error: "Card ID is required" }, { status: 400 })
  }

  let details: TCGCardDetails | null = null

  if (game === "yugioh") {
    details = await getYGOProDeckDetails(cardId)
  } else {
    details = await getAPITCGDetails(cardId, game)
  }

  if (!details) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 })
  }

  return NextResponse.json(details)
}
