export type MiniCatalogSourceType = "html" | "pdf" | "json" | "manual"

export type MiniCatalogCandidateStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "unchanged"

export interface MiniCatalogMedia {
  imageUrl?: string
  imageSourceUrl?: string
}

export interface MiniCatalogCandidate {
  externalId?: string
  systemCode: string
  systemName: string
  edition?: string
  groupName?: string
  name: string
  itemType: "unit" | "character" | "team" | "product"
  productCode?: string
  productName?: string
  sourceName: string
  sourceUrl: string
  /**
   * Optional presentation media supplied by the source adapter.
   * The catalog remains fully usable when media is unavailable.
   */
  media?: MiniCatalogMedia
  sourcePayload?: Record<string, unknown>
}

export interface MiniCatalogSource {
  code: string
  name: string
  systemCode: string
  sourceType: MiniCatalogSourceType
  publisher: string
  sourceUrl: string
}

export interface MiniCatalogAdapter<TInput = string> {
  source: MiniCatalogSource
  extract(input: TInput): MiniCatalogCandidate[]
}

export interface MiniCatalogDiff {
  key: string
  status: "new" | "changed" | "unchanged"
  candidate: MiniCatalogCandidate
  existing?: {
    id: string
    name: string
  }
}
