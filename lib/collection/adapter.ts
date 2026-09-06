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

/**
 * `tcg_collection` has no `status` column in production — every row in this
 * table represents an owned card. Wishlist is tracked separately in
 * `tcg_wishlist` and is intentionally out of scope for this mapper.
 */
interface TCGCollectionRowLike {
  id: string
  card_id?: string | null
  quantity?: number | null
  condition?: string | null
  foil?: boolean | null
  card?: TCGCardRowLike | null
}

interface MiniatureSystemRowLike {
  id?: string | null
  code?: string | null
  name?: string | null
}

interface MiniatureFactionRowLike {
  id?: string | null
  name?: string | null
  system?: MiniatureSystemRowLike | null
}

interface MiniatureUnitRowLike {
  id?: string | null
  name?: string | null
  unit_type?: string | null
  base_points?: number | null
  model_count_min?: number | null
  model_count_max?: number | null
  faction?: MiniatureFactionRowLike | null
}

/**
 * `mini_army_units` has no `status` column in production. Ownership is
 * represented by the `owned` boolean directly on the row.
 */
interface MiniatureCollectionRowLike {
  id: string
  unit_id?: string | null
  owned?: boolean | null
  model_count?: number | null
  points_total?: number | null
  paint_status?: string | null
  custom_name?: string | null
  upgrades?: unknown
  is_warlord?: boolean | null
  unit?: MiniatureUnitRowLike | null
}

function normalizeStatus(status?: string | null): CollectionStatus {
  switch (status) {
    case 'wishlist':
      return 'wishlist'
    case 'previously_owned':
      return 'previously_owned'
    case 'owned':
      return 'owned'
    case undefined:
    case null:
      return 'owned'
    default:
      throw new Error(`Unsupported collection status: ${String(status)}`)
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
  const catalogId = card?.id ?? row.card_id ?? 'unknown-card'
  const metadata: CollectionMetadata = {
    quantity: row.quantity ?? 1,
  }

  if (row.condition) metadata.condition = row.condition
  if (row.foil != null) metadata.foil = row.foil
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
    // tcg_collection has no `status` column in production — every row here
    // is, by definition, an owned card. Wishlist state lives in the separate
    // tcg_wishlist table and is not represented by this mapper.
    status: 'owned',
    detailTarget: null,
    metadata,
  }
}

/**
 * Maps a `mini_army_units` row (joined through `mini_units` -> `mini_factions`
 * -> `mini_systems`) to a shared CollectionEntry. This mapper represents the
 * user's owned Miniatures Collection: callers are expected to have already
 * filtered rows to `owned = true` at the query level, since `owned = false`
 * has no proven wishlist/army-planning semantics in the current application.
 */
export function mapMiniatureCollectionToCollectionEntry(row: MiniatureCollectionRowLike): CollectionEntry {
  if (row.owned !== true) {
    // `owned = false` (or missing/null) has no proven Collection semantics
    // yet (it is not established to mean wishlist/army-planning/etc).
    // Callers must filter to `owned = true` before mapping; fail fast rather
    // than silently mislabel the row as owned.
    throw new Error(
      `mapMiniatureCollectionToCollectionEntry received a mini_army_units row (${row.id}) that is not owned=true; only owned=true rows represent the Collection.`,
    )
  }

  const unit = row.unit ?? null
  const faction = unit?.faction ?? null
  const system = faction?.system ?? null
  const catalogId = unit?.id ?? row.unit_id ?? 'unknown-unit'

  const metadata: CollectionMetadata = {}

  if (row.model_count != null) metadata.model_count = row.model_count
  if (row.points_total != null) metadata.points_total = row.points_total
  if (row.paint_status) metadata.paint_status = row.paint_status
  if (row.custom_name) metadata.custom_name = row.custom_name
  if (row.upgrades != null) metadata.upgrades = row.upgrades
  if (row.is_warlord != null) metadata.is_warlord = row.is_warlord
  if (unit?.unit_type) metadata.unit_type = unit.unit_type
  if (unit?.base_points != null) metadata.base_points = unit.base_points
  if (unit?.model_count_min != null) metadata.model_count_min = unit.model_count_min
  if (unit?.model_count_max != null) metadata.model_count_max = unit.model_count_max
  if (faction?.name) metadata.faction = faction.name
  if (system?.code) metadata.system = system.code
  if (system?.name) metadata.system_name = system.name

  return {
    domain: 'miniature',
    catalogId,
    ownershipId: row.id,
    displayName: row.custom_name || unit?.name || 'Unknown miniature',
    image: null,
    status: 'owned',
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
