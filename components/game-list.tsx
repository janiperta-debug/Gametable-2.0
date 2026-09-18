"use client"

import { CollectionCard } from "@/components/collection-card"
import type { Game } from "@/lib/mock-games"
import type { CollectionCardItem } from "@/lib/types/collection"

interface GameListProps {
  games?: Game[]
  cards?: CollectionCardItem[]
}

function legacyGameToCollectionCardItem(game: Game): CollectionCardItem {
  const entryDomain = game.category === "rpg" ? "rpg" : "board_game"

  return {
    entry: {
      domain: entryDomain,
      catalogId: game.id,
      ownershipId: game.userGameId || game.id,
      displayName: game.title,
      image: game.image || null,
      status: game.owned ? "owned" : game.wishlist ? "wishlist" : "previously_owned",
      detailTarget: `/game/${game.id}`,
      metadata: {
        category: game.category,
        year: game.yearPublished,
        rating: game.rating,
      },
    },
    card: {
      kind: "board-rpg",
      id: game.id,
      title: game.title,
      image: game.image || "/placeholder.svg",
      rating: game.rating || 0,
      playerCount: game.playerCount || "?",
      minPlayers: game.minPlayers || 1,
      maxPlayers: game.maxPlayers || 4,
      playTime: game.playTime || "?",
      minPlayTime: game.minPlayTime || 30,
      maxPlayTime: game.maxPlayTime || 60,
      category: game.category || "board_game",
      yearPublished: game.yearPublished || 0,
      owned: game.owned,
      wishlist: game.wishlist,
      forTrade: game.forTrade,
      userGameId: game.userGameId,
      ownedExpansionCount: game.ownedExpansionCount || 0,
      totalExpansionCount: game.totalExpansionCount || 0,
      expansions: game.expansions || [],
    },
  }
}

export function GameList({ games, cards }: GameListProps) {
  const resolvedCards = cards ?? (games ? games.map(legacyGameToCollectionCardItem) : [])

  if (resolvedCards.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-body text-lg text-muted-foreground">No games found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-3">
      {resolvedCards.map((item) => (
        <CollectionCard
          key={item.entry.ownershipId}
          item={item}
          variant="list"
          showMarketplaceButton={false}
          showWishlistButton={true}
        />
      ))}
    </div>
  )
}
