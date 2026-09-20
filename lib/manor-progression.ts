/**
 * Canonical Manor progression data and pure entitlement helpers.
 *
 * XP grants an opening right/selection possibility at the room threshold.
 * It does not activate a theme automatically. Explicit room grants are stored
 * in profiles.unlocked_themes; the active theme is stored separately in
 * profiles.preferred_theme.
 */

import { roomThemes, type RoomTheme } from "@/lib/room-themes"

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
 *
 * These thresholds are level milestones. A room uses the threshold matching
 * its unlockLevel; not every level milestone maps to a room.
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

const ROOM_FLOOR: Record<RoomTheme["category"], ManorProgressionEntry["floor"]> = {
  "Ground Floor": "ground",
  "Second Floor": "second",
  Basement: "basement",
}

function getThresholdForLevel(level: number) {
  return MANOR_XP_THRESHOLDS.find((threshold) => threshold.level === level) ?? null
}

/**
 * Returns the canonical XP threshold for a room's unlockLevel.
 */
export function getManorRoomEntitlement(roomId: string): ManorRoomEntitlement | null {
  const room = roomThemes.find((candidate) => candidate.id === roomId)
  if (!room) return null

  const threshold = getThresholdForLevel(room.unlockLevel)
  if (!threshold) return null

  return {
    roomId: room.id,
    unlockLevel: room.unlockLevel,
    unlockXp: threshold.xp,
  }
}

/**
 * Returns all 19 room entitlements from the canonical room catalog.
 */
export function getManorProgression(): ManorProgressionEntry[] {
  return roomThemes.flatMap((room) => {
    const entitlement = getManorRoomEntitlement(room.id)
    if (!entitlement) return []

    return [{
      ...entitlement,
      label: room.name,
      floor: ROOM_FLOOR[room.category],
    }]
  })
}

export function getManorLevelFromXp(xp: number): number {
  const safeXp = Math.max(0, xp)
  return MANOR_XP_THRESHOLDS.reduce(
    (level, threshold) => (safeXp >= threshold.xp ? threshold.level : level),
    1,
  )
}

export function getCurrentManorThreshold(xp: number) {
  const safeXp = Math.max(0, xp)
  return MANOR_XP_THRESHOLDS.reduce<(typeof MANOR_XP_THRESHOLDS)[number] | null>(
    (current, threshold) => (safeXp >= threshold.xp ? threshold : current),
    null,
  )
}

export function getNextManorThreshold(xp: number) {
  const safeXp = Math.max(0, xp)
  return MANOR_XP_THRESHOLDS.find((threshold) => threshold.xp > safeXp) ?? null
}

export function isManorThresholdReached(xp: number, requiredXp: number): boolean {
  return Math.max(0, xp) >= requiredXp
}

export type ManorEntitlementProfile = {
  xp?: number | null
  level?: number | null
  unlocked_themes?: string[] | null
  preferred_theme?: string | null
}

/**
 * Explicit room access is the persisted "opened" state.
 * Reaching the XP threshold only makes the room eligible to be opened.
 */
export function isManorRoomUnlocked(
  roomId: string,
  profile?: ManorEntitlementProfile | null,
): boolean {
  if (roomId === "main-hall") return true
  return (profile?.unlocked_themes ?? []).includes(roomId)
}

/**
 * XP grants the right to open/select a room, but does not open it
 * automatically and does not activate it.
 */
export function canUnlockManorRoom(
  roomId: string,
  profile?: ManorEntitlementProfile | null,
): boolean {
  if (roomId === "main-hall" || isManorRoomUnlocked(roomId, profile)) return false

  const entitlement = getManorRoomEntitlement(roomId)
  if (!entitlement) return false

  const xp = Math.max(0, profile?.xp ?? 0)
  return isManorThresholdReached(xp, entitlement.unlockXp)
}

export function getManorUnlockedRoomIds(
  profile?: ManorEntitlementProfile | null,
): string[] {
  const explicit = new Set(profile?.unlocked_themes ?? [])
  explicit.add("main-hall")

  return getManorProgression()
    .map((entry) => entry.roomId)
    .filter((roomId) => explicit.has(roomId))
}

export function getManorUnlockableRoomIds(
  profile?: ManorEntitlementProfile | null,
): string[] {
  return getManorProgression()
    .map((entry) => entry.roomId)
    .filter((roomId) => canUnlockManorRoom(roomId, profile))
}

/**
 * Shared entitlement predicate for room/theme consumers.
 * Kept for existing callers that already provide a required XP value.
 */
export function isManorRoomEntitled(xp: number, requiredXp: number): boolean {
  return isManorThresholdReached(xp, requiredXp)
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
