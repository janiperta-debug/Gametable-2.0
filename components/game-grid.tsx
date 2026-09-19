"use client"

import { CollectionCard } from "@/components/collection-card"
import { RPGCollectionGroup } from "@/components/rpg-collection-group"
import type { CollectionCardItem } from "@/lib/types/collection"

interface GameGridProps {
  cards?: CollectionCardItem[]
  onToggleForTrade?: (gameId: string) => void
  onToggleWishlist?: (gameId: string, domain: CollectionCardItem["entry"]["domain"]) => void
  showMarketplaceButton?: boolean
  showWishlistButton?: boolean
}

type RPGCardItem = Extract<CollectionCardItem, { card: { kind: 'board-rpg' } }>

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
  cards,
  onToggleForTrade,
  onToggleWishlist,
  showMarketplaceButton = false,
  showWishlistButton = false,
}: GameGridProps) {
  const resolvedCards = cards ?? []

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
