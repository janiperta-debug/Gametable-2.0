"use client"

import { ArchiveCard, ArchiveCardButton, ArchiveIconButton } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Clock, Heart, MoreVertical, Puzzle, ChevronDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
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
        <GameListItem key={game.id} game={game} />
      ))}
    </div>
  )
}

function GameListItem({ game }: { game: Game }) {
  const t = useTranslations()
  const [expanded, setExpanded] = useState(false)
  const expansionCount = game.ownedExpansionCount || 0
  const expansions = game.ownedExpansions || []

  return (
        <ArchiveCard corners={false} centerOrnaments={false} className="group">
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

              {expansionCount > 0 && (
                <div className="pt-2">
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
