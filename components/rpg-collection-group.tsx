"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, BookOpen } from "lucide-react"
import { ArchiveCard, ArchiveCardButton } from "@/components/archive-frame"
import type { CollectionCardItem } from "@/lib/types/collection"

interface RPGCollectionGroupProps {
  name: string
  totalItemCount: number
  ownedItemCount: number
  items: Extract<CollectionCardItem, { card: { kind: 'board-rpg' } }>[]
}

export function RPGCollectionGroup({
  name,
  totalItemCount,
  ownedItemCount,
  items,
}: RPGCollectionGroupProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <ArchiveCard corners={false} centerOrnaments={false} className="group">
      <div className="p-4">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex w-full items-center gap-3 text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-accent-gold/30 bg-surface/50 text-accent-gold">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-semibold text-xl truncate">{name}</h3>
            <p className="font-body text-sm text-muted-foreground">
              {ownedItemCount} / {totalItemCount}
            </p>
          </div>
          <ChevronDown className={`h-5 w-5 shrink-0 text-accent-gold transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="mt-4 space-y-2 border-t border-accent-gold/15 pt-3">
            {items.map(({ entry, card }) => (
              <div
                key={entry.ownershipId}
                className="flex items-center gap-3 rounded-lg border border-accent-gold/10 bg-surface/30 p-2"
              >
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-surface/50">
                  <Image
                    src={card.image || "/placeholder.svg"}
                    alt={card.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-heading text-sm font-semibold line-clamp-2">{card.title}</div>
                  {card.yearPublished > 0 && (
                    <div className="font-body text-xs text-muted-foreground">{card.yearPublished}</div>
                  )}
                </div>

                {entry.detailTarget && (card.owned || card.wishlist) && (
                  <ArchiveCardButton asChild className="shrink-0">
                    <Link href={entry.detailTarget}>Avaa</Link>
                  </ArchiveCardButton>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ArchiveCard>
  )
}
