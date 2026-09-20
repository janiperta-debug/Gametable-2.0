import assert from "node:assert/strict"

import {
  canUnlockManorRoom,
  getCurrentManorThreshold,
  getManorFloor,
  getManorLevelFromXp,
  getManorProgression,
  getManorRoomEntitlement,
  getManorUnlockedRoomIds,
  getManorUnlockableRoomIds,
  isManorFloorPreviewVisible,
  isManorRoomUnlocked,
} from "../lib/manor-progression"
import { roomThemes } from "../lib/room-themes"
import { isTreasureVaultComplete, PREVIOUS_ARTIFACTS } from "../lib/artifacts"

const progression = getManorProgression()

assert.equal(roomThemes.length, 19, "Manor must contain exactly 19 rooms")
assert.equal(progression.length, 19, "All 19 rooms must have a canonical entitlement")
assert.equal(
  new Set(progression.map((entry) => entry.roomId)).size,
  19,
  "Room entitlement IDs must be unique",
)

const byFloor = progression.reduce<Record<string, number>>((counts, entry) => {
  counts[entry.floor] = (counts[entry.floor] ?? 0) + 1
  return counts
}, {})

assert.deepEqual(byFloor, {
  ground: 7,
  second: 7,
  basement: 5,
}, "Manor must remain 7 + 7 + 5 rooms")

for (const room of roomThemes) {
  const entitlement = getManorRoomEntitlement(room.id)
  assert.ok(entitlement, `${room.id} is missing a canonical room entry`)
  assert.ok(entitlement!.unlockXp >= 0, `${room.id}: unlock XP must be non-negative`)
  assert.equal(getManorFloor(room.id), progression.find((entry) => entry.roomId === room.id)?.floor)
}

assert.equal(getManorLevelFromXp(0), 1)
assert.equal(getManorLevelFromXp(399), 1)
assert.equal(getManorLevelFromXp(400), 5)

const currentThreshold = getCurrentManorThreshold(6570)
assert.equal(currentThreshold?.level, 30)
assert.equal(currentThreshold?.xp, 6000)
assert.equal(getManorLevelFromXp(6570), 30)

// Level 30: all Ground Floor selections are available and Second Floor previews appear.
assert.equal(isManorFloorPreviewVisible("ground", { xp: 6570 }), true)
assert.equal(isManorFloorPreviewVisible("second", { xp: 5999 }), false)
assert.equal(isManorFloorPreviewVisible("second", { xp: 6570 }), true)
assert.equal(canUnlockManorRoom("ballroom", { xp: 6570, unlocked_themes: [] }), false)
assert.equal(canUnlockManorRoom("ballroom", { xp: 7500, unlocked_themes: [] }), false)
assert.equal(canUnlockManorRoom("ballroom", { xp: 10000, unlocked_themes: [] }), true)

// Legacy future grants must not make a room appear opened before its floor token exists.
const legacyProfile = {
  xp: 6570,
  unlocked_themes: [
    "main-hall",
    "library",
    "conservatory",
    "fireside-lounge",
    "bar",
    "spa",
    "gallery",
    "artroom",
    "ballroom",
  ],
}
assert.equal(isManorRoomUnlocked("gallery", legacyProfile), true)
assert.equal(isManorRoomUnlocked("artroom", legacyProfile), false)
assert.equal(isManorRoomUnlocked("ballroom", legacyProfile), false)
assert.equal(getManorUnlockedRoomIds(legacyProfile).length, 7)

// Once the first Second Floor token is earned, the user may choose any room.
const secondFloorChoice = {
  xp: 10000,
  unlocked_themes: [
    "main-hall",
    "library",
    "conservatory",
    "fireside-lounge",
    "bar",
    "spa",
    "gallery",
  ],
}
assert.equal(canUnlockManorRoom("ballroom", secondFloorChoice), true)
assert.equal(canUnlockManorRoom("map-room", secondFloorChoice), true)

// Basement previews appear at Level 70, but the first Basement choice arrives at Level 75.
assert.equal(isManorFloorPreviewVisible("basement", { xp: 30000 }), true)
assert.equal(canUnlockManorRoom("dungeon", { xp: 30000, unlocked_themes: [] }), false)
assert.equal(canUnlockManorRoom("dungeon", { xp: 34500, unlocked_themes: [] }), true)

assert.equal(isTreasureVaultComplete({ unlocked_themes: [] }), false)
assert.equal(
  isTreasureVaultComplete({ unlocked_themes: [...PREVIOUS_ARTIFACTS] }),
  true,
  "Treasure Vault requires every previous artifact room to be unlocked",
)

console.log("Manor floor preview/token matrix: PASS")
console.log(`Rooms: ${progression.length} (Ground 7 / Second 7 / Basement 5)`)
console.log("State checks: locked -> floor preview -> free room choice -> unlocked")
