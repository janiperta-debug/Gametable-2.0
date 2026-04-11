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

  return { games: data || [], error: null }
}

export type GameCategory = 'board_game' | 'rpg' | 'trading_card' | 'miniature'

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


