import type { MiniatureSearchResult } from "@/app/api/miniatures/catalog"

// WP-004G: Miniatures Bulk Import is a COLLECTION MASS-ADD flow. Every
// successfully resolved row from an import represents physical ownership
// (owned = true) and requires an Army context because mini_army_units.army_id
// is required. This module only resolves/validates parsed import lines - it
// never invents catalog rows, never guesses ambiguous matches, and never
// deduplicates rows that resolve to the same catalog unit.

export interface ParsedMiniatureImportLine {
  name: string
  quantity: number
}

export interface ResolvedMiniatureImportRow {
  name: string
  catalogId: string
  factionId: string
  modelCount: number
}

export type MiniatureImportIssueReason =
  | "invalid_quantity"
  | "unresolved"
  | "ambiguous"
  | "missing_faction"
  | "faction_conflict"

export interface MiniatureImportIssue {
  index: number
  name: string
  reason: MiniatureImportIssueReason
}

export type MiniatureCatalogMatch =
  | { status: "resolved"; catalogId: string; factionId: string }
  | { status: "unresolved" }
  | { status: "ambiguous" }
  | { status: "missing_faction" }

export type MiniatureBulkImportValidation =
  | { success: true; rows: ResolvedMiniatureImportRow[]; factionId: string }
  | { success: false; error: string; issues: MiniatureImportIssue[] }

// Resolves a single parsed line's search results into a canonical catalog
// match. Never selects results[0] when multiple canonical matches exist, and
// never fabricates a catalog id from a name.
export function resolveMiniatureCatalogMatch(
  results: MiniatureSearchResult[] | undefined,
): MiniatureCatalogMatch {
  const list = results ?? []
  if (list.length === 0) return { status: "unresolved" }
  if (list.length > 1) return { status: "ambiguous" }

  const [only] = list
  if (!only.catalogId) return { status: "unresolved" }
  if (!only.factionId) return { status: "missing_faction" }
  return { status: "resolved", catalogId: only.catalogId, factionId: only.factionId }
}

// Validates an entire Miniatures Bulk Import before anything is written.
// `searchResultsByLine[i]` must correspond to the search results for
// `lines[i]`. Duplicate catalog ids across lines are preserved as separate
// rows (no dedup by catalogId/sourceId/name).
export function validateMiniatureBulkImport(
  lines: ParsedMiniatureImportLine[],
  searchResultsByLine: Array<MiniatureSearchResult[] | undefined>,
): MiniatureBulkImportValidation {
  const issues: MiniatureImportIssue[] = []
  const rows: ResolvedMiniatureImportRow[] = []

  lines.forEach((line, index) => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      issues.push({ index, name: line.name, reason: "invalid_quantity" })
      return
    }

    const match = resolveMiniatureCatalogMatch(searchResultsByLine[index])
    if (match.status !== "resolved") {
      issues.push({ index, name: line.name, reason: match.status })
      return
    }

    rows.push({
      name: line.name,
      catalogId: match.catalogId,
      factionId: match.factionId,
      modelCount: line.quantity,
    })
  })

  if (issues.length > 0) {
    return {
      success: false,
      error: `${issues.length} of ${lines.length} imported Miniature${lines.length === 1 ? "" : "s"} could not be resolved to a single canonical catalog match`,
      issues,
    }
  }

  if (rows.length === 0) {
    return { success: false, error: "No Miniatures to import", issues: [] }
  }

  const factionId = rows[0].factionId
  const factionIssues: MiniatureImportIssue[] = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.factionId !== factionId)
    .map(({ row, index }) => ({ index, name: row.name, reason: "faction_conflict" as const }))

  if (factionIssues.length > 0) {
    return {
      success: false,
      error: "Imported Miniatures must all belong to the same faction",
      issues: factionIssues,
    }
  }

  return { success: true, rows, factionId }
}
