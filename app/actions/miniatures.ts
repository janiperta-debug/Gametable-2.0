"use server"

import { createClient } from "@/lib/supabase/server"
import { awardXP } from "./xp"
import { awardCategoryImportXP } from "@/lib/xp-engine"
import type { MiniatureSearchResult, MiniatureSystem } from "@/app/api/miniatures/search/route"
import type { MiniatureDetails } from "@/app/api/miniatures/details/route"
import type { MiniatureArmyContext } from "@/lib/miniatures/army-resolver"
import { buildMiniatureArmyUnitPayload } from "@/lib/miniatures/ownership"

export type PaintStatus = "unpainted" | "primed" | "in_progress" | "painted" | "based"
export type { MiniatureArmyContext } from "@/lib/miniatures/army-resolver"

export interface MiniatureCollectionEntry {
  id: string
  unitId: string
  name: string
  system: MiniatureSystem
  faction?: string
  quantity: number
  modelCount: number
  pointsValue?: number
  paintStatus: PaintStatus
  notes?: string
  addedAt: string
}

function mapArmyContext(row: any): MiniatureArmyContext {
  const faction = Array.isArray(row.faction) ? row.faction[0] : row.faction
  const system = Array.isArray(faction?.system) ? faction.system[0] : faction?.system
  return {
    id: row.id,
    name: row.name,
    factionId: row.faction_id,
    factionName: faction?.name ?? "",
    systemId: system?.id ?? "",
    systemName: system?.name ?? "",
    edition: system?.edition ?? undefined,
    pointLimit: row.point_limit ?? 2000,
    isCrusade: row.is_crusade ?? false,
  }
}

const armySelect = `
  id,
  name,
  faction_id,
  point_limit,
  is_crusade,
  faction:mini_factions (
    id,
    name,
    system:mini_systems (
      id,
      name,
      edition
    )
  )
`

export async function getUserMiniatureArmies() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated", data: [] as MiniatureArmyContext[] }

  const { data, error } = await supabase
    .from("mini_armies")
    .select(armySelect)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching miniature armies:", error)
    return { success: false, error: error.message, data: [] as MiniatureArmyContext[] }
  }

  return { success: true, data: (data ?? []).map(mapArmyContext) }
}

