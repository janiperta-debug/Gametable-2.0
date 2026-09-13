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
        // The active Manor theme is stored as a room ID.
        // Firebase's former theme values are intentionally not carried over.
        preferred_theme: 'main-hall',
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
