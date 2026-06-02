import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// External data sources for fallback
const EXTERNAL_SOURCES = {
  wh40k: {
    name: "Warhammer 40,000",
    url: "https://raw.githubusercontent.com/BSData/wh40k-10e/main/Warhammer%2040%2C000.gst",
  },
  xwing: {
    name: "X-Wing",
    url: "https://raw.githubusercontent.com/guidokessels/xwing-data2/master/data/pilots.json",
  },
}

export type MiniatureSystem = "wh40k" | "aos" | "xwing" | string

export interface MiniatureSearchResult {
  id: string
  name: string
  system: string
  systemName: string
  faction?: string
  type: "unit" | "model" | "upgrade"
  points?: number
  models?: number
}

// Query Supabase for miniatures
async function searchSupabase(query: string, system?: string): Promise<MiniatureSearchResult[]> {
  try {
    const supabase = await createClient()
    
    let dbQuery = supabase
      .from("mini_units")
      .select(`
        id,
        name,
        type,
        points,
        models,
        mini_factions!inner (
          id,
          name,
          mini_systems!inner (
            id,
            name,
            code
          )
        )
      `)
      .ilike("name", `%${query}%`)
      .limit(20)
    
    // Filter by system if provided
    if (system) {
      dbQuery = dbQuery.eq("mini_factions.mini_systems.code", system)
    }
    
    const { data, error } = await dbQuery
    
    if (error) {
      console.error("Supabase miniatures query error:", error)
      return []
    }
    
    // Transform to MiniatureSearchResult format
    return (data || []).map((unit: any) => ({
      id: unit.id,
      name: unit.name,
      system: unit.mini_factions?.mini_systems?.code || "unknown",
      systemName: unit.mini_factions?.mini_systems?.name || "Unknown System",
      faction: unit.mini_factions?.name,
      type: unit.type || "unit",
      points: unit.points,
      models: unit.models,
    }))
  } catch (error) {
    console.error("Supabase search error:", error)
    return []
  }
}

// Fetch and parse X-Wing pilots from external API
async function fetchXWingPilots(query: string): Promise<MiniatureSearchResult[]> {
  try {
    const response = await fetch(EXTERNAL_SOURCES.xwing.url, {
      next: { revalidate: 86400 } // Cache for 24 hours
    })
    
    if (!response.ok) {
      console.error(`X-Wing API returned ${response.status}`)
      return []
    }
    
    const pilots = await response.json()
    const searchLower = query.toLowerCase()
    
    // Filter pilots by search query
    const results: MiniatureSearchResult[] = []
    for (const pilot of pilots) {
      if (
        pilot.name?.toLowerCase().includes(searchLower) ||
        pilot.ship?.toLowerCase().includes(searchLower)
      ) {
        results.push({
          id: `xwing-${pilot.xws || pilot.name}`,
          name: pilot.name,
          system: "xwing",
          systemName: "X-Wing",
          faction: pilot.faction,
          type: "unit",
          points: pilot.cost,
          models: 1,
        })
      }
      if (results.length >= 20) break
    }
    
    return results
  } catch (error) {
    console.error("X-Wing fetch error:", error)
    return []
  }
}

// Save external results to Supabase for future searches
async function saveToSupabase(results: MiniatureSearchResult[]): Promise<void> {
  if (results.length === 0) return
  
  try {
    const supabase = await createClient()
    
    for (const result of results) {
      // First ensure the system exists
      const { data: systemData } = await supabase
        .from("mini_systems")
        .select("id")
        .eq("code", result.system)
        .single()
      
      if (!systemData) {
        // Create system if it doesn't exist
        const { data: newSystem } = await supabase
          .from("mini_systems")
          .insert({ code: result.system, name: result.systemName })
          .select("id")
          .single()
        
        if (!newSystem) continue
      }
      
      const systemId = systemData?.id
      
      // Ensure faction exists
      if (result.faction && systemId) {
        const { data: factionData } = await supabase
          .from("mini_factions")
          .select("id")
          .eq("name", result.faction)
          .eq("system_id", systemId)
          .single()
        
        let factionId = factionData?.id
        
        if (!factionId) {
          const { data: newFaction } = await supabase
            .from("mini_factions")
            .insert({ name: result.faction, system_id: systemId })
            .select("id")
            .single()
          
          factionId = newFaction?.id
        }
        
        // Insert unit if it doesn't exist
        if (factionId) {
          await supabase
            .from("mini_units")
            .upsert({
              id: result.id,
              name: result.name,
              faction_id: factionId,
              type: result.type,
              points: result.points,
              models: result.models,
            }, { onConflict: "id" })
        }
      }
    }
  } catch (error) {
    // Don't fail the request if saving fails
    console.error("Error saving to Supabase:", error)
  }
}

