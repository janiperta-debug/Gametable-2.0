import type { MiniCatalogCandidate } from "./types"

export interface CanonicalAction {
  candidate: MiniCatalogCandidate
  action: "create_system" | "create_faction" | "create_unit" | "skip"
  reason?: string
  factionName?: string
}

export function planCanonicalAcceptance(
  candidates: MiniCatalogCandidate[],
): CanonicalAction[] {
  return candidates.map((candidate) => {
    if (candidate.itemType === "team") {
      return {
        candidate,
        action: "create_unit",
        factionName: candidate.groupName || candidate.name,
      }
    }

    // Product records are intentionally kept in staging until the source
    // exposes the individual miniatures contained in each product.
    if (candidate.itemType === "product") {
      return {
        candidate,
        action: "skip",
        reason: "Product-level record requires miniature-level contents before canonical acceptance",
      }
    }

    return {
      candidate,
      action: "create_unit",
      factionName: candidate.groupName,
    }
  })
}
