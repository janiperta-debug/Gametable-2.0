import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { upsertTcgSourceCard, type TcgSourceKey } from "@/lib/tcg/upsert-source-card"

export type TCGGame = "magic" | "pokemon" | "lorcana" | "yugioh" | "flesh-and-blood" | "one-piece" | "riftbound" | "digimon" | "gundam" | "star-wars-unlimited" | "dragon-ball-fusion-world"
type DBTCGSystem = "mtg" | "pokemon" | "lorcana" | "yugioh" | "fab" | "onepiece" | "riftbound" | "digimon" | "gundam" | "star-wars-unlimited" | "dragon-ball-fusion-world"

function toDbTCGSystem(game: TCGGame): DBTCGSystem {
  return game === "magic" ? "mtg" : game === "flesh-and-blood" ? "fab" : game === "one-piece" ? "onepiece" : game
}

function fromDbTCGSystem(game: DBTCGSystem): TCGGame {
  return game === "mtg" ? "magic" : game === "fab" ? "flesh-and-blood" : game === "onepiece" ? "one-piece" : game
}

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
  "riftbound": "riftbound",
  "digimon": "digimon",
  "gundam": "gundam",
  "star-wars-unlimited": "star-wars-unlimited",
  "dragon-ball-fusion-world": "dragon-ball-fusion-world",
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
  sourceKey?: TcgSourceKey
}

interface TCGCard {
  id: string
  name: string
  tcg_system: DBTCGSystem
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
  const dbTcgSystem = toDbTCGSystem(tcgSystem)
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("tcg_cards")
      .select("*")
      .eq("tcg_system", dbTcgSystem)
      .ilike("name", `%${query}%`)
      .limit(20)
    
    if (error) {
      console.error("Supabase tcg_cards search error:", error)
      return []
    }
    
