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

  if (candidates.length === 0) return { kind: "create", candidates: [] }
  if (candidates.length === 1) return { kind: "auto", army: candidates[0], candidates }
  return { kind: "select", candidates }
}
