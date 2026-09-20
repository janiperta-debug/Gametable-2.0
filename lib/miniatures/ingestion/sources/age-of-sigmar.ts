import type { MiniCatalogAdapter, MiniCatalogCandidate, MiniCatalogSource } from "../types"

const source: MiniCatalogSource = {
  code: "age-of-sigmar-warhammer-community",
  name: "Warhammer Age of Sigmar — Warhammer Community",
  systemCode: "aos_3e",
  sourceType: "html",
  publisher: "Games Workshop",
  sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/warhammer-age-of-sigmar/",
}

const FACTIONS: Record<string, string[]> = {
  "Stormcast Eternals": [
    "Annihilators", "Decimators", "Protectors", "Retributors",
    "Vanguard-Palladors", "Vanguard-Hunters", "Krondys", "Karazai",
    "Stormdrake Guard", "Knight-Draconis", "Yndrasta, the Celestial Spear",
    "Ionis Cryptborn", "Lord-Imperatant", "Knight-Vexillor",
    "Praetors", "Stormstrike Palladors", "Vanguard-Raptors with Hurricane Crossbows",
  ],
  "Seraphon": [
    "Blessed Tetaxi", "Skink Starseer", "Skinks", "Terradon Riders",
    "Ripperdactyl Riders", "Stegadon Chief", "Stegadon", "Aggradon Lancers",
    "Kroxigor Warspawned", "Saurus Warriors", "Raptadon Chargers",
    "Raptadon Hunters", "Slann Starmaster", "Saurus Scar-Veteran on Aggradon",
  ],
  "Skaven": [
    "Vizzik Skour", "Grey Seer Thanquol", "Warlock Galvaneer Grisk Volt-Klaw",
    "Warpvolt Scourgers", "Ratling Warpblaster", "Clanrats", "Stormvermin",
    "Tyrannical Packmaster",
  ],
  "Flesh-eater Courts": [
    "Abhorrant Gorewarden", "Crypt Flayers", "Crypt Horrors",
    "Royal Beastflayers", "Archregent", "Cryptguard",
  ],
  "Daughters of Khaine": [
    "Blood Hags",
  ],
}

export const ageOfSigmarAdapter: MiniCatalogAdapter<string> = {
  source,
  extract(): MiniCatalogCandidate[] {
    return Object.entries(FACTIONS).flatMap(([groupName, units]) =>
      units.map((name) => ({
        externalId: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        systemCode: source.systemCode,
        systemName: "Age of Sigmar",
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
