"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Clock, Heart, ShoppingBag, Store } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  const t = useTranslations()
  const router = useRouter()
  
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
        <div key={game.id} className="manor-card p-4 group hover:shadow-lg transition-all duration-300">
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
              {(game.owned || game.wishlist) ? (
                <Link href={`/game/${game.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-accent-gold/20 hover:border-accent-gold bg-transparent font-body"
                  >
                    {t("collection.viewDetails")}
                  </Button>
                </Link>
              ) : (
                <Button size="sm" className="flex-1 bg-accent-gold hover:bg-accent-gold/90 text-background font-body">
                  {t("collection.addToCollection")}
                </Button>
              )}
              {showMarketplaceButton && game.owned && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/marketplace/create?gameId=${game.userGameId || game.id}`)}
                  className="border-accent-gold/20 hover:border-accent-gold hover:bg-accent-gold/10 bg-transparent font-body"
                  title={t("marketplace.listOnMarketplace")}
                >
                  <Store className="h-4 w-4" />
                </Button>
              )}
              {showWishlistButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleWishlist?.(game.id)}
                  className={`${game.wishlist ? "text-accent-gold" : "text-muted-foreground"} hover:text-accent-gold`}
                >
                  <Heart className={`h-4 w-4 ${game.wishlist ? "fill-current" : ""}`} />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
