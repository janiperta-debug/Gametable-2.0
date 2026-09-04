import type { CollectionEntry } from '@/lib/types/collection'

import {
  mapMiniatureCollectionToCollectionEntry,
  mapTCGCollectionToCollectionEntry,
  mapUserGameExpansionToCollectionEntry,
  mapUserGameToCollectionEntry,
} from './adapter'

export interface CollectionQueryInputs {
  userGames?: Array<{
    id: string
    game_id: string
    status?: string | null
    game?: {
      id?: string | null
      name?: string | null
      image_url?: string | null
      thumbnail_url?: string | null
      category?: string | null
      year?: number | null
      min_players?: number | null
      max_players?: number | null
      min_playtime?: number | null
      max_playtime?: number | null
      bgg_rating?: number | null
    } | null
  }>
  tcgCollection?: Array<{
    id: string
    card_id?: string | null
    status?: string | null
    quantity?: number | null
    card?: {
      id?: string | null
      external_id?: string | null
      name?: string | null
      tcg_system?: string | null
      set_name?: string | null
      set_code?: string | null
      rarity?: string | null
      image_url?: string | null
      mana_cost?: string | null
      type_line?: string | null
      card_type?: string | null
      cmc?: number | null
      price_usd?: number | null
    } | null
  }>
  miniatureCollection?: Array<{
    id: string
    unit_id?: string | null
    status?: string | null
    quantity?: number | null
    paint_status?: string | null
    notes?: string | null
    unit?: {
      id?: string | null
      external_id?: string | null
      name?: string | null
      type?: string | null
      points?: number | null
      model_count?: number | null
      system?: {
        code?: string | null
        name?: string | null
      } | null
      faction?: {
        name?: string | null
      } | null
    } | null
  }>
  expansions?: Array<{
    id: string
    game_expansion_id?: string | null
    user_id?: string | null
    status?: string | null
    game_expansion?: {
      id?: string | null
      base_game_id?: string | null
      name?: string | null
      year?: number | null
      image_url?: string | null
      base_game?: {
        id?: string | null
        name?: string | null
        category?: string | null
      } | null
    } | null
  }>
}

const DOMAIN_ORDER: Record<string, number> = {
  board_game: 0,
  rpg: 1,
  tcg: 2,
  miniature: 3,
}

export function getCollectionEntries({
  userGames = [],
  tcgCollection = [],
  miniatureCollection = [],
  expansions = [],
}: CollectionQueryInputs = {}): CollectionEntry[] {
  const entries: CollectionEntry[] = []

  for (const row of userGames) {
    entries.push(mapUserGameToCollectionEntry(row))
  }

  for (const row of tcgCollection) {
    entries.push(mapTCGCollectionToCollectionEntry(row))
  }

  for (const row of miniatureCollection) {
    entries.push(mapMiniatureCollectionToCollectionEntry(row))
  }

  for (const row of expansions) {
    const mapped = mapUserGameExpansionToCollectionEntry(row)
    if (mapped) {
      entries.push(mapped)
    }
  }

  return entries.sort((left, right) => {
    const domainDelta = (DOMAIN_ORDER[left.domain] ?? 99) - (DOMAIN_ORDER[right.domain] ?? 99)
    if (domainDelta !== 0) {
      return domainDelta
    }

    const nameDelta = left.displayName.localeCompare(right.displayName)
    if (nameDelta !== 0) {
      return nameDelta
    }

    return left.ownershipId.localeCompare(right.ownershipId)
  })
}
