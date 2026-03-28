import { NextResponse } from "next/server"

// BattleScribe catalog sources
const CATALOG_SOURCES = {
  wh40k: {
    name: "Warhammer 40,000",
    repo: "BSData/wh40k-10e",
    indexUrl: "https://raw.githubusercontent.com/BSData/wh40k-10e/main/index.json",
  },
  aos: {
    name: "Age of Sigmar",
    repo: "BSData/age-of-sigmar",
    indexUrl: "https://raw.githubusercontent.com/BSData/age-of-sigmar/main/index.json",
  },
}

export type MiniatureSystem = keyof typeof CATALOG_SOURCES

export interface MiniatureSearchResult {
  id: string
  name: string
  system: MiniatureSystem
  systemName: string
  faction?: string
  type: "unit" | "model" | "upgrade"
  points?: number
  models?: number
}

// Simple in-memory cache for catalog data
const catalogCache: Map<MiniatureSystem, { units: MiniatureSearchResult[]; timestamp: number }> = new Map()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

// Parse BattleScribe catalog XML to extract units
async function parseBattleScribeCatalog(system: MiniatureSystem): Promise<MiniatureSearchResult[]> {
  const cached = catalogCache.get(system)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.units
  }

  try {
    // Fetch the index to get catalog file list
    const indexResponse = await fetch(CATALOG_SOURCES[system].indexUrl)
    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch catalog index: ${indexResponse.status}`)
    }
    
    const index = await indexResponse.json()
    const units: MiniatureSearchResult[] = []
    
    // Process each catalog file (faction)
    for (const catalog of index.repositories?.[0]?.repositoryFiles || []) {
      if (catalog.name?.endsWith(".cat") || catalog.name?.endsWith(".catz")) {
        const catalogName = catalog.name.replace(/\.catz?$/, "")
        
        // For now, create placeholder entries from catalog names
        // Full XML parsing would be done in a background job
        units.push({
          id: `${system}-${catalogName}`,
          name: catalogName.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          system,
          systemName: CATALOG_SOURCES[system].name,
          faction: catalogName,
          type: "unit",
        })
      }
    }

    // Cache the results
    catalogCache.set(system, { units, timestamp: Date.now() })
    return units
  } catch (error) {
    console.error(`Error parsing ${system} catalog:`, error)
    return []
  }
}

// Common Warhammer 40K units for demo/fallback
const COMMON_40K_UNITS: MiniatureSearchResult[] = [
  { id: "40k-sm-intercessors", name: "Intercessor Squad", system: "wh40k", systemName: "Warhammer 40,000", faction: "Space Marines", type: "unit", points: 80, models: 5 },
  { id: "40k-sm-terminators", name: "Terminator Squad", system: "wh40k", systemName: "Warhammer 40,000", faction: "Space Marines", type: "unit", points: 185, models: 5 },
  { id: "40k-sm-captain", name: "Captain in Terminator Armour", system: "wh40k", systemName: "Warhammer 40,000", faction: "Space Marines", type: "unit", points: 95, models: 1 },
  { id: "40k-sm-dreadnought", name: "Redemptor Dreadnought", system: "wh40k", systemName: "Warhammer 40,000", faction: "Space Marines", type: "unit", points: 210, models: 1 },
  { id: "40k-sm-assault-intercessors", name: "Assault Intercessor Squad", system: "wh40k", systemName: "Warhammer 40,000", faction: "Space Marines", type: "unit", points: 75, models: 5 },
  { id: "40k-necrons-warriors", name: "Necron Warriors", system: "wh40k", systemName: "Warhammer 40,000", faction: "Necrons", type: "unit", points: 100, models: 10 },
  { id: "40k-necrons-immortals", name: "Immortals", system: "wh40k", systemName: "Warhammer 40,000", faction: "Necrons", type: "unit", points: 75, models: 5 },
  { id: "40k-necrons-overlord", name: "Overlord", system: "wh40k", systemName: "Warhammer 40,000", faction: "Necrons", type: "unit", points: 85, models: 1 },
  { id: "40k-orks-boyz", name: "Boyz", system: "wh40k", systemName: "Warhammer 40,000", faction: "Orks", type: "unit", points: 75, models: 10 },
  { id: "40k-orks-warboss", name: "Warboss", system: "wh40k", systemName: "Warhammer 40,000", faction: "Orks", type: "unit", points: 70, models: 1 },
  { id: "40k-tau-firewarriors", name: "Strike Team", system: "wh40k", systemName: "Warhammer 40,000", faction: "T'au Empire", type: "unit", points: 75, models: 10 },
  { id: "40k-tau-crisis", name: "Crisis Battlesuit Team", system: "wh40k", systemName: "Warhammer 40,000", faction: "T'au Empire", type: "unit", points: 150, models: 3 },
  { id: "40k-tyranids-termagants", name: "Termagants", system: "wh40k", systemName: "Warhammer 40,000", faction: "Tyranids", type: "unit", points: 60, models: 10 },
  { id: "40k-tyranids-hormagaunts", name: "Hormagaunts", system: "wh40k", systemName: "Warhammer 40,000", faction: "Tyranids", type: "unit", points: 65, models: 10 },
  { id: "40k-chaos-marines", name: "Chaos Space Marines", system: "wh40k", systemName: "Warhammer 40,000", faction: "Chaos Space Marines", type: "unit", points: 90, models: 5 },
]

// Common Age of Sigmar units for demo/fallback
const COMMON_AOS_UNITS: MiniatureSearchResult[] = [
  { id: "aos-sce-liberators", name: "Liberators", system: "aos", systemName: "Age of Sigmar", faction: "Stormcast Eternals", type: "unit", points: 110, models: 5 },
  { id: "aos-sce-sequitors", name: "Sequitors", system: "aos", systemName: "Age of Sigmar", faction: "Stormcast Eternals", type: "unit", points: 120, models: 5 },
  { id: "aos-sce-lord-celestant", name: "Lord-Celestant", system: "aos", systemName: "Age of Sigmar", faction: "Stormcast Eternals", type: "unit", points: 150, models: 1 },
  { id: "aos-nighthaunt-chainrasps", name: "Chainrasp Horde", system: "aos", systemName: "Age of Sigmar", faction: "Nighthaunt", type: "unit", points: 110, models: 10 },
  { id: "aos-nighthaunt-spirit-hosts", name: "Spirit Hosts", system: "aos", systemName: "Age of Sigmar", faction: "Nighthaunt", type: "unit", points: 65, models: 3 },
  { id: "aos-ossiarch-mortek", name: "Mortek Guard", system: "aos", systemName: "Age of Sigmar", faction: "Ossiarch Bonereapers", type: "unit", points: 140, models: 10 },
  { id: "aos-skaven-clanrats", name: "Clanrats", system: "aos", systemName: "Age of Sigmar", faction: "Skaven", type: "unit", points: 100, models: 20 },
  { id: "aos-ironjawz-ardboyz", name: "Ardboyz", system: "aos", systemName: "Age of Sigmar", faction: "Ironjawz", type: "unit", points: 170, models: 10 },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || searchParams.get("query") || ""
  const system = (searchParams.get("system") as MiniatureSystem) || "wh40k"

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const searchLower = query.toLowerCase()
    
    // Use common units for faster search
    let allUnits: MiniatureSearchResult[] = []
    
    if (system === "wh40k") {
      allUnits = COMMON_40K_UNITS
    } else if (system === "aos") {
      allUnits = COMMON_AOS_UNITS
    }
    
    // Try to fetch from BattleScribe catalog too
    try {
      const catalogUnits = await parseBattleScribeCatalog(system)
      allUnits = [...allUnits, ...catalogUnits]
    } catch {
      // Fall back to common units only
    }
    
    // Filter by search query
    const results = allUnits
      .filter(
        (unit) =>
          unit.name.toLowerCase().includes(searchLower) ||
          unit.faction?.toLowerCase().includes(searchLower)
      )
      .slice(0, 20)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Miniatures search error:", error)
    return NextResponse.json({ error: "Search failed", results: [] }, { status: 500 })
  }
}
