"use client"

import { CollectionCard } from "@/components/collection-card"
import { RPGCollectionGroup } from "@/components/rpg-collection-group"
import type { CollectionCardItem } from "@/lib/types/collection"
import type { UserGameWithGame } from "@/lib/types/database"
import type { Game } from "@/lib/mock-games"

interface GameGridProps {
  games?: Game[]
  cards?: CollectionCardItem[]
  onToggleForTrade?: (gameId: string) => void
  onToggleWishlist?: (gameId: string) => void
  showMarketplaceButton?: boolean
  showWishlistButton?: boolean
}

type RPGCardItem = Extract<CollectionCardItem, { card: { kind: 'board-rpg' } }>

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

function getRPGGroups(cards: readonly CollectionCardItem[]) {
  const groups = new Map<
    string,
    {
      name: string
      totalItemCount: number
      ownedItemCount: number
      items: RPGCardItem[]
    }
  >()

  for (const item of cards) {
    if (item.entry.domain !== 'rpg' || item.card.kind !== 'board-rpg') {
      continue
    }

    const rawGroups = item.entry.metadata.rpg_catalogs
    if (!Array.isArray(rawGroups)) {
      continue
    }

    const groupsForItem = rawGroups.filter(
      (group): group is {
        id: string
        name: string
        totalItemCount: number
        ownedItemCount: number
      } =>
        typeof group === 'object' &&
        group !== null &&
        typeof (group as { id?: unknown }).id === 'string' &&
        typeof (group as { name?: unknown }).name === 'string',
    )

    for (const group of groupsForItem) {
      const current = groups.get(group.id) ?? {
        name: group.name,
        totalItemCount: group.totalItemCount,
        ownedItemCount: group.ownedItemCount,
        items: [],
      }
      current.items.push(item as RPGCardItem)
      current.totalItemCount = group.totalItemCount
      current.ownedItemCount = group.ownedItemCount
      groups.set(group.id, current)
    }
  }

  return Array.from(groups.entries())
    .map(([id, group]) => ({ id, ...group }))
    .sort((left, right) => left.name.localeCompare(right.name))
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

  const groups = getRPGGroups(resolvedCards)
  const groupedCards = new Set(groups.flatMap((group) => group.items.map((item) => item.entry.ownershipId)))
  const visibleCards = resolvedCards.filter((item) => !groupedCards.has(item.entry.ownershipId))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <RPGCollectionGroup
          key={group.id}
          name={group.name}
          totalItemCount={group.totalItemCount}
          ownedItemCount={group.ownedItemCount}
          items={group.items}
        />
      ))}
      {visibleCards.map((item) => (
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
