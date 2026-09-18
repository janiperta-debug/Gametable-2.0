"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "@/lib/i18n"
import { ArchiveButton, ArchiveCard, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle, ArchiveDivider } from "@/components/archive-frame"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Gamepad2, Star, UserPlus, UserCheck, Clock, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { sendFriendRequest as sendFriendRequestServer, acceptFriendRequest as acceptFriendRequestServer } from "@/app/actions/friends"

interface Profile {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  xp: number | null
  level: number | null
  show_collection: boolean | null
}

interface Game {
  id: string
  name: string
  thumbnail_url: string | null
  category: string | null
  min_players: number | null
  max_players: number | null
  year: number | null
}

interface CategoryCounts {
  boardGames: number
  rpg: number
  miniatures: number
  tradingCards: number
}

const INTEREST_LABELS: Record<string, string> = {
  boardGames: "profile.boardAndCardGames",
  tradingCards: "profile.tradingCards",
  miniatures: "profile.otherMiniatureGames",
  rpg: "profile.roleplayingGames",
}

const CATEGORY_LABELS: Record<string, string> = {
  board_game: "Lautapeli",
  rpg: "Roolipeli",
  trading_card: "Keräilykortti",
  miniature: "Miniatyyri",
}

interface PublicProfileClientProps {
  profile: Profile
  gameInterests: string[] | null
  gameCount: number
  games: Game[]
  categoryCounts: CategoryCounts
  currentUserId: string | null
  initialFriendshipStatus: "none" | "pending" | "accepted" | "incoming"
  initialFriendshipId: string | null
}

