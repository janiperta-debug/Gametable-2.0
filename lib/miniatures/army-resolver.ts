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
  _armies: MiniatureArmyContext[],
): MiniatureArmyResolution {
  // Collection ownership does not require an Army Builder context. The
  // existing resolver contract is retained for callers, but returns a
  // zero-id context so the legacy UI can proceed without creating/selecting
  // an Army. A real Army Builder can use the actual army records later.
  const collectionContext: MiniatureArmyContext = {
    id: "",
    name: "Collection",
    factionId: selectedFactionId ?? "",
    factionName: "",
    systemId: "",
    systemName: "",
    pointLimit: 0,
    isCrusade: false,
  }
  return { kind: "auto", army: collectionContext, candidates: [collectionContext] }
}
