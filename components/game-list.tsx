"use client"

import { CollectionCard } from "@/components/collection-card"
import { ArchiveDivider } from "@/components/archive-divider"
import { ArchiveFrame } from "@/components/archive-frame"
import type { CollectionCardItem } from "@/lib/types/collection"

interface GameListProps {
  cards?: CollectionCardItem[]
  onRemoveTCGCard?: (collectionEntryId: string) => void
  onUpdateCollection?: () => void
}

export function GameList({ cards, onRemoveTCGCard, onUpdateCollection }: GameListProps) {
  const resolvedCards = cards ?? []

  if (resolvedCards.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-body text-lg text-muted-foreground">No games found matching your criteria.</p>
      </div>
    )
  }

  return (
    <ArchiveFrame className="w-full">
      <div className="min-w-0 px-3 sm:px-4">
        {resolvedCards.map((item, index) => (
          <div key={item.entry.ownershipId}>
            <CollectionCard
              item={item}
              variant="list"
              showMarketplaceButton={false}
              showWishlistButton={true}
              onRemoveTCGCard={onRemoveTCGCard}
              onUpdateCollection={onUpdateCollection}
            />
            {index < resolvedCards.length - 1 && <ArchiveDivider className="my-0" />}
          </div>
        ))}
      </div>
    </ArchiveFrame>
  )
}
