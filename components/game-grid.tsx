"use client"

import { ArchiveCard, ArchiveCardButton, ArchiveIconButton } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Clock, Heart, ShoppingBag, Store, Puzzle, ChevronDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Game } from "@/lib/mock-games"
import { useTranslations } from "@/lib/i18n"

const CATEGORY_LABELS: Record<string, string> = {
  board_game: "Lautapeli",
  rpg: "Roolipeli",
  trading_card: "Keräilykortti",
  miniature: "Miniatyyri",
}

interface GameGridProps {
  games: Game[]
  onToggleForTrade?: (gameId: string) => void
  onToggleWishlist?: (gameId: string) => void
  showMarketplaceButton?: boolean
  showWishlistButton?: boolean
}

export function GameGrid({
  games,
  onToggleForTrade,
  onToggleWishlist,
  showMarketplaceButton = false,
  showWishlistButton = false,
}: GameGridProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-body text-lg">No games found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          onToggleForTrade={onToggleForTrade}
          onToggleWishlist={onToggleWishlist}
          showMarketplaceButton={showMarketplaceButton}
          showWishlistButton={showWishlistButton}
        />
      ))}
    </div>
  )
}

interface GameCardProps {
  game: Game
  onToggleForTrade?: (gameId: string) => void
  onToggleWishlist?: (gameId: string) => void
  showMarketplaceButton?: boolean
  showWishlistButton?: boolean
}

function GameCard({
  game,
  onToggleWishlist,
  showMarketplaceButton = false,
  showWishlistButton = false,
}: GameCardProps) {
  const t = useTranslations()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  const expansionCount = game.ownedExpansionCount || 0
  const expansions = game.ownedExpansions || []

  return (
    <ArchiveCard corners={false} centerOrnaments={false} className="group">
      <div className="p-4">
            <div className="relative mb-4">
              <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-surface/50">
                <Image
                  src={game.image || "/placeholder.svg"}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {game.forTrade && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-green-600/90 text-white font-body">
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      For Trade
                    </Badge>
                  </div>
                )}
                {game.wishlist && !game.owned && (
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
                <h3 className="font-heading font-semibold text-lg mb-1">{game.title}</h3>
                <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold font-body">
                  {CATEGORY_LABELS[game.category] || game.category}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent-gold text-accent-gold" />
                  <span className="font-medium">{game.rating}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{game.playerCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{game.playTime}m</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {game.owned || game.wishlist ? (
                  <ArchiveCardButton asChild fullWidth className="flex-1">
                    <Link href={`/game/${game.id}`}>{t("collection.viewDetails")}</Link>
                  </ArchiveCardButton>
                ) : (
                  <ArchiveCardButton active fullWidth className="flex-1">
                    {t("collection.addToCollection")}
                  </ArchiveCardButton>
                )}
                {showMarketplaceButton && game.owned && (
                  <ArchiveIconButton
                    icon={<Store className="h-4 w-4" />}
                    onClick={() => router.push(`/marketplace/create?gameId=${game.userGameId || game.id}`)}
                    title={t("marketplace.listOnMarketplace")}
                    aria-label={t("marketplace.listOnMarketplace")}
                  />
                )}
                {showWishlistButton && (
                  <ArchiveIconButton
                    icon={<Heart className={`h-4 w-4 ${game.wishlist ? "fill-current" : ""}`} />}
                    active={game.wishlist}
                    onClick={() => onToggleWishlist?.(game.id)}
                    aria-label={t("collection.wishlist")}
                  />
                )}
              </div>

              {expansionCount > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between gap-2 rounded-md border border-accent-gold/20 bg-surface/40 px-3 py-2 text-sm font-body text-accent-gold transition-colors hover:bg-surface/70 min-h-11"
                  >
                    <span className="flex items-center gap-2">
                      <Puzzle className="h-4 w-4" />
                      {t("game.expansionsOwnedShort", { count: expansionCount })}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>

                  {expanded && (
                    <ul className="mt-2 space-y-1 border-l border-accent-gold/20 pl-3">
                      {expansions.map((exp) => (
                        <li key={exp.id} className="flex items-center gap-2 py-1">
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-surface/50">
                            <Image
                              src={exp.image_url || "/placeholder.svg"}
                              alt={exp.name}
                              fill
                              className="object-cover"
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
