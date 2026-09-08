// WP-004H: Miniatures Migration Closure.
//
// Production currently has zero mini_armies and zero mini_army_units rows
// (verified 2026-09-08), so there is no legacy ownership data to migrate.
// This module exists only to enforce the migration-safety invariant for any
// FUTURE legacy source that might appear: no legacy Miniatures ownership row
// is ever silently transformed into a mini_army_units insert unless every
// required piece of production-shaped information is present. Ambiguous,
// missing, or incompatible information is reported as an issue - never
// guessed, never defaulted, and never used to fabricate a catalog row,
// Army, or ownership relationship.
//
// This does NOT implement a real migration (there is no source table to read
// from), and does NOT implement the future Army Roster Import.

export interface LegacyMiniatureOwnershipCandidate {
  userId?: string | null
  // Must be a real mini_units.id (canonical catalogId). Legacy `external_id`
  // values and display names are never accepted here.
  catalogId?: string | null
  catalogFactionId?: string | null
  armyId?: string | null
  armyFactionId?: string | null
  owned?: boolean | null
  modelCount?: number | null
  paintStatus?: string | null
}

export type MigrationIssueReason =
  | "missing_user"
  | "missing_catalog_id"
  | "missing_army"
  | "missing_faction"
  | "incompatible_faction"
  | "invalid_model_count"

export interface MigrationRowIssue {
  index: number
  reason: MigrationIssueReason
}

export interface MigrationReadyRow {
  userId: string
  catalogId: string
  armyId: string
  owned: boolean
  modelCount: number
  paintStatus: string | null
}

export type MigrationValidationResult =
  | { success: true; rows: MigrationReadyRow[] }
  | { success: false; issues: MigrationRowIssue[] }

// Validates candidate legacy rows against the production ownership contract.
// Never invents a catalogId, Army, or user - every required field must
// already be present and internally consistent (faction-compatible).
export function validateLegacyMiniatureOwnershipCandidates(
  rows: LegacyMiniatureOwnershipCandidate[],
): MigrationValidationResult {
  const issues: MigrationRowIssue[] = []
  const ready: MigrationReadyRow[] = []

  rows.forEach((row, index) => {
    if (!row.userId) {
      issues.push({ index, reason: "missing_user" })
      return
    }
    // Legacy identity (display name, external_id) is never a substitute for
    // a real canonical mini_units.id.
    if (!row.catalogId) {
      issues.push({ index, reason: "missing_catalog_id" })
      return
    }
    if (!row.armyId) {
      issues.push({ index, reason: "missing_army" })
      return
    }
    if (!row.catalogFactionId || !row.armyFactionId) {
      issues.push({ index, reason: "missing_faction" })
      return
    }
    if (row.catalogFactionId !== row.armyFactionId) {
      issues.push({ index, reason: "incompatible_faction" })
      return
    }
    if (!Number.isInteger(row.modelCount) || (row.modelCount as number) < 1) {
      issues.push({ index, reason: "invalid_model_count" })
      return
    }

    ready.push({
      userId: row.userId,
      catalogId: row.catalogId,
      armyId: row.armyId,
      owned: row.owned === true,
      modelCount: row.modelCount as number,
      paintStatus: row.paintStatus ?? null,
    })
  })

  if (issues.length > 0) return { success: false, issues }
  return { success: true, rows: ready }
}

export interface MigrationRunResult {
  success: boolean
  migratedCount: number
  issues: MigrationRowIssue[]
}

// Deterministic no-op-safe migration runner: given zero source rows (the
// current, verified production state), this never invents Army or
// ownership records - it simply migrates nothing. Given source rows, it
// only "migrates" (i.e. returns as ready-to-insert) rows that pass full
// validation; anything else is reported, never guessed.
export function planLegacyMiniatureOwnershipMigration(
  sourceRows: LegacyMiniatureOwnershipCandidate[],
): MigrationRunResult {
  if (sourceRows.length === 0) {
    return { success: true, migratedCount: 0, issues: [] }
  }

  const validation = validateLegacyMiniatureOwnershipCandidates(sourceRows)
  if (!validation.success) {
    return { success: false, migratedCount: 0, issues: validation.issues }
  }

  return { success: true, migratedCount: validation.rows.length, issues: [] }
}
