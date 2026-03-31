/**
 * Firebase to Supabase Migration Script
 * 
 * This script migrates all user data from Firebase/Firestore to Supabase:
 * - Auth users (~50 users)
 * - User profiles
 * - Games and user_games collections (~1000+ games)
 * 
 * USAGE:
 * 1. Set up environment variables in .env.local:
 *    - FIREBASE_SERVICE_ACCOUNT_JSON (stringified JSON)
 *    - SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 
 * 2. Dry run first:
 *    DRY_RUN=true npx tsx scripts/migrate-firebase.ts
 * 
 * 3. Run for real:
 *    npx tsx scripts/migrate-firebase.ts
 */

import * as admin from 'firebase-admin'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

// Types
interface FirebaseUser {
  uid: string
  email: string | undefined
  displayName: string | undefined
  photoURL: string | undefined
  providerData: admin.auth.UserInfo[]
}

interface FirestoreProfile {
  displayName?: string
  bio?: string
  location?: string
  gameInterests?: string[]
  xp?: number
  level?: number
  activeRoom?: string
  photoURL?: string
  createdAt?: admin.firestore.Timestamp
}

interface FirestoreGame {
  id?: string
  bggId?: number
  name: string
  description?: string
  imageUrl?: string
  thumbnailUrl?: string
  category?: string
  yearPublished?: number
  minPlayers?: number
  maxPlayers?: number
  minPlaytime?: number
  maxPlaytime?: number
  rating?: number
  status?: 'owned' | 'wishlist' | 'previously_owned'
  condition?: 'mint' | 'like_new' | 'good' | 'fair' | 'poor'
  personalRating?: number
  playCount?: number
  notes?: string
  addedAt?: admin.firestore.Timestamp
}

interface MigrationLog {
  started_at: string
  completed_at?: string
  dry_run: boolean
  users_migrated: number
  users_skipped: number
  profiles_migrated: number
  games_migrated: number
  user_games_migrated: number
  errors: { firebase_uid?: string; context: string; error: string }[]
}

// Initialize services
function initializeFirebase() {
  if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required')
  }

  const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON)

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  }

  return {
    auth: admin.auth(),
    firestore: admin.firestore(),
  }
}

function initializeSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Migration functions
async function fetchAllFirebaseUsers(auth: admin.auth.Auth): Promise<FirebaseUser[]> {
  console.log('📥 Fetching Firebase users...')
  const users: FirebaseUser[] = []
  let nextPageToken: string | undefined

  do {
    const result = await auth.listUsers(1000, nextPageToken)
    users.push(
      ...result.users.map((user) => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        providerData: user.providerData,
      }))
    )
    nextPageToken = result.pageToken
  } while (nextPageToken)

  console.log(`   Found ${users.length} Firebase users`)
  return users
}

async function createSupabaseUsers(
  supabase: ReturnType<typeof createClient>,
  firebaseUsers: FirebaseUser[],
  log: MigrationLog
): Promise<Map<string, string>> {
  console.log('👤 Creating Supabase auth users...')
  const uidMapping = new Map<string, string>()

  for (const fbUser of firebaseUsers) {
    if (!fbUser.email) {
      console.log(`   ⚠️ Skipping user ${fbUser.uid} - no email`)
      log.users_skipped++
      continue
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === fbUser.email)

    if (existingUser) {
      console.log(`   ⏭️ User ${fbUser.email} already exists in Supabase`)
      uidMapping.set(fbUser.uid, existingUser.id)
      log.users_skipped++
      continue
    }

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would create user: ${fbUser.email}`)
      uidMapping.set(fbUser.uid, `dry-run-${fbUser.uid}`)
      log.users_migrated++
      continue
    }

    try {
      // Determine if Google OAuth user
      const isGoogleUser = fbUser.providerData.some((p) => p.providerId === 'google.com')

      const { data, error } = await supabase.auth.admin.createUser({
        email: fbUser.email,
        email_confirm: true,
        user_metadata: {
          display_name: fbUser.displayName || fbUser.email.split('@')[0],
          avatar_url: fbUser.photoURL,
          provider: isGoogleUser ? 'google' : 'email',
          firebase_uid: fbUser.uid, // Store for reference
        },
      })

      if (error) {
        throw error
      }

      uidMapping.set(fbUser.uid, data.user.id)
      log.users_migrated++
      console.log(`   ✅ Created user: ${fbUser.email}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`   ❌ Error creating user ${fbUser.email}:`, errorMessage)
      log.errors.push({
        firebase_uid: fbUser.uid,
        context: 'create_user',
        error: errorMessage,
      })
    }
  }

  return uidMapping
}

