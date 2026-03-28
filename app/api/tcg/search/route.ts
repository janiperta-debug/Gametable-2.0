import { NextRequest, NextResponse } from "next/server"

export type TCGGame = "mtg" | "pokemon" | "lorcana" | "yugioh" | "fab" | "onepiece"

export interface TCGSearchResult {
  id: string
  name: string
  game: TCGGame
  set: string
  setCode?: string
  rarity?: string
  imageUrl?: string
  thumbnailUrl?: string
  price?: number
  type?: string
  description?: string
}

// APITCG.com - supports MTG, Pokémon, Lorcana, Flesh & Blood, One Piece
async function searchAPITCG(query: string, game: string): Promise<TCGSearchResult[]> {
  // Map our game codes to APITCG game codes
  const gameMap: Record<string, string> = {
    mtg: "magic",
    pokemon: "pokemon",
    lorcana: "lorcana",
    fab: "flesh-and-blood",
    onepiece: "one-piece",
  }

  const apiGame = gameMap[game]
  if (!apiGame) return []

  try {
    const response = await fetch(
      `https://apitcg.com/api/${apiGame}/cards?name=${encodeURIComponent(query)}&limit=20`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      console.error(`APITCG error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const cards = data.data || data.cards || data || []

    return cards.slice(0, 20).map((card: Record<string, unknown>) => ({
      id: String(card.id || card.cardId || `${game}-${card.name}`),
      name: String(card.name || ""),
      game: game as TCGGame,
      set: String(card.set?.name || card.setName || card.set || "Unknown Set"),
      setCode: String(card.set?.code || card.setCode || ""),
      rarity: String(card.rarity || ""),
      imageUrl: String(card.images?.large || card.images?.normal || card.image || card.imageUrl || ""),
      thumbnailUrl: String(card.images?.small || card.images?.thumbnail || card.thumbnail || card.imageUrl || ""),
      price: card.prices?.usd ? parseFloat(String(card.prices.usd)) : undefined,
      type: String(card.type || card.supertype || ""),
      description: String(card.text || card.description || card.abilities?.[0]?.text || ""),
    }))
  } catch (error) {
    console.error("APITCG search error:", error)
    return []
  }
}

// YGOProDeck API for Yu-Gi-Oh!
async function searchYGOProDeck(query: string): Promise<TCGSearchResult[]> {
  try {
    const response = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&num=20&offset=0`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      // YGOProDeck returns 400 for no results
      if (response.status === 400) return []
      console.error(`YGOProDeck error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const cards = data.data || []

    return cards.slice(0, 20).map((card: Record<string, unknown>) => ({
      id: String(card.id),
      name: String(card.name || ""),
      game: "yugioh" as TCGGame,
      set: String((card.card_sets as Array<{ set_name: string }>)?.[0]?.set_name || "Unknown Set"),
      setCode: String((card.card_sets as Array<{ set_code: string }>)?.[0]?.set_code || ""),
      rarity: String((card.card_sets as Array<{ set_rarity: string }>)?.[0]?.set_rarity || ""),
      imageUrl: String((card.card_images as Array<{ image_url: string }>)?.[0]?.image_url || ""),
      thumbnailUrl: String((card.card_images as Array<{ image_url_small: string }>)?.[0]?.image_url_small || ""),
      price: (card.card_prices as Array<{ tcgplayer_price: string }>)?.[0]?.tcgplayer_price
        ? parseFloat(String((card.card_prices as Array<{ tcgplayer_price: string }>)[0].tcgplayer_price))
        : undefined,
      type: String(card.type || ""),
      description: String(card.desc || ""),
    }))
  } catch (error) {
    console.error("YGOProDeck search error:", error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const game = searchParams.get("game") || "mtg"

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 })
  }

  let results: TCGSearchResult[] = []

  if (game === "yugioh") {
    results = await searchYGOProDeck(query)
  } else {
    results = await searchAPITCG(query, game)
  }

  return NextResponse.json({ results })
}
