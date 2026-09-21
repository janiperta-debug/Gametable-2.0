import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type BarcodeCategory = "board_game" | "rpg"

const BARCODE_TYPES = new Set([
  "ean13",
  "ean8",
  "upc",
  "isbn10",
  "isbn13",
  "ean",
])

function normalizeBarcode(value: string): string {
  return value.replace(/[\s-]/g, "").trim()
}

function inferBarcodeType(barcode: string): string {
  if (/^\d{13}$/.test(barcode)) {
    // ISBN-13 normally starts with 978 or 979. Otherwise treat it as EAN-13.
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rawBarcode = searchParams.get("barcode")
  const category = searchParams.get("category") as BarcodeCategory | null

  if (!rawBarcode) {
    return NextResponse.json({ error: "Barcode parameter is required" }, { status: 400 })
  }

  if (category !== "board_game" && category !== "rpg") {
    return NextResponse.json(
      { error: "Category must be board_game or rpg" },
      { status: 400 },
    )
  }

  const barcode = normalizeBarcode(rawBarcode)

  if (!isValidBarcode(barcode)) {
    return NextResponse.json(
      { error: "Unsupported barcode format" },
      { status: 400 },
    )
  }

  const barcodeType = inferBarcodeType(barcode)

  if (!BARCODE_TYPES.has(barcodeType)) {
    return NextResponse.json(
      { error: "Unsupported barcode type" },
      { status: 400 },
    )
  }

  try {
    const supabase = await createClient()

    // First resolver layer: GameTable's own confirmed/shared mappings.
    const { data: mapping, error } = await supabase
      .from("barcode_mappings")
      .select("barcode, barcode_type, category, external_game_id, confirmed_by_user")
      .eq("barcode", barcode)
      .eq("category", category)
      .maybeSingle()

    if (error) {
      console.error("Barcode mapping lookup failed:", error)
      return NextResponse.json(
        { error: "Barcode resolver temporarily unavailable" },
        { status: 503 },
      )
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

    // External barcode providers are deliberately not called from the UI.
    // WP-BARCODE-05 will plug an approved provider adapter into this resolver.
    return NextResponse.json(
      {
        resolved: false,
        source: null,
        barcode,
        barcodeType,
        category,
        fallback: "name_search",
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("Barcode resolver error:", error)
    return NextResponse.json(
      { error: "Failed to resolve barcode" },
      { status: 500 },
    )
  }
}
