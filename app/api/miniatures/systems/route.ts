import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface MiniatureSystemOption {
  id: string
  name: string
  code: string
  edition?: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("mini_systems")
      .select("id, name, code, edition")
      .order("name")
      .order("edition", { ascending: false, nullsFirst: false })

    if (error) {
      console.error("Miniature systems query error:", error)
      return NextResponse.json({ systems: [] }, { status: 500 })
    }

    // Collapse duplicate catalog rows for the same system code/name while
    // keeping the first (preferably edition-labelled) entry for the UI.
    const seen = new Set<string>()
    const systems = (data ?? []).filter((system) => {
      const key = `${system.code}::${system.name}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }) as MiniatureSystemOption[]

    return NextResponse.json({ systems })
  } catch (error) {
    console.error("Miniature systems endpoint error:", error)
    return NextResponse.json({ systems: [] }, { status: 500 })
  }
}
