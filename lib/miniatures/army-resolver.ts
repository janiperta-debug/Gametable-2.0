export interface MiniatureArmyContext {
  id: string
  name: string
  factionId: string
  factionName: string
  systemId: string
  systemName: string
  edition?: string
  pointLimit: number
  isCrusade: boolean
}

export type MiniatureArmyResolution =
  | { kind: "create"; candidates: [] }
  | { kind: "auto"; army: MiniatureArmyContext; candidates: [MiniatureArmyContext] }
  | { kind: "select"; candidates: MiniatureArmyContext[] }

export function resolveMiniatureArmy(
  selectedFactionId: string | undefined,
  armies: MiniatureArmyContext[],
): MiniatureArmyResolution {
  const candidates = selectedFactionId
    ? armies.filter((army) => army.factionId === selectedFactionId)
    : []

  // Army Builder is not part of Miniatures Collection ownership. Keep the
  // legacy resolver usable for future Army Builder flows, but do not require
  // an army just to add a catalog unit to Collection.
  if (candidates.length === 0) {
    return {
      kind: "auto",
      army: {
        id: "",
        name: "Collection",
        factionId: selectedFactionId ?? "",
        factionName: "",
        systemId: "",
        systemName: "",
        pointLimit: 0,
        isCrusade: false,
      },
      candidates: [{
        id: "",
        name: "Collection",
        factionId: selectedFactionId ?? "",
        factionName: "",
        systemId: "",
        systemName: "",
        pointLimit: 0,
        isCrusade: false,
      }],
    }
  }
  if (candidates.length === 1) return { kind: "auto", army: candidates[0], candidates }
  return { kind: "select", candidates }
}
