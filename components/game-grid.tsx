"use client"

import { CollectionCard } from "@/components/collection-card"
import type { CollectionCardItem } from "@/lib/types/collection"
import type { Game } from "@/lib/mock-games"

interface GameGridProps {
  games?: Game[]
  cards?: CollectionCardItem[]
  onToggleForTrade?: (gameId: string) => void
  onToggleWishlist?: (gameId: string) => void
  showMarketplaceButton?: boolean
  showWishlistButton?: boolean
}

function legacyGameToCollectionCardItem(game: Game): CollectionCardItem {
  const entryDomain = game.category === "rpg" ? "rpg" : "board_game"

  const entry = {
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
  }

  return {
    entry,
    card: {
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

export function GameGrid({
  games,
  cards,
  onToggleForTrade,
  onToggleWishlist,
  showMarketplaceButton = false,
  showWishlistButton = false,
}: GameGridProps) {
  const resolvedCards = cards ?? (games ? games.map(legacyGameToCollectionCardItem) : [])

  if (resolvedCards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-body text-lg">No games found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resolvedCards.map((item) => (
        <CollectionCard
          key={item.entry.ownershipId}
          item={item}
          onToggleForTrade={onToggleForTrade}
          onToggleWishlist={onToggleWishlist}
          showMarketplaceButton={showMarketplaceButton}
          showWishlistButton={showWishlistButton}
        />
      ))}
    </div>
  )
}
