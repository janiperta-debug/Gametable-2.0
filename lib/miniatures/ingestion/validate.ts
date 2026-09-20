import type { MiniCatalogCandidate } from "./types"

export interface ValidationResult {
  valid: MiniCatalogCandidate[]
  rejected: Array<{ candidate: MiniCatalogCandidate; reason: string }>
}

export function validateCandidates(candidates: MiniCatalogCandidate[]): ValidationResult {
  const valid: MiniCatalogCandidate[] = []
  const rejected: Array<{ candidate: MiniCatalogCandidate; reason: string }> = []

  for (const candidate of candidates) {
    if (!candidate.systemCode.trim()) {
      rejected.push({ candidate, reason: "Missing system code" })
      continue
    }

    if (!candidate.systemName.trim()) {
      rejected.push({ candidate, reason: "Missing system name" })
      continue
    }

    if (!candidate.name.trim()) {
      rejected.push({ candidate, reason: "Missing item name" })
      continue
    }

    if (!candidate.sourceUrl.trim()) {
      rejected.push({ candidate, reason: "Missing source URL" })
      continue
    }

    valid.push(candidate)
  }

  return { valid, rejected }
}