    return (data || []).map((card: TCGCard) => ({
      id: card.id,
      name: card.name,
      game: fromDbTCGSystem(card.tcg_system),
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

function mergeSearchResults(catalogResults: TCGSearchResult[], externalResults: TCGSearchResult[]): TCGSearchResult[] {
  const merged = new Map<string, TCGSearchResult>()

  for (const result of catalogResults) {
    const key = result.externalId ? `${result.game}:${result.externalId}` : `${result.game}:catalog:${result.id}`
    merged.set(key, result)
  }

  for (const result of externalResults) {
    const key = result.externalId ? `${result.game}:${result.externalId}` : `${result.game}:external:${result.id}`
    if (!merged.has(key)) {
      merged.set(key, result)
    }
  }

  return Array.from(merged.values()).slice(0, 20)
}

// Save external API results to Supabase
async function saveToSupabase(cards: TCGSearchResult[], tcgSystem: TCGGame): Promise<void> {
  if (cards.length === 0) return
  const defaultSource: Record<TCGGame, TcgSourceKey> = {
    magic: "scryfall",
    pokemon: "pokemontcg",
    yugioh: "ygoprodeck",
    lorcana: "lorcast",
    "flesh-and-blood": "goagain",
    "one-piece": "optcgapi",
    "riftbound": "apitcg",
    "digimon": "apitcg",
    "gundam": "apitcg",
    "star-wars-unlimited": "apitcg",
    "dragon-ball-fusion-world": "apitcg",
  }

  await Promise.all(cards.map(async (card) => {
    try {
      await upsertTcgSourceCard({
        system: toDbTCGSystem(tcgSystem),
        sourceKey: card.sourceKey ?? defaultSource[tcgSystem],
        externalId: card.externalId || card.id,
        name: card.name,
        setCode: card.setCode,
        setName: card.set,
        rarity: card.rarity,
        imageUrl: card.imageUrl,
        manaCost: card.manaCost,
        typeLine: card.type,
        cmc: card.cmc,
        priceUsd: card.price,
      })
    } catch (error) {
      console.error("Error saving TCG source card to Supabase:", error)
    }
  }))
}

// APITCG supplements the existing providers and powers games without a dedicated provider.
const apitcgSlugs: Record<TCGGame, string> = {
  magic: "magic",
  pokemon: "pokemon",
  yugioh: "yugioh",
  lorcana: "lorcana",
  "flesh-and-blood": "flesh-and-blood",
  "one-piece": "one-piece",
  riftbound: "riftbound",
  digimon: "digimon",
  gundam: "gundam",
  "star-wars-unlimited": "star-wars-unlimited",
  "dragon-ball-fusion-world": "dragon-ball-super-fusion-world",
}

interface APITCGSearchOutcome {
  results: TCGSearchResult[]
  status: number | null
  error?: string
  responseKeys?: string[]
  rawCount?: number
}

async function searchAPITCG(query: string, game: TCGGame): Promise<APITCGSearchOutcome> {
  const apiKey = process.env.APITCG_API_KEY
  if (!apiKey) {
    console.warn("APITCG_API_KEY is not configured; skipping APITCG search")
    return { results: [], status: null, error: "APITCG_API_KEY is not configured" }
  }

  try {
    const apiSlug = apitcgSlugs[game]
    const response = await fetch(
      `https://api.apitcg.com/api/products?tcg=${encodeURIComponent(apiSlug)}&type=card&name=${encodeURIComponent(query)}&limit=20`,
      { headers: { Accept: "application/json", "x-api-key": apiKey }, next: { revalidate: 300 } },
    )
    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      console.error(`APITCG search error (${game}/${apiSlug}): ${response.status} ${detail.slice(0, 250)}`)
      return { results: [], status: response.status, error: detail.slice(0, 250) }
    }

    const payload = await response.json()
    const products = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.products) ? payload.products : []
    const results = products.map((product: Record<string, any>) => {
      const set = product.set as Record<string, any> | undefined
      const images = Array.isArray(product.images) ? product.images[0] as Record<string, string> | undefined : undefined
      const attributes = product.attributes as Record<string, string> | undefined
      const market = product.markets?.tcgplayer?.prices?.market
      const imageUrl = images?.medium || images?.large || images?.small || ""
      const id = String(product._id ?? "")
      return {
        id, name: String(product.name || ""), game, sourceKey: "apitcg" as const,
        set: String(set?.name || "Unknown Set"), setCode: String(set?.code || ""),
        rarity: String(attributes?.Rarity || ""), imageUrl,
        thumbnailUrl: images?.small || imageUrl,
        price: typeof market === "number" ? market : undefined,
        type: String(attributes?.["Card Type"] || attributes?.Type || ""),
        externalId: id,
      }
    }).filter((card: TCGSearchResult) => card.id && card.name).slice(0, 20)
    return { results, status: response.status, responseKeys: payload && typeof payload === "object" ? Object.keys(payload) : [], rawCount: products.length }
  } catch (error) {
    console.error("APITCG search failed:", error)
    return { results: [], status: null, error: error instanceof Error ? error.message : "Unknown APITCG error" }
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
        sourceKey: "scryfall",
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
    // Use quotes for exact substring match, then wildcard
    const searchQuery = `name:"*${query}*"`
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchQuery)}&pageSize=20`,
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
        sourceKey: "pokemontcg",
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
        sourceKey: "ygoprodeck",
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

// Lorcast is the primary external Lorcana search source.
// It provides full-text search, stable card IDs, set metadata, rarity and images.
// We keep lorcana-api.com as a fallback so an outage or API change does not
// make Lorcana searching completely unavailable.
async function searchLorcast(query: string): Promise<TCGSearchResult[]> {
  try {
    const response = await fetch(
      `https://api.lorcast.com/v0/cards/search?q=${encodeURIComponent(query)}&unique=prints`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      console.error(`Lorcast API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const cards = Array.isArray(data?.results) ? data.results : []

    return cards
      .map((card: Record<string, unknown>) => {
        const imageUris = card.image_uris as
          | { digital?: { small?: string; normal?: string } }
          | undefined
        const set = card.set as
          | { id?: string; code?: string; name?: string }
          | undefined

        const id = String(card.id || "").trim()
        const baseName = String(card.name || "").trim()
        const version = String(card.version || "").trim()

        if (!id || !baseName) return null

        return {
          id,
          name: version ? `${baseName} - ${version}` : baseName,
          game: "lorcana" as TCGGame,
          sourceKey: "lorcast",
          set: String(set?.name || "Unknown Set"),
          setCode: String(set?.code || set?.id || ""),
          rarity: String(card.rarity || ""),
          imageUrl: imageUris?.digital?.normal || "",
          thumbnailUrl: imageUris?.digital?.small || imageUris?.digital?.normal || "",
          price: (() => {
            const prices = card.prices as { usd?: string | null } | undefined
            const value = prices?.usd ? Number.parseFloat(prices.usd) : Number.NaN
            return Number.isFinite(value) ? value : undefined
          })(),
          externalId: id,
        }
      })
      .filter((card): card is TCGSearchResult => card !== null)
      .slice(0, 20)
  } catch (error) {
    console.error("Lorcast search error:", error)
    return []
  }
}

