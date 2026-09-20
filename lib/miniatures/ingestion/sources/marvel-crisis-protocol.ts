import type {
  MiniCatalogAdapter,
  MiniCatalogCandidate,
  MiniCatalogSource,
} from "../types"

const source: MiniCatalogSource = {
  code: "marvel-crisis-protocol-atomic-mass-games",
  name: "Marvel: Crisis Protocol — Atomic Mass Games",
  systemCode: "marvel_crisis_protocol",
  sourceType: "pdf",
  publisher: "Atomic Mass Games",
  sourceUrl:
    "https://cdn.svc.asmodee.net/production-amgcom/uploads/2026/01/OP_CrisisProtocol_2026_Timeline_20251219.pdf",
}

const AFFILIATIONS = [
  "A-Force",
  "Asgard",
  "Avengers",
  "Cabal",
  "Convocation",
  "Criminal Syndicate",
  "Dark Dimension",
  "Defenders",
  "Guardians of the Galaxy",
  "Hydra",
  "Mighty Avengers",
  "Sentinels",
  "S.H.I.E.L.D.",
  "Spider-Foes",
  "Uncanny X-Men",
  "Web Warriors",
  "X-Force",
  "Unaffiliated",
] as const

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function cleanCharacterName(value: string): string {
  return value
    .replace(/^[-*•]\s*/, "")
    .replace(/\s*\[affiliation\]\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

export const marvelCrisisProtocolAdapter: MiniCatalogAdapter<string> = {
  source,

  extract(text: string): MiniCatalogCandidate[] {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    const affiliationSet = new Set<string>(AFFILIATIONS)
    const characterAffiliations = new Map<string, Set<string>>()
    let currentAffiliation: string | undefined

    for (const line of lines) {
      const heading = line.replace(/^#+\s*/, "").trim()
      if (affiliationSet.has(heading)) {
        currentAffiliation = heading
        continue
      }

      if (!currentAffiliation) continue
      const character = cleanCharacterName(line)
      if (!character || character.length > 120) continue
      if (
        character.startsWith("The following") ||
        character.startsWith("A comprehensive") ||
        character.startsWith("Restricted") ||
        character.startsWith("During all")
      ) {
        continue
      }

      const affiliations =
        characterAffiliations.get(character) ?? new Set<string>()
      affiliations.add(currentAffiliation)
      characterAffiliations.set(character, affiliations)
    }

    return [...characterAffiliations.entries()].map(([name, affiliations]) => ({
      externalId: slug(name),
      systemCode: source.systemCode,
      systemName: "Marvel: Crisis Protocol",
      edition: "2026",
      name,
      itemType: "character",
      sourceName: source.name,
      sourceUrl: source.sourceUrl,
      sourcePayload: {
        affiliations: [...affiliations],
      },
    }))
  },
}
