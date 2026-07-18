'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BGGGameDetails } from '@/lib/types/database'
import { awardXP } from './xp'

const XP_FOR_ADDING_GAME = 10

export async function getUserGames() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated', games: [] }
  }

  const { data, error } = await supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (error) {
    console.error('Error fetching user games:', error)
    return { error: error.message, games: [] }
  }

  // Count owned expansions per base game so the collection card can show a
  // "N expansions" badge. One extra query, mapped in memory.
  const { data: ownedExpansions } = await supabase
    .from('user_game_expansions')
    .select('game_expansion:game_expansions(base_game_id)')
    .eq('user_id', user.id)

  const expansionCountByGameId = new Map<string, number>()
  for (const row of ownedExpansions || []) {
    // Supabase types embedded relations as an array; take the first.
    const rel = row.game_expansion as unknown as { base_game_id: string }[] | { base_game_id: string } | null
    const baseGameId = Array.isArray(rel) ? rel[0]?.base_game_id : rel?.base_game_id
    if (baseGameId) {
      expansionCountByGameId.set(baseGameId, (expansionCountByGameId.get(baseGameId) || 0) + 1)
    }
  }

  const games = (data || []).map((ug) => ({
    ...ug,
    ownedExpansionCount: expansionCountByGameId.get(ug.game_id) || 0,
  }))

  return { games, error: null }
}

export type GameCategory = 'board_game' | 'rpg' | 'trading_card' | 'miniature'

// Adds an expansion (as classified by BGG) to the catalog + the user's owned
// expansions. Ensures the base game exists in `games` first so the expansion
// always has a host to nest under. Never creates a standalone user_games row.
async function addExpansionToCollection(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  bggDetails: BGGGameDetails
) {
  if (!bggDetails.baseGame) {
    console.error('[v0] Expansion has no base game link:', bggDetails.name)
    return { error: 'Expansion is missing its base game' }
  }

  // 1. Ensure the base game exists in `games` (create a minimal row if not).
  let baseGameId: string
  const { data: existingBase } = await supabase
    .from('games')
    .select('id')
    .eq('bgg_id', bggDetails.baseGame.bggId)
    .single()

  if (existingBase) {
    baseGameId = existingBase.id
  } else {
    const { data: newBase, error: baseError } = await supabase
      .from('games')
      .insert({
        bgg_id: bggDetails.baseGame.bggId,
        name: bggDetails.baseGame.name,
        category: 'board_game',
      })
      .select('id')
      .single()

    if (baseError || !newBase) {
      console.error('[v0] Error creating base game for expansion:', baseError?.message)
      return { error: baseError?.message || 'Could not create base game' }
    }
    baseGameId = newBase.id
  }

  // 2. Upsert the expansion into the shared catalog (bgg_id is globally unique).
  const { data: expansion, error: expError } = await supabase
    .from('game_expansions')
    .upsert(
      {
        base_game_id: baseGameId,
        bgg_id: bggDetails.id,
        name: bggDetails.name,
        year: bggDetails.yearPublished,
        image_url: bggDetails.image,
      },
      { onConflict: 'bgg_id' }
    )
    .select('id')
    .single()

  if (expError || !expansion) {
    console.error('[v0] Error upserting expansion:', expError?.message)
    return { error: expError?.message || 'Could not save expansion' }
  }

  // 3. Mark ownership (idempotent — ignore unique-violation).
  const { error: ownError } = await supabase
    .from('user_game_expansions')
    .insert({ user_id: userId, game_expansion_id: expansion.id })

  if (ownError && ownError.code !== '23505') {
    console.error('[v0] Error marking expansion ownership:', ownError.message)
    return { error: ownError.message }
  }

  await awardXP(userId, 'add_game', XP_FOR_ADDING_GAME)
  revalidatePath('/collection')
  return { success: true, gameId: baseGameId, expansionId: expansion.id }
}