async function migrateProfiles(
  firestore: admin.firestore.Firestore,
  supabase: ReturnType<typeof createClient>,
  uidMapping: Map<string, string>,
  log: MigrationLog
): Promise<void> {
  console.log('📝 Migrating profiles...')

  for (const [firebaseUid, supabaseUid] of uidMapping) {
    if (supabaseUid.startsWith('dry-run-')) {
      log.profiles_migrated++
      continue
    }

    try {
      const profileDoc = await firestore.doc(`userProfiles/${firebaseUid}`).get()
      const profileData = profileDoc.data() as FirestoreProfile | undefined

      const profile = {
        id: supabaseUid,
        display_name: profileData?.displayName || null,
        avatar_url: profileData?.photoURL || null,
        bio: profileData?.bio || null,
        location: profileData?.location || null,
        game_interests: profileData?.gameInterests || [],
        xp: profileData?.xp || 0,
        level: profileData?.level || 1,
        current_xp: profileData?.xp || 0,
        active_room: profileData?.activeRoom || 'main-hall',
        preferred_theme: 'classic-manor',
        show_collection: true,
      }

      if (DRY_RUN) {
        console.log(`   [DRY RUN] Would migrate profile for: ${supabaseUid}`)
        log.profiles_migrated++
        continue
      }

      const { error } = await supabase.from('profiles').upsert(profile, {
        onConflict: 'id',
      })

      if (error) {
        throw error
      }

      log.profiles_migrated++
      console.log(`   ✅ Migrated profile: ${supabaseUid}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`   ❌ Error migrating profile for ${firebaseUid}:`, errorMessage)
      log.errors.push({
        firebase_uid: firebaseUid,
        context: 'migrate_profile',
        error: errorMessage,
      })
    }
  }
}

async function migrateGames(
  firestore: admin.firestore.Firestore,
  supabase: ReturnType<typeof createClient>,
  uidMapping: Map<string, string>,
  log: MigrationLog
): Promise<void> {
  console.log('🎮 Migrating games and user_games...')

  // Cache for games we've already inserted (bgg_id -> supabase game id)
  const gameCache = new Map<string, string>()

  for (const [firebaseUid, supabaseUid] of uidMapping) {
    if (supabaseUid.startsWith('dry-run-')) {
      // For dry run, just count the games
      const gamesSnapshot = await firestore
        .collection(`userProfiles/${firebaseUid}/games`)
        .get()
      log.games_migrated += gamesSnapshot.docs.length
      log.user_games_migrated += gamesSnapshot.docs.length
      continue
    }

    try {
      const gamesSnapshot = await firestore
        .collection(`userProfiles/${firebaseUid}/games`)
        .get()

      for (const gameDoc of gamesSnapshot.docs) {
        const gameData = gameDoc.data() as FirestoreGame

        try {
          // Determine cache key (prefer bgg_id, fall back to name+category)
          const cacheKey = gameData.bggId
            ? `bgg:${gameData.bggId}`
            : `name:${gameData.name}:${gameData.category || 'board_game'}`

          let gameId: string

          if (gameCache.has(cacheKey)) {
            gameId = gameCache.get(cacheKey)!
          } else {
            // Check if game exists in Supabase
            let existingGame = null

            if (gameData.bggId) {
              const { data } = await supabase
                .from('games')
                .select('id')
                .eq('bgg_id', gameData.bggId)
                .single()
              existingGame = data
            }

            if (!existingGame && gameData.name) {
              const { data } = await supabase
                .from('games')
                .select('id')
                .eq('name', gameData.name)
                .eq('category', gameData.category || 'board_game')
                .single()
              existingGame = data
            }

            if (existingGame) {
              gameId = existingGame.id
            } else {
              // Insert new game
              if (DRY_RUN) {
                gameId = `dry-run-game-${gameDoc.id}`
              } else {
                const { data: newGame, error: gameError } = await supabase
                  .from('games')
                  .insert({
                    bgg_id: gameData.bggId || null,
                    name: gameData.name,
                    description: gameData.description || null,
                    image_url: gameData.imageUrl || null,
                    thumbnail_url: gameData.thumbnailUrl || null,
                    category: gameData.category || 'board_game',
                    year: gameData.yearPublished || null,
                    min_players: gameData.minPlayers || null,
                    max_players: gameData.maxPlayers || null,
                    min_playtime: gameData.minPlaytime || null,
                    max_playtime: gameData.maxPlaytime || null,
                    bgg_rating: gameData.rating || null,
                  })
                  .select('id')
                  .single()

                if (gameError) {
                  throw gameError
                }

                gameId = newGame.id
                log.games_migrated++
              }
            }

            gameCache.set(cacheKey, gameId)
          }

          // Insert user_game relationship
          if (!DRY_RUN) {
            const { error: userGameError } = await supabase.from('user_games').upsert(
              {
                user_id: supabaseUid,
                game_id: gameId,
                status: gameData.status || 'owned',
                condition: gameData.condition || null,
                personal_rating: gameData.personalRating || null,
                play_count: gameData.playCount || 0,
                notes: gameData.notes || null,
                added_at: gameData.addedAt?.toDate().toISOString() || new Date().toISOString(),
              },
              {
                onConflict: 'user_id,game_id',
                ignoreDuplicates: true,
              }
            )

            if (userGameError && !userGameError.message.includes('duplicate')) {
              throw userGameError
            }

            log.user_games_migrated++
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`   ❌ Error migrating game ${gameData.name}:`, errorMessage)
          log.errors.push({
            firebase_uid: firebaseUid,
            context: `migrate_game:${gameData.name}`,
            error: errorMessage,
          })
        }
      }

      console.log(
        `   ✅ Migrated ${gamesSnapshot.docs.length} games for user ${supabaseUid}`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`   ❌ Error fetching games for ${firebaseUid}:`, errorMessage)
      log.errors.push({
        firebase_uid: firebaseUid,
        context: 'fetch_games',
        error: errorMessage,
      })
    }
  }
}

async function writeMigrationLog(log: MigrationLog): Promise<void> {
  log.completed_at = new Date().toISOString()

  const logPath = path.join(process.cwd(), 'scripts', 'migration-log.json')
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2))
  console.log(`\n📄 Migration log written to: ${logPath}`)
}

// Main migration function
async function migrate() {
  console.log('\n' + '='.repeat(60))
  console.log(DRY_RUN ? '🧪 DRY RUN MODE - No data will be written' : '🚀 LIVE MIGRATION')
  console.log('='.repeat(60) + '\n')

  const log: MigrationLog = {
    started_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    users_migrated: 0,
    users_skipped: 0,
    profiles_migrated: 0,
    games_migrated: 0,
    user_games_migrated: 0,
    errors: [],
  }

  try {
    // Initialize services
    const { auth, firestore } = initializeFirebase()
    const supabase = initializeSupabase()

    // Step 1: Fetch Firebase users
    const firebaseUsers = await fetchAllFirebaseUsers(auth)

    // Step 2: Create Supabase auth users
    const uidMapping = await createSupabaseUsers(supabase, firebaseUsers, log)

    // Step 3: Migrate profiles
    await migrateProfiles(firestore, supabase, uidMapping, log)

    // Step 4: Migrate games and user_games
    await migrateGames(firestore, supabase, uidMapping, log)

    // Write log
    await writeMigrationLog(log)

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
    console.log(`Users migrated: ${log.users_migrated}`)
    console.log(`Users skipped: ${log.users_skipped}`)
    console.log(`Profiles migrated: ${log.profiles_migrated}`)
    console.log(`Games migrated: ${log.games_migrated}`)
    console.log(`User-game entries: ${log.user_games_migrated}`)
    console.log(`Errors: ${log.errors.length}`)
    console.log('='.repeat(60) + '\n')

    if (log.errors.length > 0) {
      console.log('⚠️ Errors encountered:')
      log.errors.forEach((e, i) => {
        console.log(`   ${i + 1}. [${e.context}] ${e.firebase_uid || 'N/A'}: ${e.error}`)
      })
    }

    if (DRY_RUN) {
      console.log('\n✅ Dry run complete. Review the output above.')
      console.log('   To run the actual migration, remove DRY_RUN=true\n')
    } else {
      console.log('\n✅ Migration complete!')
      console.log('   Verify in Supabase Dashboard:')
      console.log('   - Authentication → Users should show migrated users')
      console.log('   - Database → profiles, games, user_games tables\n')
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    log.errors.push({
      context: 'main',
      error: error instanceof Error ? error.message : String(error),
    })
    await writeMigrationLog(log)
    process.exit(1)
  }
}

// Run migration
migrate()
