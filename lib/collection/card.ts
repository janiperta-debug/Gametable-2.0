import type {
  BoardRPGCollectionCardData,
  CollectionCardItem,
  CollectionEntry,
  MiniatureCollectionCardData,
  TCGCollectionCardData,
} from '@/lib/types/collection'
import type { UserGameWithGame } from '@/lib/types/database'

export function buildBoardRPGCardsFromEntries(
  entries: CollectionEntry[],
  userGames: UserGameWithGame[] = [],
): CollectionCardItem[] {
  const byOwnershipId = new Map(userGames.map((userGame) => [userGame.id, userGame]))

  return entries
    .filter((entry) => entry.domain === 'board_game' || entry.domain === 'rpg')
    .map((entry) => {
      const userGame = byOwnershipId.get(entry.ownershipId) ?? null
      const game = userGame?.game ?? null

      const card: BoardRPGCollectionCardData = {
        kind: 'board-rpg',
        id: entry.catalogId,
        title: entry.displayName || game?.name || 'Unknown game',
        image: entry.image || game?.image_url || game?.thumbnail_url || '/placeholder.svg',
        rating: userGame?.personal_rating ?? game?.bgg_rating ?? 0,
        playerCount: game?.min_players && game?.max_players ? `${game.min_players}-${game.max_players}` : '?',
        minPlayers: game?.min_players ?? 1,
        maxPlayers: game?.max_players ?? 4,
        playTime: game?.min_playtime && game?.max_playtime ? `${game.min_playtime}-${game.max_playtime}` : '?',
        minPlayTime: game?.min_playtime ?? 30,
        maxPlayTime: game?.max_playtime ?? 60,
        category: game?.category || entry.domain,
        yearPublished: game?.year ?? 0,
        owned: entry.status === 'owned',
        wishlist: entry.status === 'wishlist',
        forTrade: false,
        userGameId: userGame?.id ?? entry.ownershipId,
        ownedExpansionCount: userGame?.ownedExpansionCount ?? 0,
        totalExpansionCount: userGame?.totalExpansionCount ?? 0,
        expansions: userGame?.expansions ?? [],
      }

      return { entry, card }
    })
}

export function buildTCGCardsFromEntries(entries: CollectionEntry[]): CollectionCardItem[] {
  return entries
    .filter((entry) => entry.domain === 'tcg')
    .map((entry) => {
      const card: TCGCollectionCardData = {
        kind: 'tcg',
        id: entry.catalogId,
        title: entry.displayName || 'Unknown card',
        image: entry.image || '/placeholder.svg',
        quantity: typeof entry.metadata.quantity === 'number' ? entry.metadata.quantity : 1,
        condition: typeof entry.metadata.condition === 'string' ? entry.metadata.condition : null,
        foil: entry.metadata.foil === true,
        tcgSystem: typeof entry.metadata.tcg_system === 'string' ? entry.metadata.tcg_system : null,
        setName: typeof entry.metadata.set_name === 'string' ? entry.metadata.set_name : null,
        setCode: typeof entry.metadata.set_code === 'string' ? entry.metadata.set_code : null,
        rarity: typeof entry.metadata.rarity === 'string' ? entry.metadata.rarity : null,
      }

      return { entry, card }
    })
}

export function buildMiniatureCardsFromEntries(entries: CollectionEntry[]): CollectionCardItem[] {
  return entries
    .filter((entry) => entry.domain === 'miniature')
    .map((entry) => {
      const card: MiniatureCollectionCardData = {
        kind: 'miniature',
        id: entry.catalogId,
        title: entry.displayName || 'Unknown miniature',
        image: entry.image || '/placeholder.svg',
        modelCount: typeof entry.metadata.model_count === 'number' ? entry.metadata.model_count : null,
        pointsTotal: typeof entry.metadata.points_total === 'number' ? entry.metadata.points_total : null,
        paintStatus: typeof entry.metadata.paint_status === 'string' ? entry.metadata.paint_status : null,
        unitType: typeof entry.metadata.unit_type === 'string' ? entry.metadata.unit_type : null,
        faction: typeof entry.metadata.faction === 'string' ? entry.metadata.faction : null,
        system: typeof entry.metadata.system_name === 'string' ? entry.metadata.system_name : null,
        isWarlord: entry.metadata.is_warlord === true,
      }

      return { entry, card }
    })
}

export function buildCollectionCardsFromEntries(
  entries: CollectionEntry[],
  userGames: UserGameWithGame[] = [],
): CollectionCardItem[] {
  const boardRpgCards = buildBoardRPGCardsFromEntries(entries, userGames)
  const tcgCards = buildTCGCardsFromEntries(entries)
  const miniatureCards = buildMiniatureCardsFromEntries(entries)

  return [...boardRpgCards, ...tcgCards, ...miniatureCards]
}
