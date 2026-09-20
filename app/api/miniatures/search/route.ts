import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { mapMiniatureCatalogUnit, type MiniatureSearchResult } from "../catalog"

export type { MiniatureSearchResult } from "../catalog"
export type MiniatureSystem = "wh40k" | "aos" | "xwing" | string

// Resolve the requested system to faction IDs first, then filter mini_units
// by faction_id. This avoids ambiguous nested relationship filters when
// legacy system rows share the same code.
async function searchCatalog(
  query: string,
  systemCode?: string,
  systemId?: string,
  factionId?: string,
): Promise<MiniatureSearchResult[]> {
  const supabase = await createClient()
  let resolvedFactionIds: string[] | null = null

  if (factionId) {
    resolvedFactionIds = [factionId]
  } else if (systemId || systemCode) {
    let systemsQuery = supabase.from("mini_systems").select("id")

    if (systemId) {
      systemsQuery = systemsQuery.eq("id", systemId)
    } else {
      systemsQuery = systemsQuery.eq("code", systemCode)
    }

    const { data: systems, error: systemsError } = await systemsQuery
    if (systemsError) {
      console.error("Miniature system resolution error:", systemsError)
      return []
    }

    const systemIds = (systems ?? []).map((system) => system.id)
    if (systemIds.length === 0) return []

    const { data: factions, error: factionsError } = await supabase
      .from("mini_factions")
      .select("id")
      .in("system_id", systemIds)

    if (factionsError) {
      console.error("Miniature faction resolution error:", factionsError)
      return []
    }

    resolvedFactionIds = (factions ?? []).map((faction) => faction.id)
    if (resolvedFactionIds.length === 0) return []
  }

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
    .order("name")
    .limit(20)

  if (resolvedFactionIds) {
    dbQuery = dbQuery.in("faction_id", resolvedFactionIds)
  }

  const { data, error } = await dbQuery
  if (error) {
    console.error("Miniature Catalog search error:", error)
    return []
  }

  return (data || []).flatMap((unit: any) => {
    const result = mapMiniatureCatalogUnit(unit)
    return result ? [result] : []
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawQuery = searchParams.get("q") || searchParams.get("query") || ""
  const query = rawQuery.trim()
  const rawSystemCode = searchParams.get("system") || ""
  const systemCode = rawSystemCode.trim() || undefined
  const rawSystemId = searchParams.get("systemId") || ""
  const systemId = rawSystemId.trim() || undefined
  const rawFactionId = searchParams.get("factionId") || ""
  const factionId = rawFactionId.trim() || undefined

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchCatalog(query, systemCode, systemId, factionId)
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Miniatures Catalog search error:", error)
    return NextResponse.json({ results: [] })
  }
}