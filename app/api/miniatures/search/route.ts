import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { mapMiniatureCatalogUnit, type MiniatureSearchResult } from "../catalog"

export type { MiniatureSearchResult } from "../catalog"
export type MiniatureSystem = "wh40k" | "aos" | "xwing" | string

// Miniatures is currently a Catalog-authoritative domain. There is no reliable
// general-purpose external search source to merge here, so search stays local
// rather than inventing fallback/demo results.
async function searchCatalog(query: string, systemCode?: string): Promise<MiniatureSearchResult[]> {
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

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Same orchestration contract as the other Catalog-first domains:
    // the route resolves from the local canonical Catalog and returns the
    // normalized domain result. External ingestion is intentionally separate.
    const results = await searchCatalog(query, systemCode)
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Miniatures Catalog search error:", error)
    return NextResponse.json({ results: [] })
  }
}
