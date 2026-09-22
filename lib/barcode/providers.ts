import { XMLParser } from "fast-xml-parser"

export type BarcodeProviderResult = {
  provider: "gameupc" | "openlibrary"
  externalGameId: string | null
  name: string | null
  year: number | null
  thumbnail: string | null
  sourceUrl: string | null
  confidence: number | null
}

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim()
  return null
}

function firstNumber(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export async function lookupGameUpc(barcode: string): Promise<BarcodeProviderResult | null> {
  try {
    const response = await fetch(
      "https://api.gameupc.com/test/upc/" + encodeURIComponent(barcode),
      { headers: { Accept: "application/json" }, cache: "no-store" },
    )

    if (!response.ok) return null

    const data = await response.json() as Record<string, unknown>
    const rawInfo = data.bgg_info
    const info = Array.isArray(rawInfo) ? rawInfo : rawInfo ? [rawInfo] : []
    const first = info[0] as Record<string, unknown> | undefined
    const status = firstString(data.bgg_info_status)
    const externalGameId = firstString(first?.id)

    // GameUPC can return a usable BGG id even when its status field is not
    // exactly "verified". The id itself is the useful resolver result, so do
    // not discard it solely because of that status label.
    return {
      provider: "gameupc",
      externalGameId: externalGameId || (status === "verified" ? firstString(data.bgg_id) : null),
      name: firstString(first?.name) || firstString(data.name),
      year: null,
      thumbnail: firstString(first?.thumbnail_url),
      sourceUrl: firstString(first?.page_url),
      confidence: firstNumber(first?.confidence),
    }
  } catch (error) {
    console.error("GameUPC lookup failed:", error)
    return null
  }
}

export async function lookupOpenLibraryIsbn(isbn: string): Promise<BarcodeProviderResult | null> {
  try {
    const response = await fetch(
      "https://openlibrary.org/isbn/" + encodeURIComponent(isbn) + ".json",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "GameTable/2.0 (barcode lookup)",
        },
        cache: "no-store",
      },
    )

    if (!response.ok) return null

    const data = await response.json() as Record<string, unknown>
    const title = firstString(data.title)
    const publishDate = firstString(data.publish_date)
    const yearMatch = publishDate?.match(/(19|20)\d{2}/)

    const covers = data.covers
    const coverId = Array.isArray(covers) ? firstNumber(covers[0]) : null
    const thumbnail = coverId
      ? "https://covers.openlibrary.org/b/id/" + coverId + "-M.jpg"
      : null

    const key = firstString(data.key)

    return {
      provider: "openlibrary",
      externalGameId: null,
      name: title,
      year: yearMatch ? Number(yearMatch[0]) : null,
      thumbnail,
      sourceUrl: key ? "https://openlibrary.org" + key : null,
      confidence: title ? 100 : null,
    }
  } catch (error) {
    console.error("Open Library ISBN lookup failed:", error)
    return null
  }
}

export async function lookupBarcodeProvider(
  barcode: string,
  barcodeType: string,
): Promise<BarcodeProviderResult | null> {
  if (barcodeType === "isbn10" || barcodeType === "isbn13") {
    return lookupOpenLibraryIsbn(barcode)
  }

  if (barcodeType === "upc" || barcodeType === "ean8" || barcodeType === "ean13") {
    return lookupGameUpc(barcode)
  }

  return null
}

export function parseBggThingId(xmlText: string): string | null {
  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" })
    const result = parser.parse(xmlText) as Record<string, any>
    const item = Array.isArray(result.items?.item) ? result.items.item[0] : result.items?.item
    return firstString(item?.["@_id"])
  } catch {
    return null
  }
}
