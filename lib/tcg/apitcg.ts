import "server-only"

export type ApitcgGame =
  | "magic" | "pokemon" | "yugioh" | "lorcana" | "flesh-and-blood"
  | "one-piece" | "riftbound" | "digimon" | "gundam"
  | "star-wars-unlimited" | "dragon-ball-fusion-world"

export interface ApitcgCard {
  id: string
  name: string
  game: ApitcgGame
  sourceKey: "apitcg"
  set: string
  setCode?: string
  rarity?: string
  imageUrl?: string
  thumbnailUrl?: string
  price?: number
  type?: string
  externalId: string
}

export interface ApitcgSearchOutcome {
  results: ApitcgCard[]
  status: number | null
  error?: string
  responseKeys?: string[]
  rawCount?: number
}

const apitcgSlugs: Record<ApitcgGame, string> = {
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

export async function searchApitcgProducts(query: string, game: ApitcgGame): Promise<ApitcgSearchOutcome> {
  const apiKey = process.env.APITCG_API_KEY
  if (!apiKey) {
    console.warn("APITCG_API_KEY is not configured; skipping APITCG search")
    return { results: [], status: null, error: "APITCG_API_KEY is not configured" }
  }

  try {
    const apiSlug = apitcgSlugs[game]
    const response = await fetch(
      `https://api.apitcg.com/api/products?tcg=${encodeURIComponent(apiSlug)}&type=card&name=${encodeURIComponent(query)}&limit=20`,
      { headers: { Accept: "application/json", "x-api-key": apiKey }, cache: "no-store" },
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
        set: String(set?.name || "Unknown Set"), setCode: String(set?.code || "") || undefined,
        rarity: String(attributes?.Rarity || "") || undefined, imageUrl: imageUrl || undefined,
        thumbnailUrl: images?.small || imageUrl || undefined,
        price: typeof market === "number" ? market : undefined,
        type: String(attributes?.["Card Type"] || attributes?.Type || "") || undefined,
        externalId: id,
      }
    }).filter((card: ApitcgCard) => card.id && card.name).slice(0, 20)
    return { results, status: response.status, responseKeys: payload && typeof payload === "object" ? Object.keys(payload) : [], rawCount: products.length }
  } catch (error) {
    console.error("APITCG search failed:", error)
    return { results: [], status: null, error: error instanceof Error ? error.message : "Unknown APITCG error" }
  }
}
