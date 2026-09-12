/**
 * Canonical Manor progression data and pure entitlement helpers.
 *
 * This module is intentionally not wired to theme activation yet. The current
 * app keeps unfinished rooms/themes behind the existing WIP lock.
 */

export type ManorRoomState = "locked" | "opened_empty" | "complete"
export type ManorArtifactState = "unavailable" | "in_progress" | "restored"

export type ManorRoomEntitlement = {
  roomId: string
  unlockLevel: number
  unlockXp: number
}

export type ManorProgressionEntry = ManorRoomEntitlement & {
  label: string
  floor: "ground" | "second" | "basement" | "dimensions"
}

/**
 * XP thresholds from the Manor & XP Progression Specification v1.
 * The threshold grants an opening right/token/choice; it does not activate a
 * theme automatically.
 */
export const MANOR_XP_THRESHOLDS = [
  { level: 1, xp: 0, roomId: "main-hall" },
  { level: 5, xp: 400 },
  { level: 10, xp: 1000 },
  { level: 15, xp: 2000 },
  { level: 20, xp: 3000 },
  { level: 25, xp: 4500 },
  { level: 30, xp: 6000 },
  { level: 35, xp: 7500 },
  { level: 40, xp: 10000 },
  { level: 45, xp: 12500 },
  { level: 50, xp: 15000 },
  { level: 55, xp: 18500 },
  { level: 60, xp: 22000 },
  { level: 65, xp: 25500 },
  { level: 70, xp: 30000 },
  { level: 75, xp: 34500 },
  { level: 80, xp: 39000 },
  { level: 85, xp: 45000 },
  { level: 90, xp: 51000 },
  { level: 95, xp: 57000 },
  { level: 100, xp: 64500 },
] as const

export function getManorLevelFromXp(xp: number): number {
  const safeXp = Math.max(0, xp)
  return MANOR_XP_THRESHOLDS.reduce(
    (level, threshold) => (safeXp >= threshold.xp ? threshold.level : level),
    1,
  )
}

export function getNextManorThreshold(xp: number) {
  const safeXp = Math.max(0, xp)
  return MANOR_XP_THRESHOLDS.find((threshold) => threshold.xp > safeXp) ?? null
}

export function isManorThresholdReached(xp: number, requiredXp: number): boolean {
  return Math.max(0, xp) >= requiredXp
}

export type TreasureVaultState = {
  roomState: ManorRoomState
  artifactState: ManorArtifactState
  restoredArtifactIds: string[]
  requiredArtifactIds: string[]
}

/**
 * The Vault can be opened before the other rooms are complete. It becomes
 * complete only after every required non-vault artifact has been restored.
 */
export function getTreasureVaultState(
  restoredArtifactIds: string[],
  requiredArtifactIds: string[],
  opened: boolean,
): TreasureVaultState {
  const restored = new Set(restoredArtifactIds)
  const complete = requiredArtifactIds.every((artifactId) => restored.has(artifactId))

  return {
    roomState: complete ? "complete" : opened ? "opened_empty" : "locked",
    artifactState: complete ? "restored" : opened ? "in_progress" : "unavailable",
    restoredArtifactIds: [...restored],
    requiredArtifactIds: [...requiredArtifactIds],
  }
}
