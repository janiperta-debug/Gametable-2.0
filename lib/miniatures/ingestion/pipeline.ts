import { diffCandidates, type ExistingCatalogItem } from "./diff"
import { normalizeCandidate } from "./normalize"
import { validateCandidates } from "./validate"
import type { MiniCatalogAdapter, MiniCatalogCandidate } from "./types"

export interface IngestionResult {
  discovered: number
  accepted: number
  rejected: number
  candidates: MiniCatalogCandidate[]
  rejectedCandidates: Array<{ candidate: MiniCatalogCandidate; reason: string }>
  diff: ReturnType<typeof diffCandidates>
}

export function runIngestion<TInput>(
  adapter: MiniCatalogAdapter<TInput>,
  input: TInput,
  existing: ExistingCatalogItem[] = [],
): IngestionResult {
  const extracted = adapter.extract(input)
  const normalized = extracted.map(normalizeCandidate)
  const validation = validateCandidates(normalized)

  return {
    discovered: extracted.length,
    accepted: validation.valid.length,
    rejected: validation.rejected.length,
    candidates: validation.valid,
    rejectedCandidates: validation.rejected,
    diff: diffCandidates(validation.valid, existing),
  }
}
