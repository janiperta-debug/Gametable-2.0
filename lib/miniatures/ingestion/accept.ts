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

    if (
      candidate.itemType === "character" &&
      candidate.systemCode === "marvel_crisis_protocol"
    ) {
      return {
        candidate,
        action: "create_unit",
        // MCP characters can belong to several affiliations. The canonical
        // mini_units schema currently has one required faction_id, so keep
        // the unit under a neutral character group and retain all
        // affiliations in sourcePayload/keywords.
        factionName: "Characters",
      }
    }

    return {
      candidate,
      action: "create_unit",
      factionName: candidate.groupName,
    }
  })
}
