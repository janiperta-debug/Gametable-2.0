"use client"

import { ArchiveCard, ArchiveCardButton, ArchiveIconButton } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Clock, Heart, MoreVertical } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Game } from "@/lib/mock-games"
import { useTranslations } from "@/lib/i18n"

const CATEGORY_LABELS: Record<string, string> = {
  board_game: "Lautapeli",
  rpg: "Roolipeli",
  trading_card: "Keräilykortti",
  miniature: "Miniatyyri",
}

interface GameListProps {
  games: Game[]
}

export function GameList({ games }: GameListProps) {
  const t = useTranslations()

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-body text-lg">No games found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <ArchiveCard key={game.id} corners={false} centerOrnaments={false} className="group">
          <div className="flex gap-4 p-4">
            <div className="relative w-24 h-32 flex-shrink-0">
              <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-surface/50 w-full h-full">
                <Image
                  src={game.image || "/placeholder.svg"}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-semibold text-xl mb-1">{game.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold">
                        {CATEGORY_LABELS[game.category] || game.category}
                      </Badge>
                      {game.wishlist && !game.owned && (
                        <Badge variant="secondary" className="bg-accent-gold/90 text-background text-xs">
                          <Heart className="h-3 w-3 mr-1 fill-current" />
                          {t("collection.wishlist")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ArchiveIconButton icon={<MoreVertical className="h-4 w-4" />} aria-label="Lisää toimintoja" />
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent-gold text-accent-gold" />
                    <span className="font-medium">{game.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{game.playerCount} players</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{game.playTime} min</span>
                  </div>
                  <span>Published: {game.yearPublished}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {game.owned || game.wishlist ? (
                  <ArchiveCardButton asChild fullWidth className="flex-1">
                    <Link href={`/game/${game.id}`}>{t("collection.viewDetails")}</Link>
                  </ArchiveCardButton>
                ) : (
                  <ArchiveCardButton active fullWidth className="flex-1">
                    {t("collection.addToCollection")}
                  </ArchiveCardButton>
                )}
                <ArchiveIconButton
                  icon={<Heart className={`h-4 w-4 ${game.wishlist ? "fill-current" : ""}`} />}
                  active={game.wishlist}
                  aria-label={t("collection.wishlist")}
                />
              </div>
            </div>
          </div>
        </ArchiveCard>
      ))}
    </div>
  )
}
