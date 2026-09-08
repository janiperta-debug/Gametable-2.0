import assert from "node:assert/strict"
import test from "node:test"

import {
  resolveMiniatureCatalogMatch,
  validateMiniatureBulkImport,
  type ParsedMiniatureImportLine,
} from "./bulk-import"
import type { MiniatureSearchResult } from "@/app/api/miniatures/catalog"

function catalogResult(overrides: Partial<MiniatureSearchResult> = {}): MiniatureSearchResult {
  return {
    catalogId: "catalog-1",
    name: "Intercessors",
    systemId: "system-1",
    systemCode: "wh40k",
    systemName: "Warhammer 40,000",
    factionId: "faction-1",
    ...overrides,
  }
}

test("resolveMiniatureCatalogMatch: zero results is unresolved", () => {
  assert.deepEqual(resolveMiniatureCatalogMatch([]), { status: "unresolved" })
  assert.deepEqual(resolveMiniatureCatalogMatch(undefined), { status: "unresolved" })
})

test("resolveMiniatureCatalogMatch: multiple results is ambiguous, never picks results[0]", () => {
  const results = [catalogResult({ catalogId: "a" }), catalogResult({ catalogId: "b" })]
  assert.deepEqual(resolveMiniatureCatalogMatch(results), { status: "ambiguous" })
})

test("resolveMiniatureCatalogMatch: single result without catalogId is unresolved", () => {
  assert.deepEqual(resolveMiniatureCatalogMatch([catalogResult({ catalogId: undefined })]), {
    status: "unresolved",
  })
})

test("resolveMiniatureCatalogMatch: single result without factionId is missing_faction", () => {
  assert.deepEqual(resolveMiniatureCatalogMatch([catalogResult({ factionId: undefined })]), {
    status: "missing_faction",
  })
})

test("resolveMiniatureCatalogMatch: exactly one canonical result resolves", () => {
  assert.deepEqual(resolveMiniatureCatalogMatch([catalogResult()]), {
    status: "resolved",
    catalogId: "catalog-1",
    factionId: "faction-1",
  })
})

test("validateMiniatureBulkImport: rejects unresolved lines and reports them", () => {
  const lines: ParsedMiniatureImportLine[] = [{ name: "Unknown Unit", quantity: 1 }]
  const result = validateMiniatureBulkImport(lines, [[]])
  assert.equal(result.success, false)
  if (result.success) return
  assert.deepEqual(result.issues, [{ index: 0, name: "Unknown Unit", reason: "unresolved" }])
})

test("validateMiniatureBulkImport: rejects ambiguous lines and reports them, no auto-selection", () => {
  const lines: ParsedMiniatureImportLine[] = [{ name: "Intercessors", quantity: 5 }]
  const results = [catalogResult({ catalogId: "a" }), catalogResult({ catalogId: "b" })]
  const result = validateMiniatureBulkImport(lines, [results])
  assert.equal(result.success, false)
  if (result.success) return
  assert.deepEqual(result.issues, [{ index: 0, name: "Intercessors", reason: "ambiguous" }])
})

test("validateMiniatureBulkImport: rejects invalid quantity", () => {
  const lines: ParsedMiniatureImportLine[] = [{ name: "Intercessors", quantity: 0 }]
  const result = validateMiniatureBulkImport(lines, [[catalogResult()]])
  assert.equal(result.success, false)
  if (result.success) return
  assert.deepEqual(result.issues, [{ index: 0, name: "Intercessors", reason: "invalid_quantity" }])
})

test("validateMiniatureBulkImport: rejects conflicting factions across the whole import", () => {
  const lines: ParsedMiniatureImportLine[] = [
    { name: "Intercessors", quantity: 5 },
    { name: "Boyz", quantity: 10 },
  ]
  const resultsByLine = [
    [catalogResult({ catalogId: "unit-1", factionId: "faction-1" })],
    [catalogResult({ catalogId: "unit-2", factionId: "faction-2" })],
  ]
  const result = validateMiniatureBulkImport(lines, resultsByLine)
  assert.equal(result.success, false)
  if (result.success) return
  assert.equal(result.error, "Imported Miniatures must all belong to the same faction")
  assert.deepEqual(result.issues, [{ index: 1, name: "Boyz", reason: "faction_conflict" }])
})

test("validateMiniatureBulkImport: does not create the import when any line fails (partial import safety)", () => {
  const lines: ParsedMiniatureImportLine[] = [
    { name: "Intercessors", quantity: 5 },
    { name: "Unknown Unit", quantity: 1 },
  ]
  const resultsByLine = [[catalogResult()], []]
  const result = validateMiniatureBulkImport(lines, resultsByLine)
  assert.equal(result.success, false)
  if (result.success) return
  // Only the failing line is reported; the resolvable line is not silently imported.
  assert.deepEqual(result.issues, [{ index: 1, name: "Unknown Unit", reason: "unresolved" }])
})

test("validateMiniatureBulkImport: resolves catalogId as unit_id identity, preserving quantity as model_count", () => {
  const lines: ParsedMiniatureImportLine[] = [{ name: "Intercessors", quantity: 5 }]
  const result = validateMiniatureBulkImport(lines, [[catalogResult({ catalogId: "canonical-unit-id" })]])
  assert.equal(result.success, true)
  if (!result.success) return
  assert.deepEqual(result.rows, [
    { name: "Intercessors", catalogId: "canonical-unit-id", factionId: "faction-1", modelCount: 5 },
  ])
})

test("validateMiniatureBulkImport: two lines resolving to the same catalogId remain separate rows", () => {
  const lines: ParsedMiniatureImportLine[] = [
    { name: "Intercessors", quantity: 5 },
    { name: "Intercessors", quantity: 3 },
  ]
  const resultsByLine = [[catalogResult({ catalogId: "unit-1" })], [catalogResult({ catalogId: "unit-1" })]]
  const result = validateMiniatureBulkImport(lines, resultsByLine)
  assert.equal(result.success, true)
  if (!result.success) return
  assert.equal(result.rows.length, 2)
  assert.deepEqual(result.rows.map((row) => row.catalogId), ["unit-1", "unit-1"])
})

test("validateMiniatureBulkImport: empty import is rejected", () => {
  const result = validateMiniatureBulkImport([], [])
  assert.deepEqual(result, { success: false, error: "No Miniatures to import", issues: [] })
})
