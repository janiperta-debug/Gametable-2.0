import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get("secret")
  const dryRun = searchParams.get("dry_run") !== "false"

  if (secret !== "gametable-migrate-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const log: string[] = []

  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, display_name, username")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    log.push(`Found ${profiles?.length || 0} profiles`)

    const updates: { id: string; oldUsername: string | null; newUsername: string }[] = []

    for (const profile of profiles || []) {
      // If username is null or empty, generate from display_name
      if (!profile.username && profile.display_name) {
        const newUsername = profile.display_name
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .replace(/_+/g, "_")
          .slice(0, 30)

        updates.push({
          id: profile.id,
          oldUsername: profile.username,
          newUsername
        })

        log.push(`Would update: "${profile.display_name}" -> username: "${newUsername}"`)
      }
    }

    log.push(``)
    log.push(`Total profiles needing username: ${updates.length}`)

    if (!dryRun && updates.length > 0) {
      log.push(``)
      log.push(`Applying updates...`)

      for (const update of updates) {
        // Check for duplicate username
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", update.newUsername)
          .single()

        let finalUsername = update.newUsername
        if (existing && existing.id !== update.id) {
          // Add a suffix if username already exists
          finalUsername = `${update.newUsername}_${update.id.slice(0, 6)}`
          log.push(`  Username collision, using: ${finalUsername}`)
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ username: finalUsername })
          .eq("id", update.id)

        if (updateError) {
          log.push(`  Error updating ${update.id}: ${updateError.message}`)
        } else {
          log.push(`  Updated ${update.id} -> ${finalUsername}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      totalProfiles: profiles?.length || 0,
      updatesNeeded: updates.length,
      updates: dryRun ? updates : "Applied",
      log
    })
  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Unknown error",
      log 
    }, { status: 500 })
  }
}