export async function addGameToCollection(
  bggDetails: BGGGameDetails,
  status: 'owned' | 'wishlist' = 'owned',
  category: GameCategory = 'board_game',
  isManualEntry: boolean = false
) {
  console.log("[v0] addGameToCollection called:", { bggDetails, status, category, isManualEntry })
  
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  console.log("[v0] Current user:", user?.id)
  
  if (!user) {
    console.log("[v0] No user authenticated")
    return { error: 'Not authenticated' }
  }

  // If BGG classified this title as an expansion, it belongs in the
  // game_expansions catalog + user_game_expansions ownership — NEVER as a
  // standalone user_games entry. Route it there and stop.
  if (category === 'board_game' && bggDetails.isExpansion && !isManualEntry) {
    return addExpansionToCollection(supabase, user.id, bggDetails)
  }

  // For manual entries, we don't have a bgg_id
  let gameId: string

  if (isManualEntry) {
    console.log("[v0] Processing manual entry for:", bggDetails.name)
    
    // For manual entries, check by name to avoid duplicates
    const { data: existingGame, error: checkError } = await supabase
      .from('games')
      .select('id')
      .eq('name', bggDetails.name)
      .eq('category', category)
      .is('bgg_id', null)
      .single()

    console.log("[v0] Existing game check:", { existingGame, checkError })

    if (existingGame) {
      gameId = existingGame.id
      console.log("[v0] Using existing game ID:", gameId)
    } else {
      // Insert manual game entry
      console.log("[v0] Inserting new manual game entry")
      const { data: newGame, error: gameError } = await supabase
        .from('games')
        .insert({
          name: bggDetails.name,
          year: bggDetails.yearPublished,
          min_players: bggDetails.minPlayers,
          max_players: bggDetails.maxPlayers,
          min_playtime: bggDetails.minPlaytime,
          max_playtime: bggDetails.maxPlaytime,
          description: bggDetails.description,
          image_url: bggDetails.image,
          thumbnail_url: bggDetails.thumbnail,
          category,
        })
        .select('id')
        .single()

      console.log("[v0] Insert result:", { newGame, gameError })

      if (gameError) {
        console.error('[v0] Error inserting manual game:', gameError)
        return { error: gameError.message }
      }
      gameId = newGame.id
      console.log("[v0] Created new game with ID:", gameId)
    }
  } else {
    // Check if game already exists by bgg_id
    const { data: existingGame } = await supabase
      .from('games')
      .select('id')
      .eq('bgg_id', bggDetails.id)
      .single()

    if (existingGame) {
      gameId = existingGame.id
    } else {
      // Insert the game from API
      const { data: newGame, error: gameError } = await supabase
        .from('games')
        .insert({
          bgg_id: bggDetails.id,
          name: bggDetails.name,
          year: bggDetails.yearPublished,
          min_players: bggDetails.minPlayers,
          max_players: bggDetails.maxPlayers,
          min_playtime: bggDetails.minPlaytime,
          max_playtime: bggDetails.maxPlaytime,
          bgg_rating: bggDetails.rating,
          image_url: bggDetails.image,
          thumbnail_url: bggDetails.thumbnail,
          description: bggDetails.description,
          category,
        })
        .select('id')
        .single()

      if (gameError) {
        console.error('Error inserting game:', gameError)
        return { error: gameError.message }
      }
      gameId = newGame.id
    }
  }

  // Check if user already has this game
  const { data: existingUserGame } = await supabase
    .from('user_games')
    .select('id')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .single()

  if (existingUserGame) {
    return { error: 'Game already in your collection' }
  }

  // Add to user's collection
  const { error: userGameError } = await supabase
    .from('user_games')
    .insert({
      user_id: user.id,
      game_id: gameId,
      status,
      play_count: 0,
    })

  if (userGameError) {
    console.error('Error adding game to collection:', userGameError)
    return { error: userGameError.message }
  }

  // Populate the shared expansion catalog for board games (best effort — never
  // block adding the game itself if this fails).
  if (category === 'board_game' && bggDetails.expansions?.length) {
    const rows = bggDetails.expansions
      .filter((e) => e.bggId)
      .map((e, i) => ({
        base_game_id: gameId,
        bgg_id: e.bggId,
        name: e.name,
        year: e.year,
        image_url: e.image,
        sort_order: i,
      }))

    if (rows.length) {
      const { error: expError } = await supabase
        .from('game_expansions')
        .upsert(rows, { onConflict: 'bgg_id' })
      if (expError) {
        console.error('[v0] Error upserting expansions:', expError.message)
      }
    }
  }

  // Award XP using the centralized server action
  await awardXP(user.id, 'add_game', XP_FOR_ADDING_GAME)

  revalidatePath('/collection')
  return { success: true, gameId }
}

