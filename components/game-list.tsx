"use client"

import { ArchiveCard, ArchiveCardButton, ArchiveIconButton } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Clock, Heart, MoreVertical, Puzzle, ChevronDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Game } from "@/lib/mock-games"
import type { CollectionCardItem } from "@/lib/types/collection"

interface GameListProps {
  games?: Game[]
  cards?: CollectionCardItem[]
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

export function GameList({ games, cards }: GameListProps) {
  const resolvedCards = cards ?? (games ? games.map(legacyGameToCollectionCardItem) : [])

  if (resolvedCards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-body text-lg">No games found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {resolvedCards.map((item) => (
        <GameListItem key={item.entry.ownershipId} item={item} />
      ))}
    </div>
  )
}

function GameListItem({ item }: { item: CollectionCardItem }) {
  const { card, entry } = item
  const expansions = card.expansions || []
  const ownedCount = card.ownedExpansionCount ?? expansions.filter((exp) => exp.owned).length
  const totalCount = card.totalExpansionCount ?? expansions.length

  return (
    <ArchiveCard corners={false} centerOrnaments={false} className="group">
      <div className="flex gap-4 p-4">
        <div className="relative w-24 h-32 flex-shrink-0">
          <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-surface/50 w-full h-full">
            <Image src={card.image || "/placeholder.svg"} alt={card.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-heading font-semibold text-xl mb-1">{card.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold">
                    {card.category}
                  </Badge>
                  {card.wishlist && !card.owned && (
                    <Badge variant="secondary" className="bg-accent-gold/90 text-background text-xs">
                      <Heart className="h-3 w-3 mr-1 fill-current" />
                      Wishlist
                    </Badge>
                  )}
                </div>
              </div>
              <ArchiveIconButton icon={<MoreVertical className="h-4 w-4" />} aria-label="Lisää toimintoja" />
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-accent-gold text-accent-gold" />
                <span className="font-medium">{card.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{card.playerCount} players</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{card.playTime} min</span>
              </div>
              <span>Published: {card.yearPublished}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {card.owned || card.wishlist ? (
              <ArchiveCardButton asChild fullWidth className="flex-1">
                <Link href={entry.detailTarget || `/game/${entry.catalogId}`}>View details</Link>
              </ArchiveCardButton>
            ) : (
              <ArchiveCardButton active fullWidth className="flex-1">
                Add to collection
              </ArchiveCardButton>
            )}
            <ArchiveIconButton
              icon={<Heart className={`h-4 w-4 ${card.wishlist ? "fill-current" : ""}`} />}
              active={card.wishlist}
              aria-label="Wishlist"
            />
          </div>

          {totalCount > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => undefined}
                aria-expanded={false}
                className="flex w-full items-center justify-between gap-2 rounded-md border border-accent-gold/20 bg-surface/40 px-3 py-2 text-sm font-body text-accent-gold transition-colors hover:bg-surface/70 min-h-11"
              >
                <span className="flex items-center gap-2">
                  <Puzzle className="h-4 w-4" />
                  {ownedCount}/{totalCount} expansions owned
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </ArchiveCard>
  )
}
