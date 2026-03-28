"use server"

import { createClient } from "@/lib/supabase/server"
import { awardXP } from "./xp"
import type { MiniatureSearchResult, MiniatureSystem } from "@/app/api/miniatures/search/route"
import type { MiniatureDetails } from "@/app/api/miniatures/details/route"

export type PaintStatus = "unpainted" | "primed" | "in_progress" | "painted" | "based"

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
  status: "owned" | "wishlist" = "owned"
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // First, ensure the unit exists in mini_units table
    const { data: existingUnit } = await supabase
      .from("mini_units")
      .select("id")
      .eq("external_id", unit.id)
      .single()

    let unitDbId: string

    if (existingUnit) {
      unitDbId = existingUnit.id
    } else {
      // Get or create system
      let systemId: string
      const { data: existingSystem } = await supabase
        .from("mini_systems")
        .select("id")
        .eq("code", unit.system)
        .single()

      if (existingSystem) {
        systemId = existingSystem.id
      } else {
        const { data: newSystem, error: systemError } = await supabase
          .from("mini_systems")
          .insert({
            code: unit.system,
            name: unit.systemName,
          })
          .select("id")
          .single()

        if (systemError) {
          console.error("Error creating system:", systemError)
          return { success: false, error: systemError.message }
        }
        systemId = newSystem.id
      }

      // Get or create faction
      let factionId: string | null = null
      if (unit.faction) {
        const { data: existingFaction } = await supabase
          .from("mini_factions")
          .select("id")
          .eq("name", unit.faction)
          .eq("system_id", systemId)
          .single()

        if (existingFaction) {
          factionId = existingFaction.id
        } else {
          const { data: newFaction, error: factionError } = await supabase
            .from("mini_factions")
            .insert({
              system_id: systemId,
              name: unit.faction,
            })
            .select("id")
            .single()

          if (factionError) {
            console.error("Error creating faction:", factionError)
            // Continue without faction
          } else {
            factionId = newFaction.id
          }
        }
      }

      // Create the unit
      const { data: newUnit, error: unitError } = await supabase
        .from("mini_units")
        .insert({
          external_id: unit.id,
          system_id: systemId,
          faction_id: factionId,
          name: unit.name,
          type: unit.type || "unit",
          points: unit.points,
          model_count: unit.models || 1,
        })
        .select("id")
        .single()

      if (unitError) {
        console.error("Error creating unit:", unitError)
        return { success: false, error: unitError.message }
      }
      unitDbId = newUnit.id
    }

    // Check if user already has this unit
    const { data: existingEntry } = await supabase
      .from("mini_army_units")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("unit_id", unitDbId)
      .eq("paint_status", paintStatus)
      .single()

    if (existingEntry) {
      // Update quantity
      const { error: updateError } = await supabase
        .from("mini_army_units")
        .update({ quantity: existingEntry.quantity + quantity })
        .eq("id", existingEntry.id)

      if (updateError) {
        console.error("Error updating quantity:", updateError)
        return { success: false, error: updateError.message }
      }
    } else {
      // Insert new entry
      const { error: insertError } = await supabase.from("mini_army_units").insert({
        user_id: user.id,
        unit_id: unitDbId,
        quantity,
        paint_status: paintStatus,
        status,
      })

      if (insertError) {
        console.error("Error adding miniature:", insertError)
        return { success: false, error: insertError.message }
      }

      // Award XP for adding to collection
      if (status === "owned") {
        await awardXP(user.id, 10, "Added miniature to collection")
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Add miniature error:", error)
    return { success: false, error: "Failed to add miniature" }
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
    let query = supabase
      .from("mini_army_units")
      .select(
        `
        id,
        quantity,
        paint_status,
        status,
        notes,
        created_at,
        unit:mini_units (
          id,
          external_id,
          name,
          type,
          points,
          model_count,
          faction:mini_factions (
            id,
            name
          ),
          system:mini_systems (
            id,
            code,
            name
          )
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "owned")
      .order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching miniature collection:", error)
      return { success: false, error: error.message, data: [] }
    }

    // Filter by system if specified
    let filtered = data || []
    if (system) {
      filtered = filtered.filter((entry: any) => entry.unit?.system?.code === system)
    }

    return { success: true, data: filtered }
  } catch (error) {
    console.error("Get miniature collection error:", error)
    return { success: false, error: "Failed to fetch collection", data: [] }
  }
}
