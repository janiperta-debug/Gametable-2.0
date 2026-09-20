import type { MiniCatalogAdapter, MiniCatalogCandidate, MiniCatalogSource } from "../types"

const source: MiniCatalogSource = {
  code: "star-wars-legion-atomic-mass-games",
  name: "Star Wars: Legion — Atomic Mass Games",
  systemCode: "sw_legion",
  sourceType: "html",
  publisher: "Atomic Mass Games",
  sourceUrl: "https://www.atomicmassgames.com/swlegiondocs/",
}

const FACTIONS: Record<string, string[]> = {
  "Galactic Empire": [
    "Stormtroopers", "Stormtrooper Riot Squad", "Stromtroopers Heavy Response Unit",
    "Snowtroopers", "Shore Troopers", "DF-90 Mortar Trooper", "Scout Troopers",
    "Scout Trooper Strike Team", "Imperial Death Troopers", "Imperial Special Forces",
    "Imperial Special Forces- Inferno Squad", "74-Z Speeder Bikes", "E-Web Heavy Blaster Team",
    "Dewback Rider", "Range Troopers", "AT-ST", "GAVw Assault Tank",
    "LAAT/le Patrol Transport", "Imperial Dark Troopers",
  ],
  "Rebel Alliance": [
    "Mark II Medium Blaster", "Rebel Troopers", "Fleet Troopers", "Rebel Veterans",
    "Rebel Commandos", "Rebel Commandos, Strike Team", "Wookiee Warriors, Freedom Fighters",
    "Wookiee Warriors, Kashyyyk Resistance", "Mandalorian Resistance",
    "Mandalorian Resistance, Clan Wren", "Rebel Sleeper Cell", "AT-RT",
    "1.4FD Laser Cannon Team", "Taunttaun Riders", "T-47 Airspeeder",
    "X-34 Landspeeder", "A-A5 Speeder Truck", "Swoop Bike Riders",
    "Ewok Slingers", "Ewok Skirmishers",
  ],
  "Galactic Republic": [
    "Clone Trooper Infantry", "Arc Troopers", "Arc Troopers Strike Team",
    "Wookiee Warriors, Kashyyyk Defenders", "Wookiee Warriors, Noble Fighters",
    "BARC Speeder", "AT-RT", "Raddaugh Gnasp Fluttercraft",
    "Raddaugh Gnasp Fluttercraft, Attack Craft", "Clone Commandos",
    "Clone Commandos, Delta Squad", "TX-130 Saber Tank", "LAAT/le Patrol Transport",
    "Infantry Support Platform", "Swoop Bike Riders",
  ],
  "Separatist Alliance": [
    "DRK-1 Probe Droids", "B1 Battle Droids", "B2 Battle Droids",
    "Geonosian Warriors", "BX-Series Droid Commandos",
    "BX-Series Droid Commandos Strike Team", "IG-100 Magnaguard",
    "IG-100 Prototype Magnaguard", "Droidekas", "STAP Riders",
    "DSD1 Dward Spider Droid", "AAT Battle Tank", "Persuader Class Tank Droid",
    "Prototype Tank Droid", "Pyke Syndacite Foot Soldiers", "Pyke Syndacite Capo",
    "Black Sun Vigo", "Black Sun Enforcers",
  ],
  "Mercenaries": [
    "Pyke Syndacite Foot Soldiers", "Swoop Bike Riders", "Pyke Syndacite Capo",
    "Black Sun Vigo", "Black Sun Enforcers", "Gar Saxon", "Maul, A Rival",
    "Bossk", "Boba Fett", "Boba Fett, Daimyo", "Cad Bane", "IG-88",
    "IG-11", "Din Djarin", "Mandalorian Super Commandos", "A-A5 Speeder Truck", "Grogu",
  ],
}

export const starWarsLegionAdapter: MiniCatalogAdapter<string> = {
  source,
  extract(): MiniCatalogCandidate[] {
    return Object.entries(FACTIONS).flatMap(([groupName, units]) =>
      units.map((name) => ({
        externalId: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        systemCode: source.systemCode,
        systemName: "Star Wars: Legion",
        edition: "2026",
        groupName,
        name,
        itemType: "unit" as const,
        sourceName: source.name,
        sourceUrl: source.sourceUrl,
      })),
    )
  },
}
