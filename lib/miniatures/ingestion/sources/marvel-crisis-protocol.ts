import type {
  MiniCatalogAdapter,
  MiniCatalogCandidate,
  MiniCatalogSource,
} from "../types"

const source: MiniCatalogSource = {
  code: "marvel-crisis-protocol-atomic-mass-games",
  name: "Marvel: Crisis Protocol — Atomic Mass Games",
  systemCode: "marvel_crisis_protocol",
  sourceType: "html",
  publisher: "Atomic Mass Games",
  sourceUrl: "https://www.atomicmassgames.com/assembly/",
}

export const marvelCrisisProtocolAdapter: MiniCatalogAdapter<string> = {
  source,

  extract(html: string): MiniCatalogCandidate[] {
    // The official assembly index is intentionally treated as the product
    // directory. Character-level extraction is kept conservative until a
    // product page explicitly exposes its "What's Included" list.
    const candidates: MiniCatalogCandidate[] = []
    const productPattern = /\b(CP\d+)\b[^<\n]{0,160}/gi

    for (const match of html.matchAll(productPattern)) {
      const productCode = match[1]?.toUpperCase()
      if (!productCode) continue

      const productName = (match[0] ?? "")
        .replace(productCode, "")
        .replace(/^[\s:–—-]+/, "")
        .trim()

      if (!productName) continue

      candidates.push({
        externalId: productCode,
        systemCode: source.systemCode,
        systemName: "Marvel: Crisis Protocol",
        productCode,
        productName,
        name: productName,
        itemType: "product",
        sourceName: source.name,
        sourceUrl: source.sourceUrl,
      })
    }

    return candidates
  },
}