export function PublicProfileClient({
  profile,
  gameInterests,
  gameCount,
  games,
  categoryCounts,
  currentUserId,
  initialFriendshipStatus,
  initialFriendshipId,
}: PublicProfileClientProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const [friendshipStatus, setFriendshipStatus] = useState(initialFriendshipStatus)
  const [friendshipId] = useState(initialFriendshipId)
  const [loading, setLoading] = useState(false)
  const [showAllGames, setShowAllGames] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const isOwnProfile = currentUserId === profile.id
  const displayName = profile.display_name || profile.username || "Anonymous"

  // Helper to categorize a game
  function getGameCategory(game: Game): string {
    const cat = game.category?.toLowerCase() || ""
    if (cat.includes("rpg") || cat.includes("role")) return "rpg"
    if (cat.includes("miniature") || cat.includes("wargame")) return "miniatures"
    if (cat.includes("trading") || cat.includes("tcg") || cat.includes("card game")) return "tradingCards"
    return "boardGames"
  }

  // Filter games by category
  const filteredGames = categoryFilter 
    ? games.filter(game => getGameCategory(game) === categoryFilter)
    : games
  
  // Show limited or all games
  const displayedGames = showAllGames ? filteredGames : filteredGames.slice(0, 20)

  async function handleSendFriendRequest() {
    if (!currentUserId) return
    
    setLoading(true)
    const result = await sendFriendRequestServer(profile.id)
    
    if (result.error) {
      toast({
        title: t("common.error"),
        description: result.error,
        variant: "destructive",
      })
    } else {
      setFriendshipStatus("pending")
      toast({
        title: t("common.success"),
        description: t("friends.requestSent"),
      })
    }
    setLoading(false)
  }

  async function handleAcceptFriendRequest() {
    if (!currentUserId || !friendshipId) return
    
    setLoading(true)
    const result = await acceptFriendRequestServer(friendshipId)
    
    if (result.error) {
      toast({
        title: t("common.error"),
        description: result.error,
        variant: "destructive",
      })
    } else {
      setFriendshipStatus("accepted")
      toast({
        title: t("common.success"),
        description: t("friends.requestAccepted"),
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen room-environment">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <ArchiveButton
          className="mb-4"
          onClick={() => window.history.back()}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          {t("common.back")}
        </ArchiveButton>

        {/* Profile Header */}
        <ArchiveCard className="mb-6">
          <ArchiveCardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24 border-2 border-accent-gold">
                <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-accent-gold/20 text-accent-gold text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-heading text-accent-gold mb-1">
                  {displayName}
                </h1>
                {profile.username && profile.display_name && (
                  <p className="text-muted-foreground text-sm mb-2">@{profile.username}</p>
                )}
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground mb-3">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-accent-gold" />
                    {t("profile.level")} {profile.level || 1}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="h-4 w-4" />
                    {gameCount} {t("collection.games")}
                  </span>
                </div>

                {profile.bio && (
                  <p className="text-foreground/80 mb-4">{profile.bio}</p>
                )}

                {/* Game Interests */}
                {gameInterests && gameInterests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {gameInterests.map((interest) => (
                      <span key={interest} className="rounded-full border border-accent-gold/50 bg-accent-gold/10 px-3 py-1 text-sm text-accent-gold">
                        {INTEREST_LABELS[interest] ? t(INTEREST_LABELS[interest]) : interest}
                      </span>
                    ))}
                  </div>
                )}

                {/* Friend Actions */}
                {!isOwnProfile && currentUserId && (
                  <div className="mt-4">
                    {friendshipStatus === "none" && (
                      <ArchiveButton
                        onClick={handleSendFriendRequest}
                        disabled={loading}
                        active
                        icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      >
                        {t("friends.sendRequest")}
                      </ArchiveButton>
                    )}
                    {friendshipStatus === "pending" && (
                      <ArchiveButton disabled icon={<Clock className="h-4 w-4" />}>
                        {t("friends.requestPending")}
                      </ArchiveButton>
                    )}
                    {friendshipStatus === "incoming" && (
                      <ArchiveButton
                        onClick={handleAcceptFriendRequest}
                        disabled={loading}
                        active
                        icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                      >
                        {t("friends.acceptRequest")}
                      </ArchiveButton>
                    )}
                    {friendshipStatus === "accepted" && (
                      <ArchiveButton disabled active icon={<UserCheck className="h-4 w-4" />}>
                        {t("friends.alreadyFriends")}
                      </ArchiveButton>
                    )}
                  </div>
                )}

                {isOwnProfile && (
                  <Link href="/profile">
                    <ArchiveButton className="mt-4">
                      {t("profile.editProfile")}
                    </ArchiveButton>
                  </Link>
                )}
              </div>
            </div>
          </ArchiveCardContent>
        </ArchiveCard>

        {/* Category Breakdown */}
        {profile.show_collection !== false && games.length > 0 && (
          <ArchiveCard className="mb-6">
            <ArchiveCardHeader>
              <ArchiveCardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                {t("collection.title")} ({gameCount})
              </ArchiveCardTitle>
            </ArchiveCardHeader>
            <ArchiveCardContent>
              {/* Category filter badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => { setCategoryFilter(null); setShowAllGames(false); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    categoryFilter === null 
                      ? "bg-accent-gold text-background" 
                      : "bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20"
                  }`}
                >
                  {t("collection.allItems")} ({games.length})
                </button>
                {categoryCounts.boardGames > 0 && (
                  <button
                    onClick={() => { setCategoryFilter("boardGames"); setShowAllGames(false); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === "boardGames" 
                        ? "bg-accent-gold text-background" 
                        : "bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20"
                    }`}
                  >
                    {t("profile.boardAndCardGames")} ({categoryCounts.boardGames})
                  </button>
                )}
                {categoryCounts.rpg > 0 && (
                  <button
                    onClick={() => { setCategoryFilter("rpg"); setShowAllGames(false); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === "rpg" 
                        ? "bg-accent-gold text-background" 
                        : "bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20"
                    }`}
                  >
                    {t("profile.roleplayingGames")} ({categoryCounts.rpg})
                  </button>
                )}
                {categoryCounts.miniatures > 0 && (
                  <button
                    onClick={() => { setCategoryFilter("miniatures"); setShowAllGames(false); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === "miniatures" 
                        ? "bg-accent-gold text-background" 
                        : "bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20"
                    }`}
                  >
                    {t("profile.otherMiniatureGames")} ({categoryCounts.miniatures})
                  </button>
                )}
                {categoryCounts.tradingCards > 0 && (
                  <button
                    onClick={() => { setCategoryFilter("tradingCards"); setShowAllGames(false); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === "tradingCards" 
                        ? "bg-accent-gold text-background" 
                        : "bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20"
                    }`}
                  >
                    {t("profile.tradingCards")} ({categoryCounts.tradingCards})
                  </button>
                )}
              </div>

              {/* Game list view */}
              <div className={`${showAllGames ? "max-h-[70vh]" : "max-h-[400px]"} overflow-y-auto`}>
                {displayedGames.map((game, index) => (
                  <div key={game.id}>
                    <div className="flex items-center gap-3 py-3">
                    <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-accent-gold/10">
                      {game.thumbnail_url ? (
                        <Image
                          src={game.thumbnail_url}
                          alt={game.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="h-5 w-5 text-accent-gold/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{game.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {game.min_players && game.max_players && (
                          <span>{game.min_players}-{game.max_players} {t("game.players")}</span>
                        )}
                        {game.year && (
                          <span>{game.year}</span>
                        )}
                      </div>
                    </div>
                    </div>
                    {index < displayedGames.length - 1 && <ArchiveDivider className="my-1" />}
                  </div>
                ))}
              </div>
              
              {/* Show more/less button */}
              {filteredGames.length > 20 && (
                <div className="mt-4 text-center">
                  <ArchiveButton
                    onClick={() => setShowAllGames(!showAllGames)}
                  >
                    {showAllGames 
                      ? t("common.showLess")
                      : `${t("common.showAll")} (+${filteredGames.length - 20} ${t("collection.moreGames")})`
                    }
                  </ArchiveButton>
                </div>
              )}
            </ArchiveCardContent>
          </ArchiveCard>
        )}

        {/* No Collection Message */}
        {profile.show_collection === false && (
          <ArchiveCard>
            <ArchiveCardContent className="py-8 text-center text-muted-foreground">
              {t("profile.collectionHidden")}
            </ArchiveCardContent>
          </ArchiveCard>
        )}
      </div>
    </div>
  )
}