export async function removeGameFromCollection(userGameId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('user_games')
    .delete()
    .eq('id', userGameId)
    .eq('user_id', user.id) // RLS ensures this, but explicit for safety

  if (error) {
    console.error('Error removing game:', error)
    return { error: error.message }
  }

  revalidatePath('/collection')
  return { success: true }
}

export async function updateUserGame(
  userGameId: string,
  updates: {
    status?: 'owned' | 'wishlist' | 'previously_owned'
    condition?: 'mint' | 'like_new' | 'good' | 'fair' | 'poor'
    personal_rating?: number
    notes?: string
  }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('user_games')
    .update(updates)
    .eq('id', userGameId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating game:', error)
    return { error: error.message }
  }

  revalidatePath('/collection')
  return { success: true }
}

export async function updateGame(
  gameId: string,
  updates: {
    name?: string
    category?: GameCategory
    year?: number | null
    min_players?: number | null
    max_players?: number | null
    min_playtime?: number | null
    max_playtime?: number | null
    description?: string | null
  }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user owns this game before allowing edit
  const { data: userGame } = await supabase
    .from('user_games')
    .select('id')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .maybeSingle()

  if (!userGame) {
    return { error: 'You can only edit games in your collection' }
  }

  const { error } = await supabase
    .from('games')
    .update(updates)
    .eq('id', gameId)

  if (error) {
    console.error('Error updating game:', error)
    return { error: error.message }
  }

  revalidatePath('/collection')
  revalidatePath(`/game/${gameId}`)
  return { success: true }
}

// Fetch a game by its UUID for the game detail page
export async function getGameById(gameId: string) {
  const supabase = await createClient()
  
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching game:', error)
    return { error: error.message, game: null, userGame: null }
  }

  if (!game) {
    return { error: 'Game not found', game: null, userGame: null }
  }

  // Check if current user owns this game
  const { data: { user } } = await supabase.auth.getUser()
  let userGame = null
  
  if (user) {
    const { data } = await supabase
      .from('user_games')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .maybeSingle()
    userGame = data
  }

  return { game, userGame, error: null }
}

// List the expansion catalog for a base game, flagging which ones the current
// user owns.
export async function getGameExpansions(gameId: string) {
  const supabase = await createClient()

  const { data: expansions, error } = await supabase
    .from('game_expansions')
    .select('*')
    .eq('base_game_id', gameId)
    .order('sort_order', { ascending: true })
    .order('year', { ascending: true })

  if (error) {
    console.error('Error fetching expansions:', error)
    return { error: error.message, expansions: [] }
  }

  const { data: { user } } = await supabase.auth.getUser()
  let ownedIds = new Set<string>()

  if (user && expansions?.length) {
    const { data: owned } = await supabase
      .from('user_game_expansions')
      .select('game_expansion_id')
      .eq('user_id', user.id)
      .in('game_expansion_id', expansions.map((e) => e.id))
    ownedIds = new Set((owned || []).map((o) => o.game_expansion_id))
  }

  return {
    expansions: (expansions || []).map((e) => ({ ...e, owned: ownedIds.has(e.id) })),
    error: null,
  }
}

// Toggle whether the current user owns a given expansion.
export async function toggleGameExpansionOwnership(
  gameExpansionId: string,
  owned: boolean,
  gameId?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (owned) {
    const { error } = await supabase
      .from('user_game_expansions')
      .insert({ user_id: user.id, game_expansion_id: gameExpansionId })
    // Ignore unique-violation (already owned) so the action is idempotent.
    if (error && error.code !== '23505') {
      console.error('Error adding expansion ownership:', error)
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('user_game_expansions')
      .delete()
      .eq('user_id', user.id)
      .eq('game_expansion_id', gameExpansionId)
    if (error) {
      console.error('Error removing expansion ownership:', error)
      return { error: error.message }
    }
  }

  revalidatePath('/collection')
  if (gameId) revalidatePath(`/game/${gameId}`)
  return { success: true }
}


