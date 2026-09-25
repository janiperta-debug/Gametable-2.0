import { NextRequest, NextResponse } from "next/server"
import { completeEvent } from "@/app/actions/events-core"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (typeof body.eventId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.eventId)) {
      return NextResponse.json({ success: false, error: "Invalid event ID" }, { status: 400 })
    }
    const championEntryId = typeof body.championEntryId === "string" ? body.championEntryId : undefined
    const result = await completeEvent(body.eventId, championEntryId)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error("Event completion API failed:", error)
    return NextResponse.json({ success: false, error: "The server could not complete the event. Please try again." }, { status: 500 })
  }
}
