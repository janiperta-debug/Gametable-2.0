import { NextRequest, NextResponse } from "next/server"
import { XMLParser } from "fast-xml-parser"
import { createClient } from "@/lib/supabase/server"
import { lookupBarcodeProvider } from "@/lib/barcode/providers"

type BarcodeCategory = "board_game" | "rpg"

const BARCODE_TYPES = new Set(["ean13", "ean8", "upc", "isbn10", "isbn13", "ean"])
const BGG_API_TOKEN = process.env.BGG_API_TOKEN

function normalizeBarcode(value: string): string {
  return value.replace(/[\s-]/g, "").trim()
}

function inferBarcodeType(barcode: string): string {
  if (/^\d{13}$/.test(barcode)) {
    return barcode.startsWith("978") || barcode.startsWith("979") ? "isbn13" : "ean13"
  }
  if (/^\d{10}$/.test(barcode)) return "isbn10"
  if (/^\d{12}$/.test(barcode)) return "upc"
  if (/^\d{8}$/.test(barcode)) return "ean8"
  return "ean"
}

function isValidBarcode(barcode: string): boolean {
  return /^(?:\d{8}|\d{10}|\d{12}|\d{13})$/.test(barcode)
}

async function resolveBggByName(name: string): Promise<{ id: string; name: string } | null> {
  try {
    const headers: Record<string, string> = { Accept: "application/xml, text/xml, */*" }
    if (BGG_API_TOKEN) headers.Authorization = `Bearer ${BGG_API_TOKEN}`

    const response = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(name)}&type=boardgame`,
      { headers, cache: "no-store" },
    )

    if (!response.ok) return null

    const xmlText = await response.text()
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" })
    const parsed = parser.parse(xmlText) as Record<string, any>
    const items = Array.isArray(parsed.items?.item)
      ? parsed.items.item
      : parsed.items?.item
        ? [parsed.items.item]
        : []

    const first = items[0] as Record<string, any> | undefined
    if (!first?.["@_id"]) return null

    const nameData = first.name
    let resolvedName = name
    if (Array.isArray(nameData)) {
      const primary = nameData.find((item: Record<string, unknown>) => item["@_type"] === "primary")
      resolvedName = String(primary?.["@_value"] || nameData[0]?.["@_value"] || name)
    } else if (nameData && typeof nameData === "object") {
      resolvedName = String(nameData["@_value"] || name)
    }

    return { id: String(first["@_id"]), name: resolvedName }
  } catch (error) {
    console.error("BGG barcode name resolution failed:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rawBarcode = searchParams.get("barcode")
  const category = searchParams.get("category") as BarcodeCategory | null

  if (!rawBarcode) {
    return NextResponse.json({ error: "Barcode parameter is required" }, { status: 400 })
  }

  if (category !== "board_game" && category !== "rpg") {
    return NextResponse.json({ error: "Category must be board_game or rpg" }, { status: 400 })
  }

  const barcode = normalizeBarcode(rawBarcode)
  if (!isValidBarcode(barcode)) {
    return NextResponse.json({ error: "Unsupported barcode format" }, { status: 400 })
  }

  const barcodeType = inferBarcodeType(barcode)
  if (!BARCODE_TYPES.has(barcodeType)) {
    return NextResponse.json({ error: "Unsupported barcode type" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    const { data: mapping, error } = await supabase
      .from("barcode_mappings")
      .select("barcode, barcode_type, category, external_game_id, confirmed_by_user")
      .eq("barcode", barcode)
      .eq("category", category)
      .maybeSingle()

    if (error) {
      console.error("Barcode mapping lookup failed:", error)
      return NextResponse.json({ error: "Barcode resolver temporarily unavailable" }, { status: 503 })
    }

    if (mapping) {
      return NextResponse.json({
        resolved: true,
        source: "mapping",
        barcode: mapping.barcode,
        barcodeType: mapping.barcode_type,
        category: mapping.category,
        externalGameId: mapping.external_game_id,
        confirmedByUser: mapping.confirmed_by_user,
      })
    }

    const provider = await lookupBarcodeProvider(barcode, barcodeType)

    if (provider?.externalGameId) {
      return NextResponse.json({
        resolved: true,
        source: provider.provider,
        barcode,
        barcodeType,
        category,
        externalGameId: provider.externalGameId,
        name: provider.name,
        thumbnail: provider.thumbnail,
        sourceUrl: provider.sourceUrl,
        confidence: provider.confidence,
        confirmedByUser: false,
      })
    }

    if (provider?.name) {
      const { data: catalogMatch, error: catalogError } = await supabase
        .from("games")
        .select("bgg_id, name, year, thumbnail_url")
        .eq("category", category)
        .ilike("name", provider.name)
        .limit(1)
        .maybeSingle()

      if (catalogError) {
        console.error("Barcode catalog match failed:", catalogError)
      }

      if (catalogMatch?.bgg_id) {
        return NextResponse.json({
          resolved: true,
          source: provider.provider,
          barcode,
          barcodeType,
          category,
          externalGameId: String(catalogMatch.bgg_id),
          name: catalogMatch.name,
          year: catalogMatch.year,
          thumbnail: catalogMatch.thumbnail_url || provider.thumbnail,
          sourceUrl: provider.sourceUrl,
          confidence: provider.confidence,
          confirmedByUser: false,
        })
      }

      // The provider can identify the game by name even when the game is not
      // already present in our local catalog. Resolve that name against BGG here
      // so the barcode flow can continue without relying on the client-side
      // search state after the scanner closes.
      if (category === "board_game") {
        const bggMatch = await resolveBggByName(provider.name)
        if (bggMatch) {
          return NextResponse.json({
            resolved: true,
            source: "bgg-name-search",
            barcode,
            barcodeType,
            category,
            externalGameId: bggMatch.id,
            name: bggMatch.name,
            thumbnail: provider.thumbnail,
            sourceUrl: provider.sourceUrl,
            confidence: provider.confidence,
            confirmedByUser: false,
          })
        }
      }
    }

    return NextResponse.json(
      {
        resolved: false,
        source: provider?.provider || null,
        barcode,
        barcodeType,
        category,
        providerResult: provider
          ? {
              name: provider.name,
              year: provider.year,
              thumbnail: provider.thumbnail,
              sourceUrl: provider.sourceUrl,
              confidence: provider.confidence,
            }
          : null,
        fallback: "name_search",
        suggestedQuery: provider?.name || null,
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("Barcode resolver error:", error)
    return NextResponse.json({ error: "Failed to resolve barcode" }, { status: 500 })
  }
}
