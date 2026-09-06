import type { CollectionEntry, CollectionCardItem, BoardRPGCollectionCardData } from '@/lib/types/collection'
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
