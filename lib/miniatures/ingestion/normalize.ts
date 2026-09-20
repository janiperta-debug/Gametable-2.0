import type { MiniCatalogCandidate } from "./types"

export function normalizeName(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
}

export function normalizeKey(candidate: MiniCatalogCandidate): string {
  const system = normalizeName(candidate.systemCode).toLowerCase()
  const group = normalizeName(candidate.groupName ?? "").toLowerCase()
  const product = normalizeName(candidate.productCode ?? "").toLowerCase()
  const name = normalizeName(candidate.name).toLowerCase()

  return [system, group, product, name].filter(Boolean).join(":")
}

export function normalizeCandidate(candidate: MiniCatalogCandidate): MiniCatalogCandidate {
  const media = candidate.media
    ? {
        imageUrl: candidate.media.imageUrl?.trim() || undefined,
        imageSourceUrl: candidate.media.imageSourceUrl?.trim() || undefined,
      }
    : undefined

  return {
    ...candidate,
    externalId: candidate.externalId?.trim() || undefined,
    systemCode: normalizeName(candidate.systemCode),
    systemName: normalizeName(candidate.systemName),
    edition: candidate.edition ? normalizeName(candidate.edition) : undefined,
    groupName: candidate.groupName ? normalizeName(candidate.groupName) : undefined,
    name: normalizeName(candidate.name),
    productCode: candidate.productCode ? normalizeName(candidate.productCode) : undefined,
    productName: candidate.productName ? normalizeName(candidate.productName) : undefined,
    sourceName: normalizeName(candidate.sourceName),
    sourceUrl: candidate.sourceUrl.trim(),
    media: media && (media.imageUrl || media.imageSourceUrl) ? media : undefined,
  }
}
