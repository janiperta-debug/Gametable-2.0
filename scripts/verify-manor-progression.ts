import assert from "node:assert/strict"

import {
  canUnlockManorRoom,
  getManorLevelFromXp,
  getManorProgression,
  getManorRoomEntitlement,
  getManorUnlockedRoomIds,
  getManorUnlockableRoomIds,
  isManorRoomUnlocked,
} from "../lib/manor-progression"
import { roomThemes } from "../lib/room-themes"

const progression = getManorProgression()

assert.equal(roomThemes.length, 19, "Manor must contain exactly 19 rooms")
assert.equal(progression.length, 19, "All 19 rooms must have a canonical entitlement")
assert.equal(
  new Set(progression.map((entry) => entry.roomId)).size,
  19,
  "Room entitlement IDs must be unique",
)

for (const room of roomThemes) {
  const entitlement = getManorRoomEntitlement(room.id)
  assert.ok(entitlement, `${room.id} is missing a canonical entitlement`)
  assert.equal(entitlement!.unlockLevel, room.unlockLevel, `${room.id}: unlock level mismatch`)
  assert.ok(entitlement!.unlockXp >= 0, `${room.id}: unlock XP must be non-negative`)
}

const byFloor = progression.reduce<Record<string, number>>((counts, entry) => {
  counts[entry.floor] = (counts[entry.floor] ?? 0) + 1
  return counts
}, {})

assert.deepEqual(byFloor, {
  ground: 7,
  second: 7,
  basement: 5,
}, "Manor must remain 7 + 7 + 5 rooms")

const mainHall = getManorRoomEntitlement("main-hall")
assert.deepEqual(mainHall, {
  roomId: "main-hall",
  unlockLevel: 1,
  unlockXp: 0,
})

const sampleRoom = roomThemes.find((room) => room.id !== "main-hall")
assert.ok(sampleRoom, "At least one non-default room is required for state tests")

const sampleEntitlement = getManorRoomEntitlement(sampleRoom!.id)!
const beforeThreshold = Math.max(0, sampleEntitlement.unlockXp - 1)

const lockedProfile = { xp: beforeThreshold, unlocked_themes: [] as string[] }
assert.equal(
  isManorRoomUnlocked(sampleRoom!.id, lockedProfile),
  false,
  `${sampleRoom!.id}: must be locked before explicit unlock`,
)
assert.equal(
  canUnlockManorRoom(sampleRoom!.id, lockedProfile),
  false,
  `${sampleRoom!.id}: must not be unlockable below threshold`,
)

const unlockableProfile = { xp: sampleEntitlement.unlockXp, unlocked_themes: [] as string[] }
assert.equal(
  canUnlockManorRoom(sampleRoom!.id, unlockableProfile),
  true,
  `${sampleRoom!.id}: must be unlockable at threshold`,
)
assert.deepEqual(
  getManorUnlockableRoomIds(unlockableProfile),
  [sampleRoom!.id],
  `${sampleRoom!.id}: unlockable list must contain exactly the threshold room in the sample state`,
)

const unlockedProfile = {
  xp: sampleEntitlement.unlockXp,
  unlocked_themes: [sampleRoom!.id],
}
assert.equal(
  isManorRoomUnlocked(sampleRoom!.id, unlockedProfile),
  true,
  `${sampleRoom!.id}: must be unlocked after explicit grant`,
)
assert.equal(
  canUnlockManorRoom(sampleRoom!.id, unlockedProfile),
  false,
  `${sampleRoom!.id}: must not remain unlockable after explicit grant`,
)
assert.deepEqual(
  getManorUnlockedRoomIds(unlockedProfile),
  ["main-hall", sampleRoom!.id],
  "Unlocked room list must always include Main Hall",
)

assert.equal(getManorLevelFromXp(0), 1)
assert.equal(getManorLevelFromXp(399), 1)
assert.equal(getManorLevelFromXp(400), 5)

console.log("Manor entitlement matrix: PASS")
console.log(`Rooms: ${progression.length} (Ground 7 / Second 7 / Basement 5)`)
console.log("State checks: locked -> unlockable -> unlocked")
console.log("Threshold checks: XP boundary behavior verified")
