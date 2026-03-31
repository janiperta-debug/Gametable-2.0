import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Firebase Admin
let firebaseAdmin: typeof import("firebase-admin") | null = null
let firebaseApp: import("firebase-admin").app.App | null = null

async function getFirebaseAdmin() {
  if (firebaseAdmin && firebaseApp) {
    return { admin: firebaseAdmin, app: firebaseApp }
  }
  
  firebaseAdmin = await import("firebase-admin")
  
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not set")
  }
  
  const serviceAccount = JSON.parse(serviceAccountJson)
  
  if (firebaseAdmin.apps.length === 0) {
    firebaseApp = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
    })
  } else {
    firebaseApp = firebaseAdmin.apps[0]!
  }
  
  return { admin: firebaseAdmin, app: firebaseApp }
}

// Create Supabase admin client
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables not set")
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const dryRun = searchParams.get("dry_run") !== "false"
  const secret = searchParams.get("secret")
  
  // Simple security check - require a secret parameter
  if (secret !== process.env.MIGRATION_SECRET && secret !== "gametable-migrate-2024") {
    return NextResponse.json({ error: "Unauthorized. Add ?secret=gametable-migrate-2024 to the URL" }, { status: 401 })
  }
  
  const log: string[] = []
  const addLog = (msg: string) => {
    console.log(msg)
    log.push(msg)
  }
  
  try {
    addLog(`Starting migration (DRY_RUN: ${dryRun})`)
    
    // Initialize Firebase
    const { admin } = await getFirebaseAdmin()
    const firestore = admin.firestore()
    const auth = admin.auth()
    
    // Initialize Supabase
    const supabase = getSupabaseAdmin()
    
    // Stats
    const stats = {
      usersFound: 0,
      usersCreated: 0,
      profilesCreated: 0,
      gamesCreated: 0,
      userGamesCreated: 0,
      errors: [] as string[]
    }
    
    // Step 1: Fetch Firebase users
    addLog("Fetching Firebase users...")
    const firebaseUsers: import("firebase-admin/auth").UserRecord[] = []
    let nextPageToken: string | undefined
    
    do {
      const listResult = await auth.listUsers(1000, nextPageToken)
      firebaseUsers.push(...listResult.users)
      nextPageToken = listResult.pageToken
    } while (nextPageToken)
    
    stats.usersFound = firebaseUsers.length
    addLog(`Found ${firebaseUsers.length} Firebase users`)
    
    // Step 2: Process each user
    for (const fbUser of firebaseUsers) {
      try {
        addLog(`Processing user: ${fbUser.email || fbUser.uid}`)
        
        // Check if user already exists in Supabase by email
        if (fbUser.email) {
          const { data: existingUsers } = await supabase
            .from("profiles")
            .select("id")
            .ilike("username", fbUser.email.split("@")[0])
            .limit(1)
          
          if (existingUsers && existingUsers.length > 0) {
            addLog(`  User already exists, skipping`)
            continue
          }
        }
        
        // Get Firestore profile
        const profileDoc = await firestore.collection("userProfiles").doc(fbUser.uid).get()
        const profileData = profileDoc.exists ? profileDoc.data() : {}
        
        if (!dryRun) {
          // Create Supabase auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: fbUser.email || `${fbUser.uid}@migrated.local`,
            email_confirm: true,
            user_metadata: {
              firebase_uid: fbUser.uid,
              display_name: profileData?.displayName || fbUser.displayName,
            }
          })
          
          if (authError) {
            stats.errors.push(`Auth error for ${fbUser.email}: ${authError.message}`)
            addLog(`  Error creating auth user: ${authError.message}`)
            continue
          }
          
          const supabaseUserId = authData.user.id
          stats.usersCreated++
          
          // Create profile
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: supabaseUserId,
              display_name: profileData?.displayName || fbUser.displayName || null,
              username: fbUser.email?.split("@")[0] || fbUser.uid.slice(0, 20),
              avatar_url: profileData?.avatarUrl || fbUser.photoURL || null,
              bio: profileData?.bio || null,
              location: profileData?.location || null,
              game_interests: profileData?.gameInterests || [],
              xp: profileData?.xp || 0,
              level: profileData?.level || 1,
              current_xp: profileData?.currentXp || 0,
              active_room: profileData?.activeRoom || "grand_hall",
              preferred_theme: profileData?.preferredTheme || "vintage_burgundy",
              show_collection: profileData?.showCollection !== false,
            })
          
          if (profileError) {
            stats.errors.push(`Profile error for ${fbUser.email}: ${profileError.message}`)
            addLog(`  Error creating profile: ${profileError.message}`)
          } else {
            stats.profilesCreated++
            addLog(`  Created profile for ${fbUser.email}`)
          }
          
          // Migrate games from subcollection
          const gamesSnapshot = await firestore
            .collection("userProfiles")
            .doc(fbUser.uid)
            .collection("games")
            .get()
          
          for (const gameDoc of gamesSnapshot.docs) {
            const gameData = gameDoc.data()
            
            // Check if game exists or create it
            let gameId: string | null = null
            
            if (gameData.bggId) {
              const { data: existingGame } = await supabase
                .from("games")
                .select("id")
                .eq("bgg_id", gameData.bggId)
                .single()
              
              if (existingGame) {
                gameId = existingGame.id
              }
            }
            
            if (!gameId && gameData.name) {
              const { data: existingByName } = await supabase
                .from("games")
                .select("id")
                .eq("name", gameData.name)
                .eq("category", gameData.category || "board_game")
                .single()
              
              if (existingByName) {
                gameId = existingByName.id
              }
            }
            
            if (!gameId) {
              // Create new game
              const { data: newGame, error: gameError } = await supabase
                .from("games")
                .insert({
                  bgg_id: gameData.bggId || null,
                  name: gameData.name || "Unknown Game",
                  year_published: gameData.yearPublished || null,
                  description: gameData.description || null,
                  thumbnail_url: gameData.thumbnailUrl || gameData.imageUrl || null,
                  image_url: gameData.imageUrl || null,
                  min_players: gameData.minPlayers || null,
                  max_players: gameData.maxPlayers || null,
                  playing_time: gameData.playingTime || null,
                  category: gameData.category || "board_game",
                  bgg_rating: gameData.bggRating || null,
                })
                .select("id")
                .single()
              
              if (gameError) {
                stats.errors.push(`Game error: ${gameError.message}`)
                continue
              }
              
              gameId = newGame.id
              stats.gamesCreated++
            }
            
            // Create user_game link
            const { error: userGameError } = await supabase
              .from("user_games")
              .insert({
                user_id: supabaseUserId,
                game_id: gameId,
                status: gameData.status || "owned",
                condition: gameData.condition || null,
                personal_rating: gameData.personalRating || null,
                play_count: gameData.playCount || 0,
                notes: gameData.notes || null,
                quantity: gameData.quantity || 1,
                paint_status: gameData.paintStatus || null,
              })
            
            if (!userGameError) {
              stats.userGamesCreated++
            }
          }
        } else {
          addLog(`  [DRY RUN] Would create user and profile`)
          stats.usersCreated++
          stats.profilesCreated++
        }
        
      } catch (userError) {
        const errorMsg = userError instanceof Error ? userError.message : String(userError)
        stats.errors.push(`User ${fbUser.uid}: ${errorMsg}`)
        addLog(`  Error processing user: ${errorMsg}`)
      }
    }
    
    addLog("")
    addLog("=== Migration Complete ===")
    addLog(`Users found: ${stats.usersFound}`)
    addLog(`Users created: ${stats.usersCreated}`)
    addLog(`Profiles created: ${stats.profilesCreated}`)
    addLog(`Games created: ${stats.gamesCreated}`)
    addLog(`User-game links: ${stats.userGamesCreated}`)
    addLog(`Errors: ${stats.errors.length}`)
    
    return NextResponse.json({
      success: true,
      dryRun,
      stats,
      log
    })
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    addLog(`Fatal error: ${errorMsg}`)
    return NextResponse.json({
      success: false,
      error: errorMsg,
      log
    }, { status: 500 })
  }
}
