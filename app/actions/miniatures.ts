"use server"

import { createClient } from "@/lib/supabase/server"
import type { MiniatureSearchResult, MiniatureSystem } from "@/app/api/miniatures/search/route"
import type { MiniatureDetails } from "@/app/api/miniatures/details/route"
import type { MiniatureArmyContext } from "@/lib/miniatures/army-resolver"

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

// Add a miniature unit to the collection
export async function addMiniatureToCollection(
  unit: MiniatureSearchResult | MiniatureDetails,
  quantity: number = 1,
  paintStatus: PaintStatus = "unpainted",
  status: "owned" | "wishlist" = "owned",
  isImport: boolean = false,
  army?: MiniatureArmyContext,
) {
  void quantity
  void paintStatus
  void status
  void isImport
  void army

  if (!unit.catalogId) {
    return { success: false, error: "Miniature is not a canonical catalog result" }
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

  // WP-004C establishes catalog identity only. Army selection and the
  // production mini_army_units write belong to the later write-path work.
  return {
    success: false,
    error: `Miniature catalog resolved (${unit.catalogId}); army context is required before adding it`,
  }
}

// Parse BattleScribe .ros (roster) file
export async function parseRosterFile(
  xmlContent: string
): Promise<Array<{ name: string; quantity: number; faction?: string; points?: number }>> {
  const parsed: Array<{ name: string; quantity: number; faction?: string; points?: number }> = []

  try {
    // Simple XML parsing for BattleScribe roster format
    // <selection ... name="Intercessor Squad" ... number="1" ...>
    const selectionRegex =
      /<selection[^>]*\sname="([^"]+)"[^>]*\snumber="(\d+)"[^>]*(?:\scosts="([^"]*)")?[^>]*>/gi
    let match

    while ((match = selectionRegex.exec(xmlContent)) !== null) {
      const name = match[1]
      const quantity = parseInt(match[2], 10) || 1

      // Try to extract points from costs attribute
      let points: number | undefined
      if (match[3]) {
        const ptsMatch = match[3].match(/(\d+)\s*pts/i)
        if (ptsMatch) {
          points = parseInt(ptsMatch[1], 10)
        }
      }

      // Skip non-unit entries (upgrades, wargear, etc.)
      if (!name.includes("Upgrade") && !name.includes("Wargear")) {
        parsed.push({ name, quantity, points })
      }
    }

    // Also try to find force/faction
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
    // Skip comments and section headers
    if (line.startsWith("//") || line.startsWith("#") || line.startsWith("++") || line.endsWith(":"))
      continue

    // Match patterns like:
    // "10x Intercessors"
    // "10 Intercessors (200pts)"
    // "Intercessors x10 [200]"
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
    // mini_army_units has no `status`/`quantity`/`notes` columns in
    // production. Ownership is represented by the `owned` boolean, and the
    // faction/system relationship is reached through mini_units -> mini_factions
    // -> mini_systems (mini_army_units has no direct system/faction column).
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
      // mini_army_units has no created_at/added_at column in production, so
      // there is no timestamp column to order by here.
      .eq("owned", true)

    const { data, error } = await query

    if (error) {
      console.error("Error fetching miniature collection:", error)
      return { success: false, error: error.message, data: [] }
    }

    // Filter by system if specified
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
