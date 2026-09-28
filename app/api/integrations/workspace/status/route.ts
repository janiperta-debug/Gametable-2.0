import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: NextRequest) {
  const secret = process.env.WORKSPACE_INTEGRATION_SECRET
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const db = createServiceClient()
    const [users, events] = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }),
      db.from("events").select("id", { count: "exact", head: true })
        .eq("status", "upcoming").gte("starts_at", new Date().toISOString())
    ])
    if (users.error || events.error) throw new Error("Query failed")
    return NextResponse.json({
      product: "GameTable", checkedAt: new Date().toISOString(),
      registeredUsers: users.count, upcomingEvents: events.count
    }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ error: "Status unavailable" }, { status: 503 })
  }
}
