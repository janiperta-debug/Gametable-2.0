'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCollectionEntries } from '@/lib/collection/orchestrator'
import type { CollectionEntry } from '@/lib/types/collection'
import type { UserGameWithGame, OwnedExpansion } from '@/lib/types/database'

export function useCollection() {
  const [games, setGames] = useState<UserGameWithGame[]>([])
  const [collectionEntries, setCollectionEntries] = useState<CollectionEntry[]>([])
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

    const directGameIds = (data || []).map((ug) => ug.game_id)

    // Also find base games the user owns expansions for but has NOT added
    // directly — these become "expansion-only host" cards.
    const { data: ownedExpData } = await supabase
      .from('user_game_expansions')
      .select('game_expansion_id, game_expansion:game_expansions(id, base_game_id)')
      .eq('user_id', user.id)

    const ownedExpansionIds = new Set<string>()
    const expansionOnlyBaseIds = new Set<string>()
    for (const row of ownedExpData || []) {
      const rel = row.game_expansion as unknown as { id: string; base_game_id: string }[] | { id: string; base_game_id: string } | null
      const exp = Array.isArray(rel) ? rel[0] : rel
      if (exp?.id) ownedExpansionIds.add(exp.id)
      if (exp?.base_game_id && !directGameIds.includes(exp.base_game_id)) {
        expansionOnlyBaseIds.add(exp.base_game_id)
      }
    }

    // Fetch the base game rows for expansion-only hosts.
    const expansionOnlyHostRows: UserGameWithGame[] = []
    if (expansionOnlyBaseIds.size > 0) {
      const { data: hostGames } = await supabase
        .from('games')
        .select('*')
        .in('id', Array.from(expansionOnlyBaseIds))

      for (const g of hostGames || []) {
        expansionOnlyHostRows.push({
          id: `expansion-host-${g.id}`,
          user_id: user.id,
          game_id: g.id,
          game: g,
          status: 'owned',
          added_at: new Date().toISOString(),
          expansions: [],
          ownedExpansionCount: 0,
          totalExpansionCount: 0,
        } as unknown as UserGameWithGame)
      }
    }

    // All game IDs to load the full expansion catalog for.
    const allGameIds = [...directGameIds, ...Array.from(expansionOnlyBaseIds)]

    // Fetch the FULL expansion catalog for all host games so each card shows
    // every expansion — owned ones in color, missing ones darkened.
    const expansionsByGameId = new Map<string, OwnedExpansion[]>()

    if (allGameIds.length > 0) {
      const { data: catalog } = await supabase
        .from('game_expansions')
        .select('id, base_game_id, name, year, image_url')
        .in('base_game_id', allGameIds)
        .order('sort_order', { ascending: true })
        .order('year', { ascending: true })

      for (const exp of catalog || []) {
        const list = expansionsByGameId.get(exp.base_game_id) || []
        list.push({ ...exp, owned: ownedExpansionIds.has(exp.id) })
        expansionsByGameId.set(exp.base_game_id, list)
      }
    }

    const attachExpansions = (ug: UserGameWithGame): UserGameWithGame => {
      const expansions = expansionsByGameId.get(ug.game_id) || []
      return {
        ...ug,
        expansions,
        ownedExpansionCount: expansions.filter((e) => e.owned).length,
        totalExpansionCount: expansions.length,
      }
    }

    const directRows = (data || []).map(attachExpansions)
    const hostRows = expansionOnlyHostRows.map(attachExpansions)
    const mergedRows = [...directRows, ...hostRows]

    const [tcgResult, miniResult] = await Promise.all([
      supabase
        .from('tcg_collection')
        .select(`
          id,
          quantity,
          status,
          added_at,
          card:tcg_cards (
            id,
            external_id,
            name,
            tcg_system,
            set_name,
            set_code,
            rarity,
            image_url,
            mana_cost,
            type_line,
            card_type,
            cmc,
            price_usd
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'owned')
        .order('added_at', { ascending: false }),
      supabase
        .from('mini_army_units')
        .select(`
          id,
          quantity,
          paint_status,
          status,
          notes,
          created_at,
          unit:mini_units (
            id,
            external_id,
            name,
            type,
            points,
            model_count,
            faction:mini_factions (
              id,
              name
            ),
            system:mini_systems (
              id,
              code,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'owned')
        .order('created_at', { ascending: false })
    ])

    setGames(mergedRows)
    setCollectionEntries(
      getCollectionEntries({
        userGames: mergedRows,
        tcgCollection: tcgResult.data || [],
        miniatureCollection: miniResult.data || [],
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

  return { games, collectionEntries, loading, error, refetch: fetchGames }
}
