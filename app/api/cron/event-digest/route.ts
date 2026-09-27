import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email"

// Create a service role client for server-side operations
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey)
}

interface EventDigestPrefs {
  enabled: boolean
  frequency: string
  categories: string[]
  max_distance_km: number | null
}

interface UserWithDigest {
  id: string
  notification_email: string | null
  display_name: string | null
  location: string | null
  preferences: Record<string, unknown> | null
  event_digest_prefs: EventDigestPrefs
}

interface Event {
  id: string
  title: string
  description: string | null
  event_type: string
  starts_at: string
  location: string | null
  max_players: number | null
  host: {
    display_name: string | null
  } | null
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) {
    console.error("[Event Digest Cron] Unauthorized request - invalid or missing cron secret")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[Event Digest Cron] Starting weekly event digest job...")

  try {
    const supabase = getServiceClient()

    // 1. Fetch all users who have enabled the event digest
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, notification_email, display_name, location, preferences, event_digest_prefs")
      .eq("email_notifications", true)
      .not("event_digest_prefs", "is", null)

    if (usersError) {
      console.error("[Event Digest Cron] Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Filter users who have enabled digest
    const eligibleUsers = (users as UserWithDigest[]).filter(
      (user) =>
        user.event_digest_prefs?.enabled === true &&
        user.event_digest_prefs?.frequency === "weekly"
    )

    console.log(`[Event Digest Cron] Found ${eligibleUsers.length} users with digest enabled`)

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: "No users with digest enabled", sent: 0 })
    }

    // 2. Fetch all public events starting in the next 7 days
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        event_type,
        starts_at,
        location,
        max_players,
        host:profiles!events_host_id_fkey(display_name)
      `)
      .eq("privacy", "public")
      .eq("status", "upcoming")
      .gte("starts_at", now.toISOString())
      .lte("starts_at", nextWeek.toISOString())
      .order("starts_at", { ascending: true })

    if (eventsError) {
      console.error("[Event Digest Cron] Error fetching events:", eventsError)
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
    }

    console.log(`[Event Digest Cron] Found ${events?.length ?? 0} upcoming public events`)

    if (!events || events.length === 0) {
      return NextResponse.json({ message: "No upcoming events this week", sent: 0 })
    }

    // 3. Send digest to each eligible user
    let sentCount = 0
    let skippedCount = 0

    for (const user of eligibleUsers) {
      const prefs = user.event_digest_prefs

      // Filter events based on user preferences
      let userEvents = events as Event[]

      // Category filter
      if (prefs.categories && prefs.categories.length > 0) {
        userEvents = userEvents.filter((event) =>
          prefs.categories.includes(event.event_type)
        )
      }

      // Distance filtering requires coordinates; do not silently ignore the selected limit.
      if (prefs.max_distance_km != null) {
        const origin = await geocode(user.location)
        if (!origin) { skippedCount++; continue }
        const filtered: Event[] = []
        for (const event of userEvents) {
          const destination = await geocode(event.location)
          if (destination && distanceKm(origin, destination) <= prefs.max_distance_km) filtered.push(event)
        }
        userEvents = filtered
      }

      // Skip if no matching events
      if (userEvents.length === 0) {
        skippedCount++
        continue
      }

      // Generate and send email
      const authUser = user.notification_email ? null : await supabase.auth.admin.getUserById(user.id)
      const email = user.notification_email || authUser?.data.user?.email
      if (!email) { skippedCount++; continue }
      const locale = typeof user.preferences?.language === "string" ? user.preferences.language : "en"
      const { subject, html } = getEventDigestEmailTemplate(userEvents, user.display_name, locale)

      const result = await sendEmail({
        to: email,
        subject,
        html,
      })

      if (result.success) {
        sentCount++
        console.log(`[Event Digest Cron] Sent digest to ${email} with ${userEvents.length} events`)
      } else {
        console.error(`[Event Digest Cron] Failed to send to ${email}:`, result.error)
      }
    }

    console.log(`[Event Digest Cron] Completed: ${sentCount} sent, ${skippedCount} skipped (no matching events)`)

    return NextResponse.json({
      message: "Event digest cron completed",
      sent: sentCount,
      skipped: skippedCount,
      totalUsers: eligibleUsers.length,
      totalEvents: events.length,
    })
  } catch (error) {
    console.error("[Event Digest Cron] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Email template for event digest
function getEventDigestEmailTemplate(events: Event[], userName: string | null, locale: string) {
  const fi = locale.toLowerCase().startsWith("fi")
  const tr = (en: string, finnish: string) => fi ? finnish : en
  const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\x27/g, "&#39;")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gametable.fi"
  const greeting = userName ? `${tr("Hello", "Hei")} ${escapeHtml(userName)}` : tr("Hello", "Hei")

  const eventTypeLabels: Record<string, string> = {
    game_night: "Game Night",
    campaign: "Campaign",
    tournament: "Tournament",
    league: "League",
  }

  const eventListHtml = events
    .map((event) => {
      const eventDate = new Date(event.starts_at)
      const dateStr = eventDate.toLocaleDateString(fi ? "fi-FI" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
      const timeStr = eventDate.toLocaleTimeString(fi ? "fi-FI" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
      const hostName = event.host?.display_name || "Anonymous"
      const eventType = eventTypeLabels[event.event_type] || event.event_type

      return `
        <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #fafafa;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h3 style="margin: 0; color: #1a1a1a; font-size: 18px;">${escapeHtml(event.title)}</h3>
            <span style="background: #d4af37; color: #1a1a1a; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${eventType}
            </span>
          </div>
          <p style="margin: 8px 0; color: #666; font-size: 14px;">
            <strong>${tr("When:", "Milloin:")}</strong> ${dateStr} at ${timeStr}
          </p>
          <p style="margin: 8px 0; color: #666; font-size: 14px;">
            <strong>${tr("Host:", "Järjestäjä:")}</strong> ${hostName}
          </p>
          ${event.location ? `<p style="margin: 8px 0; color: #666; font-size: 14px;"><strong>${tr("Where:", "Missä:")}</strong> ${escapeHtml(event.location)}</p>` : ""}
          <a href="${appUrl}/events/${event.id}" 
             style="display: inline-block; background: #d4af37; color: #1a1a1a; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 8px; font-size: 14px;">
            ${tr("View Event", "Näytä tapahtuma")}
          </a>
        </div>
      `
    })
    .join("")

  return {
    subject: fi ? `GameTable — ${events.length} tapahtumaa tällä viikolla` : `GameTable — ${events.length} event${events.length > 1 ? "s" : ""} this week`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #3d1a24 0%, #5a2d3a 100%); padding: 32px; text-align: center;">
          <h1 style="color: #d4af37; margin: 0; font-size: 28px;">${tr("Upcoming Events This Week", "Tulevan viikon tapahtumat")}</h1>
          <p style="color: #f5f5f5; margin-top: 8px; font-size: 16px;">${tr("Your curated event digest from GameTable", "GameTablen viikoittainen tapahtumakooste")}</p>
        </div>
        
        <div style="padding: 24px;">
          <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px;">
            ${greeting},
          </p>
          <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
            ${tr("Here are the upcoming events in your gaming community this week:", "Tässä ovat tulevan viikon tapahtumat:")}
          </p>
          
          ${eventListHtml}
          
          <div style="border-top: 1px solid #e5e5e5; margin-top: 32px; padding-top: 24px; text-align: center;">
            <a href="${appUrl}/events" 
               style="display: inline-block; background: #3d1a24; color: #d4af37; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              ${tr("Browse All Events", "Selaa kaikkia tapahtumia")}
            </a>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #888;">
          <p style="margin: 0;">
            ${tr("You're receiving this because you enabled the weekly event digest.", "Saat tämän viestin, koska olet tilannut viikoittaisen tapahtumakoosteen.")}
            <br/>
            <a href="${appUrl}/profile" style="color: #d4af37;">${tr("Manage your preferences", "Muokkaa asetuksia")}</a>
          </p>
        </div>
      </div>
    `,
  }
}

// Nominatim is rate-limited: cache results and serialize requests. Unknown locations
// are excluded rather than sending events outside a subscriber's selected radius.
const geocodeCache = new Map<string, { lat: number; lon: number } | null>()
let lastGeocodeAt = 0
async function geocode(location: string | null): Promise<{ lat: number; lon: number } | null> {
  if (!location?.trim()) return null
  const key = location.trim().toLowerCase()
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null
  const wait = Math.max(0, 1100 - (Date.now() - lastGeocodeAt))
  if (wait) await new Promise(resolve => setTimeout(resolve, wait))
  lastGeocodeAt = Date.now()
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`, {
      headers: { "User-Agent": "GameTable/2.0 (info@janope.fi)" },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`)
    const data = await response.json() as Array<{ lat: string; lon: string }>
    const point = data[0] ? { lat: Number(data[0].lat), lon: Number(data[0].lon) } : null
    geocodeCache.set(key, point)
    return point
  } catch (error) {
    console.error("[Event Digest Cron] Geocoding error", error)
    return null
  }
}
function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}
