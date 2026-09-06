import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { mapMiniatureCatalogUnit, type MiniatureSearchResult } from "../catalog"

export type { MiniatureSearchResult } from "../catalog"
export type MiniatureSystem = "wh40k" | "aos" | "xwing" | string

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
