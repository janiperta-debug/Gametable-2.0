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
  const secret = request.nextUrl.searchParams.get("secret")
  
  if (secret !== "gametable-migrate-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const supabase = getSupabaseAdmin()
  
  // Get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, xp, level")
    .limit(20)
  
  // Get all games
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("id, name, category")
    .limit(20)
  
  // Get all user_games
  const { data: userGames, error: userGamesError } = await supabase
    .from("user_games")
    .select("id, user_id, game_id, status")
    .limit(20)
  
  // Count totals
  const { count: profileCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    
  const { count: gameCount } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    
  const { count: userGameCount } = await supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
  
  return NextResponse.json({
    totals: {
      profiles: profileCount,
      games: gameCount,
      userGames: userGameCount
    },
    samples: {
      profiles: profiles || [],
      games: games || [],
      userGames: userGames || []
    },
    errors: {
      profiles: profilesError?.message,
      games: gamesError?.message,
      userGames: userGamesError?.message
    }
  }, { status: 200 })
}
