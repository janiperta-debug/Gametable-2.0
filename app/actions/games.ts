'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BGGGameDetails } from '@/lib/types/database'

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

export async function addGameToCollection(
  bggDetails: BGGGameDetails,
  status: 'owned' | 'wishlist' = 'owned'
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if game already exists by bgg_id
  let gameId: string
  const { data: existingGame } = await supabase
    .from('games')
    .select('id')
    .eq('bgg_id', bggDetails.id)
    .single()

  if (existingGame) {
    gameId = existingGame.id
  } else {
    // Insert the game
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
        category: 'board-games', // Default category
      })
      .select('id')
      .single()

    if (gameError) {
      console.error('Error inserting game:', gameError)
      return { error: gameError.message }
    }
    gameId = newGame.id
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

  // Award XP
  await awardXP(user.id, XP_FOR_ADDING_GAME)

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

async function awardXP(userId: string, amount: number) {
  const supabase = await createClient()
  
  // Get current XP
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level')
    .eq('id', userId)
    .single()

  if (!profile) return

  const newXP = (profile.xp || 0) + amount
  // Simple level formula: level up every 100 XP
  const newLevel = Math.floor(newXP / 100) + 1

  // Update profile
  await supabase
    .from('profiles')
    .update({ 
      xp: newXP,
      level: newLevel > profile.level ? newLevel : profile.level
    })
    .eq('id', userId)

  // Log XP event (if table exists)
  await supabase
    .from('xp_events')
    .insert({
      user_id: userId,
      amount,
      reason: 'add_game',
    })
    .catch(() => {}) // Ignore if table doesn't exist
}
