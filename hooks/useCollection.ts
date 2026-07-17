'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserGameWithGame, OwnedExpansion } from '@/lib/types/database'

export function useCollection() {
  const [games, setGames] = useState<UserGameWithGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGames = useCallback(async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setError('Not authenticated')
      return
    }

    const { data, error: fetchError } = await supabase
      .from('user_games')
      .select(`
        *,
        game:games(*)
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    // Fetch owned expansions (with details) per base game so cards can list
    // them as expandable children.
    const { data: ownedExpansions } = await supabase
      .from('user_game_expansions')
      .select('game_expansion:game_expansions(id, base_game_id, name, year, image_url)')
      .eq('user_id', user.id)

    const expansionsByGameId = new Map<string, OwnedExpansion[]>()
    for (const row of ownedExpansions || []) {
      // Supabase types embedded relations as an array; take the first.
      const rel = row.game_expansion as unknown as OwnedExpansion[] | OwnedExpansion | null
      const exp = Array.isArray(rel) ? rel[0] : rel
      if (exp?.base_game_id) {
        const list = expansionsByGameId.get(exp.base_game_id) || []
        list.push(exp)
        expansionsByGameId.set(exp.base_game_id, list)
      }
    }

    setGames(
      (data || []).map((ug) => {
        const expansions = expansionsByGameId.get(ug.game_id) || []
        return {
          ...ug,
          ownedExpansions: expansions,
          ownedExpansionCount: expansions.length,
        }
      })
    )
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  // Subscribe to real-time changes
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('user_games_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_games',
        },
        () => {
          fetchGames()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchGames])

  return { games, loading, error, refetch: fetchGames }
}
