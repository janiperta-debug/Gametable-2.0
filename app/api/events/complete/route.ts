import { NextRequest, NextResponse } from "next/server"
import { completeEvent } from "@/app/actions/events-core"
import { awardPersonalTrophies } from "@/app/actions/personal-trophies"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (typeof body.eventId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.eventId)) {
      return NextResponse.json({ success: false, error: "Invalid event ID" }, { status: 400 })
    }
    const championEntryId = typeof body.championEntryId === "string" ? body.championEntryId : undefined
    const result = await completeEvent(body.eventId, championEntryId)
    if (result.success && Array.isArray(body.awardRecipients) && body.awardRecipients.length > 0) {
      const recipients = body.awardRecipients
      if (recipients.length > 3 || recipients.some((id: unknown) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)))
        return NextResponse.json({ success: true, awardError: "Invalid award recipients" })
      const award = await awardPersonalTrophies("tournament", body.eventId, recipients)
      if (!award.success) return NextResponse.json({ success: true, awardError: award.error })
    }
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    console.error("Event completion API failed:", error)
    return NextResponse.json({ success: false, error: "The server could not complete the event. Please try again." }, { status: 500 })
  }
}
