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

    const gameIds = (data || []).map((ug) => ug.game_id)

    // Fetch the FULL expansion catalog for the user's base games so each host
    // can show every expansion — owned ones in color, missing ones darkened.
    const expansionsByGameId = new Map<string, OwnedExpansion[]>()
    const ownedExpansionIds = new Set<string>()

    if (gameIds.length > 0) {
      const [{ data: catalog }, { data: owned }] = await Promise.all([
        supabase
          .from('game_expansions')
          .select('id, base_game_id, name, year, image_url')
          .in('base_game_id', gameIds)
          .order('sort_order', { ascending: true })
          .order('year', { ascending: true }),
        supabase
          .from('user_game_expansions')
          .select('game_expansion_id')
          .eq('user_id', user.id),
      ])

      for (const o of owned || []) ownedExpansionIds.add(o.game_expansion_id)

      for (const exp of catalog || []) {
        const list = expansionsByGameId.get(exp.base_game_id) || []
        list.push({ ...exp, owned: ownedExpansionIds.has(exp.id) })
        expansionsByGameId.set(exp.base_game_id, list)
      }
    }

    setGames(
      (data || []).map((ug) => {
        const expansions = expansionsByGameId.get(ug.game_id) || []
        return {
          ...ug,
          expansions,
          ownedExpansionCount: expansions.filter((e) => e.owned).length,
          totalExpansionCount: expansions.length,
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
