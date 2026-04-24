import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export type TCGGame = "magic" | "pokemon" | "lorcana" | "yugioh" | "flesh-and-blood" | "one-piece"

// Map old game codes to new tcg_system values
const gameSystemMap: Record<string, TCGGame> = {
  "mtg": "magic",
  "magic": "magic",
  "pokemon": "pokemon",
  "lorcana": "lorcana",
  "yugioh": "yugioh",
  "fab": "flesh-and-blood",
  "flesh-and-blood": "flesh-and-blood",
  "onepiece": "one-piece",
  "one-piece": "one-piece",
}

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
  manaCost?: string
  cmc?: number
  externalId?: string
}

interface TCGCard {
  id: string
  name: string
  tcg_system: TCGGame
  external_id: string | null
  set_code: string | null
  set_name: string | null
  rarity: string | null
  image_url: string | null
  mana_cost: string | null
  type_line: string | null
  card_type: string | null
  cmc: number | null
  price_usd: number | null
}

// In-memory cache for Lorcana cards (fetched once per server instance)
let lorcanaCache: TCGSearchResult[] | null = null
let lorcanaCacheTime: number = 0
const LORCANA_CACHE_TTL = 60 * 60 * 1000 // 1 hour

// Query Supabase tcg_cards table first
async function searchSupabase(query: string, tcgSystem: TCGGame): Promise<TCGSearchResult[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("tcg_cards")
      .select("*")
      .eq("tcg_system", tcgSystem)
      .ilike("name", `%${query}%`)
      .limit(20)
    
    if (error) {
      console.error("Supabase tcg_cards search error:", error)
      return []
    }
    
    return (data || []).map((card: TCGCard) => ({
      id: card.id,
      name: card.name,
      game: card.tcg_system,
      set: card.set_name || "Unknown Set",
      setCode: card.set_code || undefined,
      rarity: card.rarity || undefined,
      imageUrl: card.image_url || undefined,
      thumbnailUrl: card.image_url || undefined,
      price: card.price_usd || undefined,
      type: card.type_line || card.card_type || undefined,
      manaCost: card.mana_cost || undefined,
      cmc: card.cmc || undefined,
      externalId: card.external_id || undefined,
    }))
  } catch (error) {
    console.error("Supabase search error:", error)
    return []
  }
}

// Save external API results to Supabase
async function saveToSupabase(cards: TCGSearchResult[], tcgSystem: TCGGame): Promise<void> {
  if (cards.length === 0) return
  
  try {
    const supabase = await createClient()
    
    for (const card of cards) {
      // Check if card already exists by external_id
      const { data: existing } = await supabase
        .from("tcg_cards")
        .select("id")
        .eq("tcg_system", tcgSystem)
        .eq("external_id", card.externalId || card.id)
        .single()
      
      if (!existing) {
        await supabase.from("tcg_cards").insert({
          name: card.name,
          tcg_system: tcgSystem,
          external_id: card.externalId || card.id,
          set_code: card.setCode || null,
          set_name: card.set || null,
          rarity: card.rarity || null,
          image_url: card.imageUrl || null,
          mana_cost: card.manaCost || null,
          type_line: card.type || null,
          cmc: card.cmc || null,
          price_usd: card.price || null,
          price_updated: card.price ? new Date().toISOString() : null,
        })
      }
    }
  } catch (error) {
    console.error("Error saving cards to Supabase:", error)
  }
}

