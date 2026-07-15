'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserGameWithGame } from '@/lib/types/database'

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

    // Count owned expansions per base game so cards can show a badge.
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

    setGames(
      (data || []).map((ug) => ({
        ...ug,
        ownedExpansionCount: expansionCountByGameId.get(ug.game_id) || 0,
      }))
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
