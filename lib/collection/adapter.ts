import type { CollectionDomain, CollectionEntry, CollectionMetadata, CollectionStatus } from '@/lib/types/collection'

interface GameRowLike {
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
}

interface UserGameRowLike {
  id: string
  game_id: string
  status?: string | null
  game?: GameRowLike | null
}

interface TCGCardRowLike {
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
}

interface TCGCollectionRowLike {
  id: string
  card_id?: string | null
  status?: string | null
  quantity?: number | null
  card?: TCGCardRowLike | null
}

interface MiniatureUnitRowLike {
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
}

interface MiniatureCollectionRowLike {
  id: string
  unit_id?: string | null
  status?: string | null
  quantity?: number | null
  paint_status?: string | null
  notes?: string | null
  unit?: MiniatureUnitRowLike | null
}

function normalizeStatus(status?: string | null): CollectionStatus {
  switch (status) {
    case 'wishlist':
      return 'wishlist'
    case 'previously_owned':
      return 'previously_owned'
    case 'owned':
    default:
      return 'owned'
  }
}

function buildGameMetadata(game: GameRowLike | null | undefined): CollectionMetadata {
  const metadata: CollectionMetadata = {}

  if (!game) {
    return metadata
  }

  if (game.year != null) metadata.year = game.year
  if (game.category) metadata.category = game.category
  if (game.min_players != null || game.max_players != null) {
    metadata.players = {
      min: game.min_players ?? null,
      max: game.max_players ?? null,
    }
  }
  if (game.min_playtime != null || game.max_playtime != null) {
    metadata.playtime = {
      min: game.min_playtime ?? null,
      max: game.max_playtime ?? null,
    }
  }
  if (game.bgg_rating != null) metadata.rating = game.bgg_rating

  return metadata
}

export function mapUserGameToCollectionEntry(row: UserGameRowLike): CollectionEntry {
  const game = row.game ?? null
  const normalizedStatus = normalizeStatus(row.status)
  const catalogId = game?.id ?? row.game_id
  const domain: CollectionDomain = game?.category === 'rpg' ? 'rpg' : 'board_game'

  return {
    domain,
    catalogId,
    ownershipId: row.id,
    displayName: game?.name ?? 'Unknown game',
    image: game?.image_url ?? game?.thumbnail_url ?? null,
    status: normalizedStatus,
    detailTarget: catalogId ? `/game/${catalogId}` : null,
    metadata: buildGameMetadata(game),
  }
}

export function mapTCGCollectionToCollectionEntry(row: TCGCollectionRowLike): CollectionEntry {
  const card = row.card ?? null
  const normalizedStatus = normalizeStatus(row.status)
  const catalogId = card?.id ?? row.card_id ?? 'unknown-card'
  const metadata: CollectionMetadata = {
    quantity: row.quantity ?? 1,
  }

  if (card?.tcg_system) metadata.tcg_system = card.tcg_system
  if (card?.external_id) metadata.external_id = card.external_id
  if (card?.set_name) metadata.set_name = card.set_name
  if (card?.set_code) metadata.set_code = card.set_code
  if (card?.rarity) metadata.rarity = card.rarity
  if (card?.mana_cost) metadata.mana_cost = card.mana_cost
  if (card?.type_line || card?.card_type) metadata.type_line = card?.type_line ?? card?.card_type ?? null
  if (card?.cmc != null) metadata.cmc = card.cmc

  return {
    domain: 'tcg',
    catalogId,
    ownershipId: row.id,
    displayName: card?.name ?? 'Unknown card',
    image: card?.image_url ?? null,
    status: normalizedStatus,
    detailTarget: null,
    metadata,
  }
}

export function mapMiniatureCollectionToCollectionEntry(row: MiniatureCollectionRowLike): CollectionEntry {
  const unit = row.unit ?? null
  const normalizedStatus = normalizeStatus(row.status)
  const catalogId = unit?.id ?? row.unit_id ?? 'unknown-unit'

  const metadata: CollectionMetadata = {
    quantity: row.quantity ?? 1,
  }

  if (row.paint_status) metadata.paint_status = row.paint_status
  if (row.notes) metadata.notes = row.notes
  if (unit?.system?.code) metadata.system = unit.system.code
  if (unit?.system?.name) metadata.system_name = unit.system.name
  if (unit?.faction?.name) metadata.faction = unit.faction.name
  if (unit?.type) metadata.unit_type = unit.type
  if (unit?.points != null) metadata.points = unit.points
  if (unit?.model_count != null) metadata.model_count = unit.model_count

  return {
    domain: 'miniature',
    catalogId,
    ownershipId: row.id,
    displayName: unit?.name ?? 'Unknown miniature',
    image: null,
    status: normalizedStatus,
    detailTarget: null,
    metadata,
  }
}

export function mapUserGameExpansionToCollectionEntry(row: {
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
}): CollectionEntry | null {
  const expansion = row.game_expansion ?? null
  if (!expansion) {
    return null
  }

  const baseGame = expansion.base_game ?? null
  const catalogId = expansion.id ?? row.game_expansion_id ?? 'unknown-expansion'
  const hrefTarget = baseGame?.id ? `/game/${baseGame.id}` : null
  const domain: CollectionDomain = baseGame?.category === 'rpg' ? 'rpg' : 'board_game'

  const metadata: CollectionMetadata = {
    expansion_name: expansion.name ?? null,
    base_game_id: expansion.base_game_id ?? null,
    base_game_name: baseGame?.name ?? null,
    year: expansion.year ?? null,
  }

  return {
    domain,
    catalogId,
    ownershipId: row.id,
    displayName: expansion.name ?? baseGame?.name ?? 'Unknown expansion',
    image: expansion.image_url ?? null,
    status: normalizeStatus(row.status),
    detailTarget: hrefTarget,
    metadata,
  }
}
