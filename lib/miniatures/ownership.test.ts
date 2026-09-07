import assert from "node:assert/strict"
import test from "node:test"

import { buildMiniatureArmyUnitPayload, mapMiniaturePaintStatus } from "./ownership"

const army = { id: "army-1", factionId: "faction-1" }
const canonicalUnit = { id: "unit-1", faction_id: "faction-1", base_points: 185 }

test("rejects a missing catalogId", () => {
  assert.deepEqual(buildMiniatureArmyUnitPayload({
    army, canonicalUnit, userId: "user-1", modelCount: 1, paintStatus: "unpainted",
  }), { success: false, error: "Miniature is not a canonical catalog result" })
})

test("rejects a missing Army", () => {
  assert.deepEqual(buildMiniatureArmyUnitPayload({
    catalogId: "unit-1", canonicalUnit, userId: "user-1", modelCount: 1, paintStatus: "unpainted",
  }), { success: false, error: "Army context is required" })
})

test("rejects an incompatible Army faction", () => {
  assert.deepEqual(buildMiniatureArmyUnitPayload({
    catalogId: "unit-1", army: { id: "army-1", factionId: "faction-2" }, canonicalUnit,
    userId: "user-1", modelCount: 1, paintStatus: "unpainted",
  }), { success: false, error: "Selected Army faction is incompatible with this Miniature" })
})

test("uses canonical data and the authenticated user for the ownership payload", () => {
  const result = buildMiniatureArmyUnitPayload({
    catalogId: "client-catalog-id",
    army,
    canonicalUnit,
    userId: "authenticated-user",
    modelCount: 3,
    paintStatus: "painted",
  })

  assert.deepEqual(result, {
    success: true,
    data: {
      army_id: "army-1",
      unit_id: "unit-1",
      user_id: "authenticated-user",
      model_count: 3,
      points_total: 185,
      owned: true,
      paint_status: "battle_ready",
      custom_name: null,
      upgrades: null,
      is_warlord: false,
    },
  })
})

test("maps every UI paint status to a production value", () => {
  assert.deepEqual(
    ["unpainted", "primed", "in_progress", "painted", "based"].map((status) =>
      mapMiniaturePaintStatus(status as Parameters<typeof mapMiniaturePaintStatus>[0]),
    ),
    ["unpainted", "primed", "wip", "battle_ready", "parade_ready"],
  )
})

test("permits duplicate catalog entries as separate payloads", () => {
  const first = buildMiniatureArmyUnitPayload({
    catalogId: "unit-1", army, canonicalUnit, userId: "user-1", modelCount: 1, paintStatus: "unpainted",
  })
  const second = buildMiniatureArmyUnitPayload({
    catalogId: "unit-1", army, canonicalUnit, userId: "user-1", modelCount: 1, paintStatus: "unpainted",
  })

  assert.deepEqual(second, first)
})
