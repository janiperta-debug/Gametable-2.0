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

for (const room of roomThemes) {
  const entitlement = getManorRoomEntitlement(room.id)!

  if (room.id === "main-hall") {
    assert.equal(isManorRoomUnlocked(room.id, { xp: 0, unlocked_themes: [] }), true)
    assert.equal(canUnlockManorRoom(room.id, { xp: 0, unlocked_themes: [] }), false)
    continue
  }

  const beforeThreshold = Math.max(0, entitlement.unlockXp - 1)
  const lockedProfile = { xp: beforeThreshold, unlocked_themes: [] as string[] }
  const unlockableProfile = { xp: entitlement.unlockXp, unlocked_themes: [] as string[] }
  const unlockedProfile = {
    xp: entitlement.unlockXp,
    unlocked_themes: [room.id],
  }

  assert.equal(
    isManorRoomUnlocked(room.id, lockedProfile),
    false,
    `${room.id}: locked state failed`,
  )
  assert.equal(
    canUnlockManorRoom(room.id, lockedProfile),
    false,
    `${room.id}: below-threshold state failed`,
  )
  assert.equal(
    canUnlockManorRoom(room.id, unlockableProfile),
    true,
    `${room.id}: threshold must be unlockable`,
  )
  assert.equal(
    isManorRoomUnlocked(room.id, unlockedProfile),
    true,
    `${room.id}: explicit unlocked state failed`,
  )
  assert.equal(
    canUnlockManorRoom(room.id, unlockedProfile),
    false,
    `${room.id}: must stop being unlockable after explicit grant`,
  )
}

assert.deepEqual(
  getManorUnlockedRoomIds({ xp: 0, unlocked_themes: [] }),
  ["main-hall"],
  "Fresh profile must have only Main Hall explicitly unlocked",
)

assert.equal(getManorLevelFromXp(0), 1)
assert.equal(getManorLevelFromXp(399), 1)
assert.equal(getManorLevelFromXp(400), 5)

const currentThreshold = (await import("../lib/manor-progression")).getCurrentManorThreshold(6570)
assert.equal(currentThreshold?.level, 30)
assert.equal(currentThreshold?.xp, 6000)
assert.equal(getManorLevelFromXp(6570), 30)

console.log("Manor entitlement matrix: PASS")
console.log(`Rooms: ${progression.length} (Ground 7 / Second 7 / Basement 5)`)
console.log("State checks: locked -> unlockable -> unlocked")
console.log("Threshold checks: XP boundary behavior verified")