// Legacy/open Lorcana API fallback.
// Its documented response does not require Culture_Invariant_Id, so use the
// stable set/card number combination when that field is not present.
async function searchLorcanaApi(query: string): Promise<TCGSearchResult[]> {
  try {
    const response = await fetch(
      `https://api.lorcana-api.com/cards/fetch?search=${encodeURIComponent(`name~${query}`)}&pagesize=20`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      console.error(`Lorcana API fallback error: ${response.status}`)
      return []
    }

    const cards = await response.json()

    return (Array.isArray(cards) ? cards : [])
      .map((card: Record<string, unknown>) => {
        const explicitId = card.Culture_Invariant_Id ?? card.id
        const setId = String(card.Set_ID || "").trim()
        const cardNum = String(card.Card_Num || "").trim()
        const fallbackId = setId && cardNum ? `${setId}:${cardNum}` : ""
        const id = String(explicitId || fallbackId).trim()

        if (!id) return null

        return {
          id,
          name: String(card.Name || ""),
          game: "lorcana" as TCGGame,
          sourceKey: "lorcana_api",
          set: String(card.Set_Name || "Unknown Set"),
          setCode: setId || undefined,
          rarity: String(card.Rarity || ""),
          imageUrl: String(card.Image || ""),
          thumbnailUrl: String(card.Image || ""),
          externalId: id,
        }
      })
      .filter((card): card is TCGSearchResult => card !== null)
      .slice(0, 20)
  } catch (error) {
    console.error("Lorcana API fallback search error:", error)
    return []
  }
}

async function searchLorcana(query: string): Promise<TCGSearchResult[]> {
  const lorcastResults = await searchLorcast(query)

  if (lorcastResults.length > 0) {
    return lorcastResults
  }

  console.warn("Lorcast returned no Lorcana results; using lorcana-api.com fallback")
  return searchLorcanaApi(query)
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

  // Catalog remains the preferred source, but supported external sources are always queried
  // so broader matches remain discoverable and the two result sets can be reconciled.
  const catalogResults = await searchSupabase(query, tcgSystem)
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
      // No reliable public API - local Catalog remains the only search source.
      break
    default:
      externalResults = []
  }

  // APITCG supplements the native provider for existing games and serves new games.
  const apitcgOutcome = await searchAPITCG(query, tcgSystem)
  externalResults = [...externalResults, ...apitcgOutcome.results]

  // Save newly discovered external cards for future Catalog-first searches.
  if (externalResults.length > 0) {
    saveToSupabase(externalResults, tcgSystem).catch(err =>
      console.error("Background save failed:", err)
    )
  }

  const results = mergeSearchResults(catalogResults, externalResults)

  if (results.length === 0 && ["flesh-and-blood", "one-piece", "riftbound", "digimon", "gundam", "star-wars-unlimited", "dragon-ball-fusion-world"].includes(tcgSystem)) {
    return NextResponse.json({
      results: [],
      message: "No results found. Try adding cards manually for this game."
    })
  }

  const debug = searchParams.get("debug") === "1"
  const diagnostics = {
    game: tcgSystem,
    apitcg: {
      status: apitcgOutcome.status,
      error: apitcgOutcome.error,
      responseKeys: apitcgOutcome.responseKeys,
      rawCount: apitcgOutcome.rawCount,
      mappedCount: apitcgOutcome.results.length,
    },
  }

  if (results.length === 0 && ["flesh-and-blood", "one-piece", "riftbound", "digimon", "gundam", "star-wars-unlimited", "dragon-ball-fusion-world"].includes(tcgSystem)) {
    return NextResponse.json(debug
      ? { results: [], message: "No results found. Try adding cards manually for this game.", diagnostics }
      : { results: [], message: "No results found. Try adding cards manually for this game." }
    )
  }

  return NextResponse.json(debug ? { results, diagnostics } : { results })
}
