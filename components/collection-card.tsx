"use client"

import { ArchiveCard, ArchiveCardButton, ArchiveIconButton } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Clock, Heart, ShoppingBag, Store, Puzzle, ChevronDown, Layers } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "@/lib/i18n"
import type { CollectionCardItem } from "@/lib/types/collection"

const CATEGORY_LABELS: Record<string, string> = {
  board_game: "Lautapeli",
  rpg: "Roolipeli",
  trading_card: "Keräilykortti",
  miniature: "Miniatyyri",
}

interface CollectionCardProps {
  item: CollectionCardItem
  onToggleForTrade?: (gameId: string) => void
  onToggleWishlist?: (gameId: string) => void
  showMarketplaceButton?: boolean
  showWishlistButton?: boolean
}

function assertUnreachableCardKind(card: never): never {
  throw new Error(`Unsupported Collection card kind: ${String(card)}`)
}

export function CollectionCard({
  item,
  onToggleForTrade,
  onToggleWishlist,
  showMarketplaceButton = false,
  showWishlistButton = false,
}: CollectionCardProps) {
  const t = useTranslations()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const { card, entry } = item

  if (card.kind === 'tcg') {
    const set = [card.setName, card.setCode ? `(${card.setCode})` : null].filter(Boolean).join(' ')

    return (
      <ArchiveCard corners={false} centerOrnaments={false} className="group">
        <div className="p-4">
          <div className="relative mb-4">
            <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-surface/50">
              <Image src={card.image} alt={card.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-1">{card.title}</h3>
              <div className="flex flex-wrap gap-2">
                {card.tcgSystem && <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold font-body">{card.tcgSystem}</Badge>}
                {card.rarity && <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold font-body">{card.rarity}</Badge>}
              </div>
            </div>
            {(set || card.quantity > 0) && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {set && <span className="truncate">{set}</span>}
                <span className="flex shrink-0 items-center gap-1"><Layers className="h-4 w-4" />{card.quantity}</span>
              </div>
            )}
          </div>
        </div>
      </ArchiveCard>
    )
  }

  if (card.kind !== 'board-rpg') {
    return assertUnreachableCardKind(card)
  }

  const expansions = card.expansions || []
  const ownedCount = card.ownedExpansionCount ?? expansions.filter((exp) => exp.owned).length
  const totalCount = card.totalExpansionCount ?? expansions.length

  return (
    <ArchiveCard corners={false} centerOrnaments={false} className="group">
      <div className="p-4">
        <div className="relative mb-4">
          <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-surface/50">
            <Image
              src={card.image || "/placeholder.svg"}
              alt={card.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {card.forTrade && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-green-600/90 text-white font-body">
                  <ShoppingBag className="h-3 w-3 mr-1" />
                  For Trade
                </Badge>
              </div>
            )}
            {card.wishlist && !card.owned && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-accent-gold/90 text-background font-body">
                  <Heart className="h-3 w-3 mr-1 fill-current" />
                  {t("collection.wishlist")}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-heading font-semibold text-lg mb-1">{card.title}</h3>
            <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold font-body">
              {CATEGORY_LABELS[card.category] || card.category}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent-gold text-accent-gold" />
              <span className="font-medium">{card.rating}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{card.playerCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{card.playTime}m</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {entry.detailTarget && (card.owned || card.wishlist) ? (
              <ArchiveCardButton asChild fullWidth className="flex-1">
                <Link href={entry.detailTarget}>{t("collection.viewDetails")}</Link>
              </ArchiveCardButton>
            ) : (
              <ArchiveCardButton active fullWidth className="flex-1">
                {t("collection.addToCollection")}
              </ArchiveCardButton>
            )}
            {showMarketplaceButton && card.owned && (
              <ArchiveIconButton
                icon={<Store className="h-4 w-4" />}
                onClick={() => router.push(`/marketplace/create?gameId=${card.userGameId || entry.catalogId}`)}
                title={t("marketplace.listOnMarketplace")}
                aria-label={t("marketplace.listOnMarketplace")}
              />
            )}
            {showWishlistButton && (
              <ArchiveIconButton
                icon={<Heart className={`h-4 w-4 ${card.wishlist ? "fill-current" : ""}`} />}
                active={card.wishlist}
                onClick={() => onToggleWishlist?.(card.id)}
                aria-label={t("collection.wishlist")}
              />
            )}
          </div>

          {totalCount > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-2 rounded-md border border-accent-gold/20 bg-surface/40 px-3 py-2 text-sm font-body text-accent-gold transition-colors hover:bg-surface/70 min-h-11"
              >
                <span className="flex items-center gap-2">
                  <Puzzle className="h-4 w-4" />
                  {t("game.expansionsProgress", { owned: ownedCount, total: totalCount })}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>

              {expanded && (
                <ul className="mt-2 space-y-1 border-l border-accent-gold/20 pl-3">
                  {expansions.map((exp) => (
                    <li
                      key={exp.id}
                      className={`flex items-center gap-2 py-1 ${exp.owned ? "" : "opacity-40"}`}
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-surface/50">
                        <Image
                          src={exp.image_url || "/placeholder.svg"}
                          alt={exp.name}
                          fill
                          className={`object-cover ${exp.owned ? "" : "grayscale"}`}
                        />
                      </div>
                      <span className="font-body text-sm text-foreground/90 line-clamp-2">{exp.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </ArchiveCard>
  )
}
