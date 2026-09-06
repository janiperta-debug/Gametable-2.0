import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { MiniatureSearchResult } from "../search/route"

export interface MiniatureDetails extends MiniatureSearchResult {
  description?: string
  keywords?: string[]
  abilities?: string[]
  wargear?: string[]
  stats?: {
    movement?: string
    toughness?: number
    save?: string
    wounds?: number
    leadership?: number
    objectiveControl?: number
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const catalogId = searchParams.get("catalogId") || searchParams.get("id")

  if (!catalogId) {
    return NextResponse.json({ error: "Missing catalogId parameter" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: unit, error } = await supabase
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
        system:mini_systems!inner (
          id,
          name,
          code,
          edition
        )
      )
    `)
    .eq("id", catalogId)
    .maybeSingle()

  if (error || !unit) {
    return NextResponse.json({ error: "Miniature catalog detail not found" }, { status: 404 })
  }

  const faction = Array.isArray(unit.faction) ? unit.faction[0] : unit.faction
  const system = Array.isArray(faction?.system) ? faction.system[0] : faction?.system
  if (!faction || !system?.id) {
    return NextResponse.json({ error: "Miniature catalog detail not found" }, { status: 404 })
  }
  const datasheet = unit.datasheet && typeof unit.datasheet === "object" && !Array.isArray(unit.datasheet)
    ? unit.datasheet as Record<string, unknown>
    : {}
  const sourceId = typeof datasheet.wahapedia_id === "string" ? datasheet.wahapedia_id : undefined

  const details: MiniatureDetails = {
    catalogId: unit.id,
    name: unit.name,
    source: sourceId ? "wahapedia" : undefined,
    sourceId,
    systemId: system.id,
    systemCode: system.code || "unknown",
    systemName: system.name,
    edition: system.edition || undefined,
    factionId: faction?.id,
    factionName: faction?.name,
    unitType: unit.unit_type || undefined,
    basePoints: unit.base_points,
    modelCountMin: unit.model_count_min,
    modelCountMax: unit.model_count_max,
  }

  return NextResponse.json(details)
}
