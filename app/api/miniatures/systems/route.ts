import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface MiniatureSystemOption {
  id: string
  name: string
  code: string
  edition?: string
}

type SystemRow = MiniatureSystemOption & {
  mini_factions?: Array<{ count: number }>
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("mini_systems")
      .select("id, name, code, edition, mini_factions(count)")
      .order("name")
      .order("edition", { ascending: false, nullsFirst: false })

    if (error) {
      console.error("Miniature systems query error:", error)
      return NextResponse.json({ systems: [] }, { status: 500 })
    }

    // The catalog contains some legacy rows with the same human-facing
    // system name but different IDs/codes. They must not appear as separate
    // choices in the selector. Prefer the row with the richest faction
    // catalog, then an edition-labelled row.
    const systemsByName = new Map<string, SystemRow>()

    for (const system of (data ?? []) as SystemRow[]) {
      const key = system.name.trim().toLocaleLowerCase()
      const existing = systemsByName.get(key)

      if (!existing) {
        systemsByName.set(key, system)
        continue
      }

      const existingFactionCount = existing.mini_factions?.[0]?.count ?? 0
      const currentFactionCount = system.mini_factions?.[0]?.count ?? 0
      const existingHasEdition = Boolean(existing.edition)
      const currentHasEdition = Boolean(system.edition)

      if (
        currentFactionCount > existingFactionCount ||
        (currentFactionCount === existingFactionCount &&
          currentHasEdition &&
          !existingHasEdition)
      ) {
        systemsByName.set(key, system)
      }
    }

    const systems = [...systemsByName.values()].map(({ mini_factions: _factions, ...system }) => system)

    return NextResponse.json({ systems })
  } catch (error) {
    console.error("Miniature systems endpoint error:", error)
    return NextResponse.json({ systems: [] }, { status: 500 })
  }
}
