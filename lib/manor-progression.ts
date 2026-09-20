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

type ManorFloor = "ground" | "second" | "basement"

type ManorFloorRule = {
  floor: ManorFloor
  previewXp: number
  unlockLevels: readonly number[]
}

/**
 * Manor is a floor-based choice system:
 * - Ground Floor: always visible; Main Hall starts open, then six choices.
 * - Level 30 reveals the Second Floor previews.
 * - Level 35 starts Second Floor room choices.
 * - Level 70 reveals the Basement previews.
 * - Level 75 starts Basement room choices.
 *
 * XP grants a number of opening tokens. The user chooses which room to spend
 * each token on; XP never selects a specific room automatically.
 */
export const MANOR_FLOOR_RULES: readonly ManorFloorRule[] = [
  {
    floor: "ground",
    previewXp: 0,
    unlockLevels: [1, 5, 10, 15, 20, 25, 30],
  },
  {
    floor: "second",
    previewXp: 7500,
    unlockLevels: [35, 40, 45, 50, 55, 60, 65],
  },
  {
    floor: "basement",
    previewXp: 30000,
    unlockLevels: [75, 80, 85, 90, 95],
  },
]

function getManorFloorForRoom(roomId: string): ManorFloor | null {
  const room = roomThemes.find((candidate) => candidate.id === roomId)
  if (!room) return null

  return ROOM_FLOOR[room.category]
}

function getFloorRule(floor: ManorFloor): ManorFloorRule {
  return MANOR_FLOOR_RULES.find((rule) => rule.floor === floor)!
}

function getUnlockXpForLevel(level: number): number {
  return getThresholdForLevel(level)?.xp ?? Number.POSITIVE_INFINITY
}

function getFloorPreviewXp(floor: ManorFloor): number {
  return getFloorRule(floor).previewXp
}

function getFloorSelectionCount(xp: number, floor: ManorFloor): number {
  const safeXp = Math.max(0, xp)
  return getFloorRule(floor).unlockLevels.filter(
    (level) => safeXp >= getUnlockXpForLevel(level),
  ).length
}

function isFloorPreviewVisible(xp: number, floor: ManorFloor): boolean {
  return Math.max(0, xp) >= getFloorPreviewXp(floor)
}

/**
 * Returns the explicit room grants that are valid for the user's current
 * floor/token budget. This also safely ignores legacy future-room grants.
 */
export function getManorUnlockedRoomIds(
  profile?: ManorEntitlementProfile | null,
): string[] {
  const xp = Math.max(0, profile?.xp ?? 0)
  const explicit = profile?.unlocked_themes ?? []
  const seen = new Set<string>()
  const result: string[] = ["main-hall"]
  seen.add("main-hall")

  for (const roomId of explicit) {
    if (seen.has(roomId)) continue

    const floor = getManorFloorForRoom(roomId)
    if (!floor) continue
    if (floor === "ground" && roomId === "main-hall") continue

    const allowed = getFloorSelectionCount(xp, floor)
    const alreadyOpened = result.filter(
      (candidateId) => getManorFloorForRoom(candidateId) === floor,
    ).length

    if (alreadyOpened >= allowed) continue

    result.push(roomId)
    seen.add(roomId)
  }

  return result
}

/**
 * Explicit room access is the persisted "opened" state, constrained by the
 * current XP-earned floor/token budget. Reaching XP never auto-opens a room.
 */
export function isManorRoomUnlocked(
  roomId: string,
  profile?: ManorEntitlementProfile | null,
): boolean {
  return getManorUnlockedRoomIds(profile).includes(roomId)
}

/**
 * XP grants an opening token, not a predetermined room.
 */
export function canUnlockManorRoom(
  roomId: string,
  profile?: ManorEntitlementProfile | null,
): boolean {
  if (roomId === "main-hall" || isManorRoomUnlocked(roomId, profile)) return false

  const floor = getManorFloorForRoom(roomId)
  if (!floor) return false

  const xp = Math.max(0, profile?.xp ?? 0)
  if (!isFloorPreviewVisible(xp, floor)) return false

  const earnedSelections = getFloorSelectionCount(xp, floor)
  const openedSelections = getManorUnlockedRoomIds(profile).filter(
    (candidateId) => getManorFloorForRoom(candidateId) === floor,
  ).length

  return openedSelections < earnedSelections
}

export function getManorUnlockableRoomIds(
  profile?: ManorEntitlementProfile | null,
): string[] {
  return getManorProgression()
    .map((entry) => entry.roomId)
    .filter((roomId) => canUnlockManorRoom(roomId, profile))
}

/**
 * Returns whether a floor's room preview images should be shown.
 */
export function isManorFloorPreviewVisible(
  floor: ManorFloor,
  profile?: ManorEntitlementProfile | null,
): boolean {
  return isFloorPreviewVisible(Math.max(0, profile?.xp ?? 0), floor)
}

/**
 * Returns the floor represented by a Manor room.
 */
export function getManorFloor(roomId: string): ManorFloor | null {
  return getManorFloorForRoom(roomId)
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
