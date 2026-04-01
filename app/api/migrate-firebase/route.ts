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

// Helper to migrate games for a user
async function migrateUserGames(
  firestore: FirebaseFirestore.Firestore,
  supabase: ReturnType<typeof createClient>,
  firebaseUid: string,
  supabaseUserId: string,
  profileData: Record<string, unknown> | undefined,
  addLog: (msg: string) => void,
  stats: { gamesCreated: number; userGamesCreated: number; errors: string[] },
  dryRun: boolean
) {
  const gamesSnapshot = await firestore
    .collection("userProfiles")
    .doc(firebaseUid)
    .collection("games")
    .get()
  
  addLog(`    Found ${gamesSnapshot.size} games in collection`)
  
  if (dryRun) {
    addLog(`    [DRY RUN] Would migrate ${gamesSnapshot.size} games`)
    return
  }
  
  for (const gameDoc of gamesSnapshot.docs) {
    const gameData = gameDoc.data()
    
    // Check if game exists or create it
    let gameId: string | null = null
    
    // Try to find by bggId first
    if (gameData.bggId) {
      const { data: existingGame } = await supabase
        .from("games")
        .select("id")
        .eq("bgg_id", String(gameData.bggId))
        .single()
      
      if (existingGame) {
        gameId = existingGame.id
        addLog(`    Found existing game for bggId ${gameData.bggId}`)
      }
    }
    
    // Get game name - could be in name, title, or we need to use bggId as fallback
    const gameName = gameData.name || gameData.title || `BGG Game ${gameData.bggId}` || "Unknown Game"
    
    if (!gameId) {
      // Create new game
      const { data: newGame, error: gameError } = await supabase
        .from("games")
        .insert({
          bgg_id: gameData.bggId ? String(gameData.bggId) : null,
          name: gameName,
          year_published: gameData.yearPublished || gameData.year || null,
          description: gameData.description || null,
          thumbnail_url: gameData.thumbnailUrl || gameData.imageUrl || null,
          image_url: gameData.imageUrl || null,
          min_players: gameData.minPlayers || null,
          max_players: gameData.maxPlayers || null,
          playing_time: gameData.playingTime || null,
          category: gameData.category || "board_game",
          bgg_rating: gameData.averageRating || gameData.bggRating || null,
        })
        .select("id")
        .single()
      
      if (gameError) {
        stats.errors.push(`Game error for ${gameName}: ${gameError.message}`)
        addLog(`    Error creating game ${gameName}: ${gameError.message}`)
        continue
      }
      
      gameId = newGame.id
      stats.gamesCreated++
      addLog(`    Created game: ${gameName}`)
    }
    
    // Check if user_game link already exists
    const { data: existingUserGame } = await supabase
      .from("user_games")
      .select("id")
      .eq("user_id", supabaseUserId)
      .eq("game_id", gameId)
      .single()
    
    if (existingUserGame) {
      addLog(`    User already has game ${gameName}`)
      continue
    }
    
    // Create user_game link
    const addedAt = gameData.addedDate?._seconds 
      ? new Date(gameData.addedDate._seconds * 1000).toISOString()
      : new Date().toISOString()
    
    const { error: userGameError } = await supabase
      .from("user_games")
      .insert({
        user_id: supabaseUserId,
        game_id: gameId,
        status: gameData.status || "owned",
        condition: gameData.condition || null,
        personal_rating: gameData.personalRating || gameData.userRating || null,
        play_count: gameData.playCount || gameData.numPlays || 0,
        notes: gameData.notes || null,
        quantity: gameData.quantity || 1,
        paint_status: gameData.paintStatus || null,
        added_at: addedAt,
      })
    
    if (userGameError) {
      stats.errors.push(`User game error: ${userGameError.message}`)
      addLog(`    Error linking game: ${userGameError.message}`)
    } else {
      stats.userGamesCreated++
      addLog(`    Linked game: ${gameName}`)
    }
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const dryRun = searchParams.get("dry_run") !== "false"
  const secret = searchParams.get("secret")
  const batchSize = Math.min(parseInt(searchParams.get("batch") || "5"), 10) // Max 10 per batch
  const offset = parseInt(searchParams.get("offset") || "0")
  
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
    addLog(`Starting migration (DRY_RUN: ${dryRun}, batch: ${batchSize}, offset: ${offset})`)
    
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
    addLog(`Found ${firebaseUsers.length} Firebase users total`)
    
    // Get the batch of users to process
    const usersToProcess = firebaseUsers.slice(offset, offset + batchSize)
    const hasMore = offset + batchSize < firebaseUsers.length
    const nextOffset = hasMore ? offset + batchSize : null
    
    addLog(`Processing users ${offset + 1} to ${offset + usersToProcess.length} of ${firebaseUsers.length}`)
    
    // Step 2: Process batch of users
    for (const fbUser of usersToProcess) {
      try {
        addLog(`Processing user: ${fbUser.email || fbUser.uid}`)
        
        // Get Firestore profile first to check displayName
        const profileDoc = await firestore.collection("userProfiles").doc(fbUser.uid).get()
        const profileData = profileDoc.exists ? profileDoc.data() : {}
        
        // Use displayName as username (sanitized)
        const username = (profileData?.displayName || fbUser.displayName || fbUser.email?.split("@")[0] || fbUser.uid.slice(0, 20))
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .slice(0, 30)
        
        // Try to find existing user - first by getting user by email from auth
        let supabaseUserId: string | null = null
        let isExistingUser = false
        
        if (!dryRun && fbUser.email) {
          // Try to create the user first - if it fails with "already registered", we'll look them up
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: fbUser.email,
            email_confirm: true,
            user_metadata: {
              firebase_uid: fbUser.uid,
              display_name: profileData?.displayName || fbUser.displayName,
            }
          })
          
          if (authError && authError.message.includes("already been registered")) {
            // User exists - find them by looking up all users with pagination
            addLog(`  User ${fbUser.email} already exists, looking up...`)
            
            let page = 1
            let foundUser = null
            while (!foundUser) {
              const { data: listData } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
              if (!listData?.users || listData.users.length === 0) break
              foundUser = listData.users.find(u => u.email === fbUser.email)
              if (foundUser) break
              page++
              if (page > 10) break // Safety limit
            }
            
            if (foundUser) {
              supabaseUserId = foundUser.id
              isExistingUser = true
              addLog(`  Found existing user with ID: ${supabaseUserId}`)
            } else {
              stats.errors.push(`Could not find existing user: ${fbUser.email}`)
              addLog(`  ERROR: Could not find existing user ${fbUser.email}`)
              continue
            }
          } else if (authError) {
            stats.errors.push(`Auth error for ${fbUser.email}: ${authError.message}`)
            addLog(`  Error creating auth user: ${authError.message}`)
            continue
          } else if (authData?.user) {
            supabaseUserId = authData.user.id
            stats.usersCreated++
            addLog(`  Created new auth user: ${supabaseUserId}`)
          }
        }
        
        if (dryRun) {
          addLog(`  [DRY RUN] Would create/update user and migrate games`)
          continue
        }
        
        if (!supabaseUserId) {
          addLog(`  ERROR: No Supabase user ID available`)
          continue
        }
        
        // Map Firebase preferences to game_interests array
        const gameInterests: string[] = []
        if (profileData?.prefersBoardGames) gameInterests.push("board_game")
        if (profileData?.prefersWarhammer) gameInterests.push("miniature")
        if (profileData?.prefersOtherMiniatures) gameInterests.push("miniature")
        if (profileData?.prefersRPGs) gameInterests.push("rpg")
        
        // Map Firebase themePreference to Supabase preferred_theme
        const themeMap: Record<string, string> = {
          "dark-fantasy": "vintage_burgundy",
          "light": "forest_green", 
          "steampunk": "midnight_blue",
          "cyberpunk": "warm_mahogany",
        }
        const preferredTheme = themeMap[profileData?.themePreference as string] || "vintage_burgundy"
        
        // Create or update profile
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: supabaseUserId,
            display_name: profileData?.displayName || fbUser.displayName || null,
            username: username,
            avatar_url: profileData?.photoURL || fbUser.photoURL || null,
            bio: profileData?.bio || null,
            location: profileData?.location || null,
            game_interests: gameInterests.length > 0 ? gameInterests : ["board_game"],
            xp: profileData?.totalXP || 0,
            level: profileData?.currentLevel || 1,
            current_xp: profileData?.totalXP || 0,
            active_room: "grand_hall",
            preferred_theme: preferredTheme,
            show_collection: true,
          })
        
        if (profileError) {
          stats.errors.push(`Profile error for ${fbUser.email}: ${profileError.message}`)
          addLog(`  Error ${isExistingUser ? 'updating' : 'creating'} profile: ${profileError.message}`)
        } else {
          stats.profilesCreated++
          addLog(`  ${isExistingUser ? 'Updated' : 'Created'} profile for ${fbUser.email} (XP: ${profileData?.totalXP || 0}, username: ${username})`)
        }
        
        // Migrate games from subcollection
        await migrateUserGames(firestore, supabase, fbUser.uid, supabaseUserId, profileData, addLog, stats, dryRun)
        
      } catch (userError) {
        const errorMsg = userError instanceof Error ? userError.message : String(userError)
        stats.errors.push(`User ${fbUser.uid}: ${errorMsg}`)
        addLog(`  Error processing user: ${errorMsg}`)
      }
    }
    
    addLog("")
    addLog(`=== Batch Complete (${offset + 1}-${offset + usersToProcess.length} of ${stats.usersFound}) ===`)
    addLog(`Users created in this batch: ${stats.usersCreated}`)
    addLog(`Profiles created: ${stats.profilesCreated}`)
    addLog(`Games created: ${stats.gamesCreated}`)
    addLog(`User-game links: ${stats.userGamesCreated}`)
    addLog(`Errors: ${stats.errors.length}`)
    
    if (hasMore) {
      addLog("")
      addLog(`>>> More users remaining. Next batch: offset=${nextOffset}`)
    } else {
      addLog("")
      addLog("=== ALL USERS PROCESSED ===")
    }
    
    return NextResponse.json({
      success: true,
      dryRun,
      stats,
      log,
      pagination: {
        total: stats.usersFound,
        processed: offset + usersToProcess.length,
        hasMore,
        nextOffset,
        nextUrl: hasMore 
          ? `/api/migrate-firebase?secret=gametable-migrate-2024&dry_run=${dryRun}&offset=${nextOffset}&batch=${batchSize}`
          : null
      }
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
