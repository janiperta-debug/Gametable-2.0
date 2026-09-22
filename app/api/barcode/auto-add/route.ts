import { NextRequest, NextResponse } from "next/server"
import { addGameToCollection } from "@/app/actions/games"

type BarcodeCategory = "board_game" | "rpg"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const barcode = typeof body.barcode === "string" ? body.barcode.trim() : ""
    const category = body.category as BarcodeCategory

    if (!barcode) {
      return NextResponse.json({ error: "Barcode is required" }, { status: 400 })
    }

    if (category !== "board_game" && category !== "rpg") {
      return NextResponse.json({ error: "Unsupported category" }, { status: 400 })
    }

    // Reuse the existing resolver so mappings/provider fallbacks stay in one place.
    const resolveUrl = new URL("/api/barcode/resolve", request.url)
    resolveUrl.searchParams.set("barcode", barcode)
    resolveUrl.searchParams.set("category", category)

    const resolvedResponse = await fetch(resolveUrl, { cache: "no-store" })
    const resolved = await resolvedResponse.json()

    if (!resolvedResponse.ok || !resolved.resolved || !resolved.externalGameId) {
      return NextResponse.json(
        { success: false, resolved: false, ...resolved },
        { status: resolvedResponse.status || 404 },
      )
    }

    // The resolver only identifies the external ID. Fetch the same full details
    // that the normal Add Game flow uses before writing the collection row.
    const detailsPath = category === "board_game" ? "/api/bgg/details" : "/api/rpgg/details"
    const detailsUrl = new URL(detailsPath, request.url)
    detailsUrl.searchParams.set("id", String(resolved.externalGameId))

    const detailsResponse = await fetch(detailsUrl, { cache: "no-store" })
    const details = await detailsResponse.json()

    if (!detailsResponse.ok || !details?.id || !details?.name) {
      return NextResponse.json(
        { success: false, error: details?.error || "Game details could not be loaded" },
        { status: detailsResponse.status || 502 },
      )
    }

    const result = await addGameToCollection(details, "owned", category)

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error, game: details },
        { status: 409 },
      )
    }

    return NextResponse.json({
      success: true,
      resolved: true,
      source: resolved.source,
      game: {
        id: details.id,
        name: details.name,
      },
    })
  } catch (error) {
    console.error("Barcode auto-add error:", error)
    return NextResponse.json(
      { success: false, error: "Barcode could not be added to the collection" },
      { status: 500 },
    )
  }
}
