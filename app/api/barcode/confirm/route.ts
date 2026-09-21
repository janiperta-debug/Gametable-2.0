import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type BarcodeCategory = "board_game" | "rpg"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const barcode = typeof body.barcode === "string" ? body.barcode.replace(/[\s-]/g, "").trim() : ""
    const category = body.category as BarcodeCategory | undefined
    const externalGameId =
      typeof body.externalGameId === "string" ? body.externalGameId.trim() : ""

    if (!/^\d{8}$|^\d{10}$|^\d{12}$|^\d{13}$/.test(barcode)) {
      return NextResponse.json({ error: "Unsupported barcode format" }, { status: 400 })
    }

    if (category !== "board_game" && category !== "rpg") {
      return NextResponse.json({ error: "Category must be board_game or rpg" }, { status: 400 })
    }

    if (!externalGameId) {
      return NextResponse.json({ error: "externalGameId is required" }, { status: 400 })
    }

    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const service = createServiceClient()

    const { data: existing } = await service
      .from("barcode_mappings")
      .select("barcode, category, external_game_id, confirmed_by_user")
      .eq("barcode", barcode)
      .eq("category", category)
      .maybeSingle()

    if (existing && existing.external_game_id !== externalGameId) {
      return NextResponse.json(
        { error: "This barcode is already mapped to another game" },
        { status: 409 },
      )
    }

    const { data, error } = await service
      .from("barcode_mappings")
      .upsert(
        {
          barcode,
          barcode_type:
            barcode.length === 13
              ? barcode.startsWith("978") || barcode.startsWith("979") ? "isbn13" : "ean13"
              : barcode.length === 12
                ? "upc"
                : barcode.length === 10
                  ? "isbn10"
                  : "ean8",
          category,
          external_game_id: externalGameId,
          confirmed_by_user: true,
          confirmed_by: user.id,
        },
        { onConflict: "barcode,category" },
      )
      .select("barcode, barcode_type, category, external_game_id, confirmed_by_user")
      .single()

    if (error) {
      console.error("Barcode mapping confirmation failed:", error)
      return NextResponse.json({ error: "Could not save barcode mapping" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      mapping: data,
    })
  } catch (error) {
    console.error("Barcode mapping confirmation error:", error)
    return NextResponse.json({ error: "Invalid confirmation request" }, { status: 400 })
  }
}
