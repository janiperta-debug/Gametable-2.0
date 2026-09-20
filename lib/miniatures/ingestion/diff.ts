import { normalizeKey } from "./normalize"
import type { MiniCatalogCandidate, MiniCatalogDiff } from "./types"

export interface ExistingCatalogItem {
  id: string
  name: string
  systemCode: string
  groupName?: string
  productCode?: string
}

export function diffCandidates(
  candidates: MiniCatalogCandidate[],
  existing: ExistingCatalogItem[],
): MiniCatalogDiff[] {
  const existingByKey = new Map(
    existing.map((item) => [
      normalizeKey({
        externalId: undefined,
        systemCode: item.systemCode,
        systemName: "",
        groupName: item.groupName,
        name: item.name,
        itemType: "unit",
        productCode: item.productCode,
        sourceName: "",
        sourceUrl: "",
      }),
      item,
    ]),
  )

  return candidates.map((candidate) => {
    const key = normalizeKey(candidate)
    const match = existingByKey.get(key)

    return {
      key,
      status: match ? "unchanged" : "new",
      candidate,
      existing: match ? { id: match.id, name: match.name } : undefined,
    }
  })
}
