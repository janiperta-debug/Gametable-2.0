import { NextResponse } from "next/server"
import type { MiniatureSearchResult, MiniatureSystem } from "../search/route"

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

// Extended unit data for details view
const UNIT_DETAILS: Record<string, MiniatureDetails> = {
  "40k-sm-intercessors": {
    id: "40k-sm-intercessors",
    name: "Intercessor Squad",
    system: "wh40k",
    systemName: "Warhammer 40,000",
    faction: "Space Marines",
    type: "unit",
    points: 80,
    models: 5,
    description: "Intercessors are the most common type of Primaris Space Marine. They are versatile warriors armed with bolt rifles.",
    keywords: ["Infantry", "Battleline", "Imperium", "Tacticus", "Intercessor Squad"],
    abilities: ["Oath of Moment", "Combat Squads"],
    wargear: ["Bolt rifle", "Bolt pistol", "Frag grenades", "Krak grenades"],
    stats: { movement: "6\"", toughness: 4, save: "3+", wounds: 2, leadership: 6, objectiveControl: 2 },
  },
  "40k-sm-terminators": {
    id: "40k-sm-terminators",
    name: "Terminator Squad",
    system: "wh40k",
    systemName: "Warhammer 40,000",
    faction: "Space Marines",
    type: "unit",
    points: 185,
    models: 5,
    description: "Terminators are elite warriors clad in ancient Tactical Dreadnought Armour.",
    keywords: ["Infantry", "Imperium", "Terminator", "Terminator Squad"],
    abilities: ["Oath of Moment", "Teleport Strike", "Fury of the First"],
    wargear: ["Storm bolter", "Power fist"],
    stats: { movement: "5\"", toughness: 5, save: "2+", wounds: 3, leadership: 6, objectiveControl: 1 },
  },
  "40k-necrons-warriors": {
    id: "40k-necrons-warriors",
    name: "Necron Warriors",
    system: "wh40k",
    systemName: "Warhammer 40,000",
    faction: "Necrons",
    type: "unit",
    points: 100,
    models: 10,
    description: "Necron Warriors form the core of the Necron legions, relentless and undying.",
    keywords: ["Infantry", "Battleline", "Necron Warriors"],
    abilities: ["Reanimation Protocols", "Their Number is Legion"],
    wargear: ["Gauss flayer", "Gauss reaper"],
    stats: { movement: "5\"", toughness: 4, save: "4+", wounds: 1, leadership: 7, objectiveControl: 2 },
  },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
  }

  try {
    // Check if we have detailed info
    const details = UNIT_DETAILS[id]
    
    if (details) {
      return NextResponse.json(details)
    }

    // Parse ID to create basic details
    const [system, faction, ...nameParts] = id.split("-")
    const name = nameParts.join(" ").replace(/\b\w/g, (c) => c.toUpperCase())
    
    const basicDetails: MiniatureDetails = {
      id,
      name,
      system: system as MiniatureSystem,
      systemName: system === "wh40k" ? "Warhammer 40,000" : "Age of Sigmar",
      faction: faction.replace(/\b\w/g, (c) => c.toUpperCase()),
      type: "unit",
    }

    return NextResponse.json(basicDetails)
  } catch (error) {
    console.error("Miniatures details error:", error)
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 })
  }
}
