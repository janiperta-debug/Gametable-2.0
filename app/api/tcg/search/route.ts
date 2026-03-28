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

// Scryfall API for Magic: The Gathering (more reliable)
async function searchScryfall(query: string): Promise<TCGSearchResult[]> {
  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "GameTable/1.0",
        },
      }
    )

    if (!response.ok) {
      // Scryfall returns 404 for no results
      if (response.status === 404) return []
      console.error(`Scryfall error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const cards = data.data || []

    return cards.slice(0, 20).map((card: Record<string, unknown>) => ({
      id: String(card.id),
      name: String(card.name || ""),
      game: "mtg" as TCGGame,
      set: String(card.set_name || "Unknown Set"),
      setCode: String(card.set || ""),
      rarity: String(card.rarity || ""),
      imageUrl: String((card.image_uris as Record<string, string>)?.normal || (card.image_uris as Record<string, string>)?.large || ""),
      thumbnailUrl: String((card.image_uris as Record<string, string>)?.small || ""),
      price: card.prices && (card.prices as Record<string, string>).usd ? parseFloat((card.prices as Record<string, string>).usd) : undefined,
      type: String(card.type_line || ""),
      description: String(card.oracle_text || ""),
    }))
  } catch (error) {
    console.error("Scryfall search error:", error)
    return []
  }
}

// Pokemon TCG API
async function searchPokemonTCG(query: string): Promise<TCGSearchResult[]> {
  try {
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(query)}*&pageSize=20`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      console.error(`Pokemon TCG error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const cards = data.data || []

    return cards.slice(0, 20).map((card: Record<string, unknown>) => ({
      id: String(card.id),
      name: String(card.name || ""),
      game: "pokemon" as TCGGame,
      set: String((card.set as Record<string, string>)?.name || "Unknown Set"),
      setCode: String((card.set as Record<string, string>)?.id || ""),
      rarity: String(card.rarity || ""),
      imageUrl: String((card.images as Record<string, string>)?.large || ""),
      thumbnailUrl: String((card.images as Record<string, string>)?.small || ""),
      price: (card.tcgplayer as Record<string, Record<string, Record<string, number>>>)?.prices?.normal?.market || undefined,
      type: String((card.types as string[])?.[0] || card.supertype || ""),
      description: String((card.abilities as Array<Record<string, string>>)?.[0]?.text || ""),
    }))
  } catch (error) {
    console.error("Pokemon TCG search error:", error)
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

  switch (game) {
    case "yugioh":
      results = await searchYGOProDeck(query)
      break
    case "mtg":
      results = await searchScryfall(query)
      break
    case "pokemon":
      results = await searchPokemonTCG(query)
      break
    default:
      // For other games, return empty for now with a note
      console.log(`TCG game ${game} not yet implemented`)
      results = []
  }

  return NextResponse.json({ results })
}
