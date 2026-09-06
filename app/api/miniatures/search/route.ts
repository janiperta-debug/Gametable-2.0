import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export type MiniatureSystem = "wh40k" | "aos" | "xwing" | string

export interface MiniatureSearchResult {
  catalogId: string
  name: string
  source?: "wahapedia" | string
  sourceId?: string
  systemId: string
  systemCode: string
  systemName: string
  edition?: string
  factionId?: string
  factionName?: string
  unitType?: string
  basePoints?: number
  modelCountMin?: number
  modelCountMax?: number
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function mapMiniatureCatalogUnit(unit: Record<string, any>): MiniatureSearchResult | null {
  const faction = Array.isArray(unit.faction) ? unit.faction[0] : unit.faction
  const system = Array.isArray(faction?.system) ? faction.system[0] : faction?.system
  if (!system?.id) return null

  const datasheet = asObject(unit.datasheet)
  const sourceId = typeof datasheet.wahapedia_id === "string" ? datasheet.wahapedia_id : undefined

  return {
    catalogId: unit.id,
    name: unit.name,
    source: sourceId ? "wahapedia" : undefined,
    sourceId,
    systemId: system.id,
    systemCode: system.code || "unknown",
    systemName: system.name || "Unknown System",
    edition: system.edition || undefined,
    factionId: faction?.id,
    factionName: faction?.name,
    unitType: unit.unit_type || undefined,
    basePoints: unit.base_points,
    modelCountMin: unit.model_count_min,
    modelCountMax: unit.model_count_max,
  }
}

async function searchSupabase(query: string, systemCode?: string): Promise<MiniatureSearchResult[]> {
  const supabase = await createClient()
  let dbQuery = supabase
    .from("mini_units")
    .select(`
      id,
      name,
      unit_type,
      base_points,
      model_count_min,
      model_count_max,
      datasheet,
      faction:mini_factions!inner (
        id,
        name,
        subfaction,
        system:mini_systems!inner (
          id,
          name,
          code,
          edition
        )
      )
    `)
    .ilike("name", `%${query}%`)
    .limit(20)

  if (systemCode) {
    dbQuery = dbQuery.eq("faction.system.code", systemCode)
  }

  const { data, error } = await dbQuery
  if (error) {
    console.error("Supabase miniatures query error:", error)
    return []
  }

  return (data || []).flatMap((unit: any) => {
    const result = mapMiniatureCatalogUnit(unit)
    return result ? [result] : []
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || searchParams.get("query") || ""
  const systemCode = searchParams.get("system") || undefined

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    return NextResponse.json({ results: await searchSupabase(query, systemCode) })
  } catch (error) {
    console.error("Miniatures search error:", error)
    return NextResponse.json({ results: [] })
  }
}
