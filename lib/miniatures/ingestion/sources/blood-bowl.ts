import type {
  MiniCatalogAdapter,
  MiniCatalogCandidate,
  MiniCatalogSource,
} from "../types"

const source: MiniCatalogSource = {
  code: "blood-bowl-warhammer-community",
  name: "Blood Bowl — Warhammer Community",
  systemCode: "blood_bowl",
  sourceType: "pdf",
  publisher: "Games Workshop",
  sourceUrl: "https://www.warhammer-community.com/en-gb/downloads/blood-bowl/",
}

const TEAM_NAMES = [
  "Amazon",
  "Black Orc",
  "Bretonnian",
  "Chaos Chosen",
  "Chaos Dwarf",
  "Chaos Renegade",
  "Dark Elf",
  "Dwarf",
  "Elven Union",
  "Gnome",
  "Goblin",
  "Halfling",
  "High Elf",
  "Human",
  "Imperial Nobility",
  "Khorne",
  "Lizardmen",
  "Necromantic Horror",
  "Norse",
  "Nurgle",
  "Ogre",
  "Old World Alliance",
  "Orc",
  "Shambling Undead",
  "Skaven",
  "Snotling",
  "Tomb Kings",
  "Underworld Denizens",
  "Vampire",
  "Wood Elf",
] as const

export const bloodBowlAdapter: MiniCatalogAdapter<string> = {
  source,
  extract(): MiniCatalogCandidate[] {
    return TEAM_NAMES.map((name) => {
      const teamNames: Record<string, string> = {
        "High Elf": "Caledor Dragons",
      }
      const teamName = teamNames[name] ?? name

      return {
        externalId: teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        systemCode: source.systemCode,
        systemName: "Blood Bowl",
        groupName: name,
        name: teamName,
        itemType: "team",
        sourceName: source.name,
        sourceUrl: source.sourceUrl,
        sourcePayload: teamName === "Caledor Dragons"
          ? {
              imageUrl: "https://assets.warhammer-community.com/sundaypreview-mar08-bb_01-highelfteam-dupnbwhuax.jpg",
              imageSourceUrl: "https://www.warhammer-community.com/en-gb/articles/ngdxmygg/sunday-preview-black-library-celebration-and-blood-bowl-releases/",
            }
          : undefined,
      }
    })
  },
}
