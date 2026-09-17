"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, BookOpen } from "lucide-react"
import { ArchiveCard, ArchiveCardButton } from "@/components/archive"
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
  const [expanded, setExpanded] = useState(false)

  return (
    <ArchiveCard corners={false} centerOrnaments={false} className="overflow-hidden">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span className="flex min-w-0 items-center gap-3">
          <BookOpen className="h-5 w-5 shrink-0 text-accent-gold" />
          <span className="min-w-0">
            <span className="block truncate font-heading font-semibold">{name}</span>
            <span className="text-sm text-muted-foreground">{ownedItemCount} / {totalItemCount}</span>
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="grid gap-3 border-t border-accent-gold/20 p-4 sm:grid-cols-2">
          {items.map(({ card, entry }) => (
            <div key={entry.ownershipId} className="flex gap-3">
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-surface/50">
                <Image src={card.image || "/placeholder.svg"} alt={card.title} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{card.title}</div>
                {entry.detailTarget && <ArchiveCardButton asChild className="mt-2"><Link href={entry.detailTarget}>Avaa</Link></ArchiveCardButton>}
              </div>
            </div>
          ))}
        </div>
      )}
    </ArchiveCard>
  )
}