// Scryfall API for Magic: The Gathering
async function searchScryfall(query: string): Promise<TCGSearchResult[]> {
  try {
    // Add 100ms delay for rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&limit=20`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "GameTable/1.0",
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) return []
      console.error(`Scryfall error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const cards = data.data || []

    return cards.slice(0, 20).map((card: Record<string, unknown>) => {
      // Handle double-faced cards that don't have image_uris at top level
      const imageUris = card.image_uris as Record<string, string> | undefined
      const cardFaces = card.card_faces as Array<{ image_uris?: Record<string, string> }> | undefined
      const imageUrl = imageUris?.small || cardFaces?.[0]?.image_uris?.small || ""
      
      const prices = card.prices as Record<string, string> | undefined
      
      return {
        id: String(card.id),
        name: String(card.name || ""),
        game: "magic" as TCGGame,
        set: String(card.set_name || "Unknown Set"),
        setCode: String(card.set || ""),
        rarity: String(card.rarity || ""),
        imageUrl: imageUrl,
        thumbnailUrl: imageUrl,
        price: prices?.usd ? parseFloat(prices.usd) : undefined,
        type: String(card.type_line || ""),
        manaCost: String(card.mana_cost || ""),
        cmc: typeof card.cmc === "number" ? card.cmc : undefined,
        externalId: String(card.id),
      }
    })
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

    return cards.slice(0, 20).map((card: Record<string, unknown>) => {
      const set = card.set as Record<string, string> | undefined
      const images = card.images as Record<string, string> | undefined
      
      return {
        id: String(card.id),
        name: String(card.name || ""),
        game: "pokemon" as TCGGame,
        set: String(set?.name || "Unknown Set"),
        setCode: String(set?.id || ""),
        rarity: String(card.rarity || ""),
        imageUrl: String(images?.small || ""),
        thumbnailUrl: String(images?.small || ""),
        externalId: String(card.id),
      }
    })
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
      if (response.status === 400) return []
      console.error(`YGOProDeck error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const cards = data.data || []

    return cards.slice(0, 20).map((card: Record<string, unknown>) => {
      const cardImages = card.card_images as Array<{ image_url: string; image_url_small: string }> | undefined
      
      return {
        id: String(card.id),
        name: String(card.name || ""),
        game: "yugioh" as TCGGame,
        set: "Yu-Gi-Oh!",
        rarity: undefined,
        imageUrl: String(cardImages?.[0]?.image_url || ""),
        thumbnailUrl: String(cardImages?.[0]?.image_url_small || ""),
        type: String(card.type || ""),
        externalId: String(card.id),
      }
    })
  } catch (error) {
    console.error("YGOProDeck search error:", error)
    return []
  }
}

// Lorcana API - fetch all and filter locally
async function searchLorcana(query: string): Promise<TCGSearchResult[]> {
  try {
    const now = Date.now()
    
    // Use cache if still valid
    if (lorcanaCache && now - lorcanaCacheTime < LORCANA_CACHE_TTL) {
      const queryLower = query.toLowerCase()
      return lorcanaCache.filter(card => 
        card.name.toLowerCase().includes(queryLower)
      ).slice(0, 20)
    }
    
    // Fetch all cards
    const response = await fetch("https://api.lorcana-api.com/cards/all", {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Lorcana API error: ${response.status}`)
      return []
    }

    const cards = await response.json()
    
    // Cache all cards
    lorcanaCache = (Array.isArray(cards) ? cards : []).map((card: Record<string, unknown>) => ({
      id: String(card.Culture_Invariant_Id || card.id || ""),
      name: String(card.Name || ""),
      game: "lorcana" as TCGGame,
      set: String(card.Set_Name || "Unknown Set"),
      rarity: String(card.Rarity || ""),
      imageUrl: String(card.Image || ""),
      thumbnailUrl: String(card.Image || ""),
      externalId: String(card.Culture_Invariant_Id || ""),
    }))
    lorcanaCacheTime = now
    
    // Filter and return
    const queryLower = query.toLowerCase()
    return lorcanaCache.filter(card => 
      card.name.toLowerCase().includes(queryLower)
    ).slice(0, 20)
  } catch (error) {
    console.error("Lorcana search error:", error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const gameParam = searchParams.get("game") || "magic"
  
  // Map game param to tcg_system value
  const tcgSystem = gameSystemMap[gameParam] || "magic"

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 })
  }

  // Step 1: Query Supabase first
  let results = await searchSupabase(query, tcgSystem)
  
  // Step 2: If no Supabase results, call external API
  if (results.length === 0) {
    let externalResults: TCGSearchResult[] = []
    
    switch (tcgSystem) {
      case "magic":
        externalResults = await searchScryfall(query)
        break
      case "pokemon":
        externalResults = await searchPokemonTCG(query)
        break
      case "yugioh":
        externalResults = await searchYGOProDeck(query)
        break
      case "lorcana":
        externalResults = await searchLorcana(query)
        break
      case "flesh-and-blood":
      case "one-piece":
        // No reliable public API - return empty with message
        return NextResponse.json({ 
          results: [],
          message: "No results found. Try adding cards manually for this game."
        })
      default:
        externalResults = []
    }
    
    // Step 3: Save external results to Supabase for future searches
    if (externalResults.length > 0) {
      // Don't await - save in background
      saveToSupabase(externalResults, tcgSystem).catch(err => 
        console.error("Background save failed:", err)
      )
      results = externalResults
    }
  }

  return NextResponse.json({ results })
}