export async function createMiniatureArmy(name: string, factionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const trimmedName = name.trim()
  if (!trimmedName) return { success: false, error: "Army name is required" }
  if (!factionId) return { success: false, error: "Faction is required" }

  const { data: faction, error: factionError } = await supabase
    .from("mini_factions")
    .select("id")
    .eq("id", factionId)
    .maybeSingle()
  if (factionError) return { success: false, error: factionError.message }
  if (!faction) return { success: false, error: "Faction not found" }

  const { data, error } = await supabase
    .from("mini_armies")
    .insert({ user_id: user.id, name: trimmedName, faction_id: factionId })
    .select(armySelect)
    .single()

  if (error) {
    console.error("Error creating miniature army:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: mapArmyContext(data) }
}

// Add a miniature unit to the collection
export async function addMiniatureToCollection(
  unit: MiniatureSearchResult | MiniatureDetails,
  quantity: number = 1,
  paintStatus: PaintStatus = "unpainted",
  status: "owned" | "wishlist" = "owned",
  isImport: boolean = false,
  army?: MiniatureArmyContext,
) {
  if (!unit.catalogId) {
    return { success: false, error: "Miniature is not a canonical catalog result" }
  }
  if (!army?.id) return { success: false, error: "Army context is required" }
  if (status === "wishlist") return { success: false, error: "Miniature Wishlist is not supported" }
  if (isImport) return { success: false, error: "Miniature import ownership is not supported" }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { success: false, error: "Miniature quantity must be a positive integer" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: canonicalUnit, error: canonicalUnitError } = await supabase
    .from("mini_units")
    .select("id, faction_id, base_points")
    .eq("id", unit.catalogId)
    .maybeSingle()
  if (canonicalUnitError) return { success: false, error: canonicalUnitError.message }
  if (!canonicalUnit) return { success: false, error: "Miniature catalog unit not found" }

  const { data: validatedArmy, error: armyError } = await supabase
    .from("mini_armies")
    .select("id, faction_id")
    .eq("id", army.id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (armyError) return { success: false, error: armyError.message }
  if (!validatedArmy) return { success: false, error: "Army not found" }

  const payload = buildMiniatureArmyUnitPayload({
    catalogId: unit.catalogId,
    army: { id: validatedArmy.id, factionId: validatedArmy.faction_id },
    canonicalUnit,
    userId: user.id,
    modelCount: quantity,
    paintStatus,
  })
  if (!payload.success) return payload

  const { data: insertedUnit, error } = await supabase
    .from("mini_army_units")
    .insert(payload.data)
    .select("id")
    .single()
  if (error || !insertedUnit) {
    console.error("Error adding miniature to collection:", error)
    return { success: false, error: error?.message || "Failed to add miniature to collection" }
  }

  // A single successful Collection ownership row earns +5 XP. The ownership
  // row id is the stable event identity, so retries cannot mint XP twice.
  const xpResult = await awardXP(user.id, "miniature_added", 5, insertedUnit.id)
  if (!xpResult.success) {
    console.error("Miniature ownership was created but XP award failed:", xpResult.error)
  }

  return { success: true }
}

// WP-004G: Miniatures Bulk Import is a Collection mass-add. Each row here
// represents a Miniature the user says they physically own, so every
// inserted mini_army_units row uses owned = true via buildMiniatureArmyUnitPayload
// (the same builder addMiniatureToCollection uses). This does NOT implement a
// roster/army-planning import and does NOT support owned = false.
export interface MiniatureBulkImportLine {
  catalogId: string
  modelCount: number
}

export interface MiniatureBulkImportResult {
  success: boolean
  error?: string
  insertedCount?: number
}

export async function importMiniaturesToCollection(
  lines: MiniatureBulkImportLine[],
  army: Pick<MiniatureArmyContext, "id" | "factionId">,
): Promise<MiniatureBulkImportResult> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { success: false, error: "No Miniatures to import" }
  }
  if (!army?.id) return { success: false, error: "Army context is required" }

  for (const line of lines) {
    if (!line.catalogId) {
      return { success: false, error: "Every imported Miniature requires a canonical catalog match" }
    }
    if (!Number.isInteger(line.modelCount) || line.modelCount < 1) {
      return { success: false, error: "Miniature quantity must be a positive integer" }
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: validatedArmy, error: armyError } = await supabase
    .from("mini_armies")
    .select("id, faction_id")
    .eq("id", army.id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (armyError) return { success: false, error: armyError.message }
  if (!validatedArmy) return { success: false, error: "Army not found" }

  // Resolve every canonical catalog unit in one query. Duplicate catalogIds
  // across lines are expected and are NOT deduplicated - only the lookup is.
  const catalogIds = Array.from(new Set(lines.map((line) => line.catalogId)))
  const { data: canonicalUnits, error: canonicalUnitError } = await supabase
    .from("mini_units")
    .select("id, faction_id, base_points")
    .in("id", catalogIds)
  if (canonicalUnitError) return { success: false, error: canonicalUnitError.message }

  const canonicalById = new Map((canonicalUnits ?? []).map((unit) => [unit.id, unit]))
  if (canonicalById.size !== catalogIds.length) {
    return {
      success: false,
      error: "One or more imported Miniatures could not be resolved to a canonical catalog unit",
    }
  }

  // Validate and build every row before writing anything (partial import safety).
  const payloads: Record<string, string | number | boolean | null>[] = []
  for (const line of lines) {
    const payload = buildMiniatureArmyUnitPayload({
      catalogId: line.catalogId,
      army: { id: validatedArmy.id, factionId: validatedArmy.faction_id },
      canonicalUnit: canonicalById.get(line.catalogId),
      userId: user.id,
      modelCount: line.modelCount,
      paintStatus: "unpainted",
    })
    if (!payload.success) return { success: false, error: payload.error }
    payloads.push(payload.data)
  }

  const { data: insertedUnits, error } = await supabase
    .from("mini_army_units")
    .insert(payloads)
    .select("id")
  if (error) {
    console.error("Error importing miniatures to collection:", error)
    return { success: false, error: error.message }
  }

  if (!insertedUnits?.length) {
    return { success: false, error: "No Miniatures were imported" }
  }

  // Bulk import is one category onboarding reward, never per-item XP.
  // awardCategoryImportXP is itself idempotent on (user_id, category).
  const xpResult = await awardCategoryImportXP(user.id, "miniatures")
  if (!xpResult.applied) {
    console.info("Miniatures category import XP was not applied", {
      userId: user.id,
      insertedCount: insertedUnits.length,
    })
  }

  return { success: true, insertedCount: insertedUnits.length }
}

// Parse BattleScribe .ros (roster) file
export async function parseRosterFile(
  xmlContent: string
): Promise<Array<{ name: string; quantity: number; faction?: string; points?: number }>> {
  const parsed: Array<{ name: string; quantity: number; faction?: string; points?: number }> = []

  try {
    const selectionRegex =
      /<selection[^>]*\sname="([^"]+)"[^>]*\snumber="(\d+)"[^>]*(?:\scosts="([^"]*)")?[^>]*>/gi
    let match

    while ((match = selectionRegex.exec(xmlContent)) !== null) {
      const name = match[1]
      const quantity = parseInt(match[2], 10) || 1
      let points: number | undefined
      if (match[3]) {
        const ptsMatch = match[3].match(/(\d+)\s*pts/i)
        if (ptsMatch) points = parseInt(ptsMatch[1], 10)
      }
      if (!name.includes("Upgrade") && !name.includes("Wargear")) {
        parsed.push({ name, quantity, points })
      }
    }

    const forceMatch = xmlContent.match(/<force[^>]*\scatalogueName="([^"]+)"[^>]*>/i)
    if (forceMatch) {
      const faction = forceMatch[1]
      parsed.forEach((item) => {
        item.faction = faction
      })
    }
  } catch (error) {
    console.error("Error parsing roster file:", error)
  }

  return parsed
}

// Parse plain text army list
export async function parseArmyList(
  text: string
): Promise<Array<{ name: string; quantity: number; points?: number }>> {
  const lines = text.split("\n").filter((line) => line.trim())
  const parsed: Array<{ name: string; quantity: number; points?: number }> = []

  for (const line of lines) {
    if (line.startsWith("//") || line.startsWith("#") || line.startsWith("++") || line.endsWith(":"))
      continue

    const match = line.match(/^(\d+)x?\s+(.+?)(?:\s*[\(\[]?\s*(\d+)\s*(?:pts|points)?[\)\]]?)?$/i)
    const reverseMatch = line.match(/^(.+?)\s*x(\d+)(?:\s*[\(\[]?\s*(\d+)\s*(?:pts|points)?[\)\]]?)?$/i)

    if (match) {
      parsed.push({
        quantity: parseInt(match[1], 10),
        name: match[2].trim(),
        points: match[3] ? parseInt(match[3], 10) : undefined,
      })
    } else if (reverseMatch) {
      parsed.push({
        name: reverseMatch[1].trim(),
        quantity: parseInt(reverseMatch[2], 10),
        points: reverseMatch[3] ? parseInt(reverseMatch[3], 10) : undefined,
      })
    }
  }

  return parsed
}

// Get user's miniature collection
export async function getUserMiniatureCollection(system?: MiniatureSystem) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated", data: [] }
  }

  try {
    const query = supabase
      .from("mini_army_units")
      .select(
        `
        id,
        model_count,
        points_total,
        paint_status,
        custom_name,
        upgrades,
        is_warlord,
        owned,
        unit:mini_units (
          id,
          name,
          unit_type,
          base_points,
          model_count_min,
          model_count_max,
          faction:mini_factions (
            id,
            name,
            system:mini_systems (
              id,
              code,
              name
            )
          )
        )
      `
      )
      .eq("user_id", user.id)
      .eq("owned", true)

    const { data, error } = await query

    if (error) {
      console.error("Error fetching miniature collection:", error)
      return { success: false, error: error.message, data: [] }
    }

    let filtered = data || []
    if (system) {
      filtered = filtered.filter((entry: any) => entry.unit?.faction?.system?.code === system)
    }

    return { success: true, data: filtered }
  } catch (error) {
    console.error("Get miniature collection error:", error)
    return { success: false, error: "Failed to fetch collection", data: [] }
  }
}