// Common fallback units when external APIs fail
const FALLBACK_UNITS: MiniatureSearchResult[] = [
  { id: "40k-sm-intercessors", name: "Intercessor Squad", system: "wh40k", systemName: "Warhammer 40,000", faction: "Space Marines", type: "unit", points: 80, models: 5 },
  { id: "40k-sm-terminators", name: "Terminator Squad", system: "wh40k", systemName: "Warhammer 40,000", faction: "Space Marines", type: "unit", points: 185, models: 5 },
  { id: "40k-sm-captain", name: "Captain in Terminator Armour", system: "wh40k", systemName: "Warhammer 40,000", faction: "Space Marines", type: "unit", points: 95, models: 1 },
  { id: "40k-necrons-warriors", name: "Necron Warriors", system: "wh40k", systemName: "Warhammer 40,000", faction: "Necrons", type: "unit", points: 100, models: 10 },
  { id: "40k-orks-boyz", name: "Boyz", system: "wh40k", systemName: "Warhammer 40,000", faction: "Orks", type: "unit", points: 75, models: 10 },
  { id: "40k-tau-firewarriors", name: "Strike Team", system: "wh40k", systemName: "Warhammer 40,000", faction: "T'au Empire", type: "unit", points: 75, models: 10 },
  { id: "40k-tyranids-termagants", name: "Termagants", system: "wh40k", systemName: "Warhammer 40,000", faction: "Tyranids", type: "unit", points: 60, models: 10 },
  { id: "aos-sce-liberators", name: "Liberators", system: "aos", systemName: "Age of Sigmar", faction: "Stormcast Eternals", type: "unit", points: 110, models: 5 },
  { id: "aos-nighthaunt-chainrasps", name: "Chainrasp Horde", system: "aos", systemName: "Age of Sigmar", faction: "Nighthaunt", type: "unit", points: 110, models: 10 },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || searchParams.get("query") || ""
  const system = searchParams.get("system") || undefined

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const searchLower = query.toLowerCase()
    
    // Step 1: Query Supabase first
    let results = await searchSupabase(query, system)
    
    // Step 2: If no Supabase results, try external APIs
    if (results.length === 0) {
      // Try X-Wing API if system matches or no system specified
      if (!system || system === "xwing") {
        const xwingResults = await fetchXWingPilots(query)
        if (xwingResults.length > 0) {
          results = xwingResults
          // Save to Supabase for future searches (async, don't wait)
          saveToSupabase(xwingResults).catch(() => {})
        }
      }
    }
    
    // Step 3: If still no results, use fallback units
    if (results.length === 0) {
      results = FALLBACK_UNITS
        .filter(
          (unit) =>
            (!system || unit.system === system) &&
            (unit.name.toLowerCase().includes(searchLower) ||
             unit.faction?.toLowerCase().includes(searchLower))
        )
        .slice(0, 20)
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Miniatures search error:", error)
    
    // Return fallback results instead of crashing
    const searchLower = query.toLowerCase()
    const fallbackResults = FALLBACK_UNITS
      .filter(
        (unit) =>
          (!system || unit.system === system) &&
          (unit.name.toLowerCase().includes(searchLower) ||
           unit.faction?.toLowerCase().includes(searchLower))
      )
      .slice(0, 20)
    
    return NextResponse.json({ results: fallbackResults })
  }
}
