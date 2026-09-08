import assert from "node:assert/strict"
import test from "node:test"

import {
  planLegacyMiniatureOwnershipMigration,
  validateLegacyMiniatureOwnershipCandidates,
  type LegacyMiniatureOwnershipCandidate,
} from "./migration-readiness"

const validRow: LegacyMiniatureOwnershipCandidate = {
  userId: "user-1",
  catalogId: "unit-1",
  catalogFactionId: "faction-1",
  armyId: "army-1",
  armyFactionId: "faction-1",
  owned: true,
  modelCount: 5,
  paintStatus: "unpainted",
}

test("no source rows never invents Army or ownership records", () => {
  const result = planLegacyMiniatureOwnershipMigration([])
  assert.deepEqual(result, { success: true, migratedCount: 0, issues: [] })
})

test("rejects a row missing the authenticated user", () => {
  const { userId, ...rest } = validRow
  const result = validateLegacyMiniatureOwnershipCandidates([rest])
  assert.deepEqual(result, { success: false, issues: [{ index: 0, reason: "missing_user" }] })
})

test("rejects a row with no canonical catalogId (name-only identity is never accepted)", () => {
  const { catalogId, ...rest } = validRow
  const result = validateLegacyMiniatureOwnershipCandidates([rest])
  assert.deepEqual(result, { success: false, issues: [{ index: 0, reason: "missing_catalog_id" }] })
})

test("rejects a row with no target Army", () => {
  const { armyId, ...rest } = validRow
  const result = validateLegacyMiniatureOwnershipCandidates([rest])
  assert.deepEqual(result, { success: false, issues: [{ index: 0, reason: "missing_army" }] })
})

test("rejects a row missing faction information", () => {
  const { catalogFactionId, ...rest } = validRow
  const result = validateLegacyMiniatureOwnershipCandidates([rest])
  assert.deepEqual(result, { success: false, issues: [{ index: 0, reason: "missing_faction" }] })
})

test("rejects an incompatible faction rather than silently reassigning the Army", () => {
  const result = validateLegacyMiniatureOwnershipCandidates([
    { ...validRow, armyFactionId: "faction-2" },
  ])
  assert.deepEqual(result, { success: false, issues: [{ index: 0, reason: "incompatible_faction" }] })
})

test("rejects an invalid model count", () => {
  const result = validateLegacyMiniatureOwnershipCandidates([{ ...validRow, modelCount: 0 }])
  assert.deepEqual(result, { success: false, issues: [{ index: 0, reason: "invalid_model_count" }] })
})

test("accepts a fully specified, faction-compatible row", () => {
  const result = validateLegacyMiniatureOwnershipCandidates([validRow])
  assert.deepEqual(result, {
    success: true,
    rows: [
      {
        userId: "user-1",
        catalogId: "unit-1",
        armyId: "army-1",
        owned: true,
        modelCount: 5,
        paintStatus: "unpainted",
      },
    ],
  })
})

test("owned=false is preserved as-is, never coerced into a Wishlist concept", () => {
  const result = validateLegacyMiniatureOwnershipCandidates([{ ...validRow, owned: false }])
  assert.equal(result.success, true)
  if (!result.success) return
  assert.equal(result.rows[0].owned, false)
})

test("a batch reports every problematic row instead of guessing any of them", () => {
  const result = validateLegacyMiniatureOwnershipCandidates([
    validRow,
    { ...validRow, armyId: null },
    { ...validRow, catalogId: undefined },
  ])
  assert.deepEqual(result, {
    success: false,
    issues: [
      { index: 1, reason: "missing_army" },
      { index: 2, reason: "missing_catalog_id" },
    ],
  })
})

test("planLegacyMiniatureOwnershipMigration migrates only fully valid rows and reports the rest", () => {
  const result = planLegacyMiniatureOwnershipMigration([validRow, { ...validRow, armyId: null }])
  assert.deepEqual(result, {
    success: false,
    migratedCount: 0,
    issues: [{ index: 1, reason: "missing_army" }],
  })
})
