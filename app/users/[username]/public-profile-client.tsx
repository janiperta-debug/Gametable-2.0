"use client"

import { useState } from "react"
import { useTranslations } from "@/lib/i18n"
import { ArchiveCard, ArchiveCardButton } from "@/components/archive-frame"
import { ArchiveDivider } from "@/components/archive-divider"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { sendFriendRequest as sendFriendRequestServer, acceptFriendRequest as acceptFriendRequestServer } from "@/app/actions/friends"
import { getManorLevelFromXp } from "@/lib/manor-progression"

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

  function getGameCategory(game: Game): string {
    const cat = game.category?.toLowerCase() || ""
    if (cat.includes("rpg") || cat.includes("role")) return "rpg"
    if (cat.includes("miniature") || cat.includes("wargame")) return "miniatures"
    if (cat.includes("trading") || cat.includes("tcg") || cat.includes("card game")) return "tradingCards"
    return "boardGames"
  }

  const filteredGames = categoryFilter
    ? games.filter((game) => getGameCategory(game) === categoryFilter)
    : games
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

  const buttonClass = "w-full sm:w-auto"

  return (
    <div className="min-h-screen room-environment">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href="/discover" className="mb-4 inline-block">
          <ArchiveCardButton>← {t("common.back")}</ArchiveCardButton>
        </Link>

        <ArchiveCard className="mb-6">
          <div className="p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent-gold bg-accent-gold/10 text-2xl font-semibold text-accent-gold">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h1 className="mb-1 font-heading text-2xl text-accent-gold">{displayName}</h1>
                {profile.username && profile.display_name && (
                  <p className="mb-2 text-sm text-muted-foreground">@{profile.username}</p>
                )}

                <div className="mb-3 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
                  {profile.location && <span>{profile.location}</span>}
                  <span>{t("profile.level")} {getManorLevelFromXp(profile.xp || 0)}</span>
                  <span>{gameCount} {t("collection.gameCountLabel")}</span>
                </div>

                {profile.bio && <p className="mb-4 text-foreground/80">{profile.bio}</p>}

                {gameInterests && gameInterests.length > 0 && (
                  <div className="mb-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {gameInterests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-accent-gold/50 bg-accent-gold/10 px-3 py-1 text-sm text-accent-gold"
                      >
                        {INTEREST_LABELS[interest] ? t(INTEREST_LABELS[interest]) : interest}
                      </span>
                    ))}
                  </div>
                )}

                {!isOwnProfile && currentUserId && (
                  <div className="mt-4 flex justify-center sm:justify-start">
                    {friendshipStatus === "none" && (
                      <ArchiveCardButton
                        className={buttonClass}
                        active
                        disabled={loading}
                        onClick={handleSendFriendRequest}
                      >
                        {loading ? "…" : t("friends.sendRequest")}
                      </ArchiveCardButton>
                    )}
                    {friendshipStatus === "pending" && (
                      <ArchiveCardButton className={buttonClass} disabled>
                        {t("friends.requestPending")}
                      </ArchiveCardButton>
                    )}
                    {friendshipStatus === "incoming" && (
                      <ArchiveCardButton
                        className={buttonClass}
                        active
                        disabled={loading}
                        onClick={handleAcceptFriendRequest}
                      >
                        {loading ? "…" : t("friends.acceptRequest")}
                      </ArchiveCardButton>
                    )}
                    {friendshipStatus === "accepted" && (
                      <ArchiveCardButton className={buttonClass} disabled active>
                        {t("friends.alreadyFriends")}
                      </ArchiveCardButton>
                    )}
                  </div>
                )}

                {isOwnProfile && (
                  <Link href="/profile" className="mt-4 inline-block">
                    <ArchiveCardButton>{t("profile.editProfile")}</ArchiveCardButton>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </ArchiveCard>

        {profile.show_collection !== false && games.length > 0 && (
          <ArchiveCard className="mb-6">
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <h2 className="font-cinzel text-lg font-bold uppercase tracking-wide text-[var(--archive-gold,#d9b65c)]">
                  {t("collection.title")} ({gameCount})
                </h2>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                <ArchiveCardButton
                  active={categoryFilter === null}
                  onClick={() => {
                    setCategoryFilter(null)
                    setShowAllGames(false)
                  }}
                >
                  {t("collection.allItems")} ({games.length})
                </ArchiveCardButton>
                {categoryCounts.boardGames > 0 && (
                  <ArchiveCardButton
                    active={categoryFilter === "boardGames"}
                    onClick={() => {
                      setCategoryFilter("boardGames")
                      setShowAllGames(false)
                    }}
                  >
                    {t("profile.boardAndCardGames")} ({categoryCounts.boardGames})
                  </ArchiveCardButton>
                )}
                {categoryCounts.rpg > 0 && (
                  <ArchiveCardButton
                    active={categoryFilter === "rpg"}
                    onClick={() => {
                      setCategoryFilter("rpg")
                      setShowAllGames(false)
                    }}
                  >
                    {t("profile.roleplayingGames")} ({categoryCounts.rpg})
                  </ArchiveCardButton>
                )}
                {categoryCounts.miniatures > 0 && (
                  <ArchiveCardButton
                    active={categoryFilter === "miniatures"}
                    onClick={() => {
                      setCategoryFilter("miniatures")
                      setShowAllGames(false)
                    }}
                  >
                    {t("profile.otherMiniatureGames")} ({categoryCounts.miniatures})
                  </ArchiveCardButton>
                )}
                {categoryCounts.tradingCards > 0 && (
                  <ArchiveCardButton
                    active={categoryFilter === "tradingCards"}
                    onClick={() => {
                      setCategoryFilter("tradingCards")
                      setShowAllGames(false)
                    }}
                  >
                    {t("profile.tradingCards")} ({categoryCounts.tradingCards})
                  </ArchiveCardButton>
                )}
              </div>

              <div className={`${showAllGames ? "max-h-[70vh]" : "max-h-[400px]"} overflow-y-auto`}>
                {displayedGames.map((game, index) => (
                  <div key={game.id}>
                    <div className="flex items-center gap-3 py-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-accent-gold/10 text-xs text-accent-gold/70">
                        {game.thumbnail_url ? (
                          <img src={game.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          "GT"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{game.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {game.min_players && game.max_players && (
                            <span>{game.min_players}-{game.max_players} {t("game.players")}</span>
                          )}
                          {game.year && <span>{game.year}</span>}
                        </div>
                      </div>
                    </div>
                    {index < displayedGames.length - 1 && <ArchiveDivider className="my-1" />}
                  </div>
                ))}
              </div>

              {filteredGames.length > 20 && (
                <div className="mt-4 text-center">
                  <ArchiveCardButton onClick={() => setShowAllGames(!showAllGames)}>
                    {showAllGames
                      ? t("common.showLess")
                      : `${t("common.showAll")} (+${filteredGames.length - 20} ${t("collection.moreGames")})`}
                  </ArchiveCardButton>
                </div>
              )}
            </div>
          </ArchiveCard>
        )}

        {profile.show_collection === false && (
          <ArchiveCard>
            <div className="p-8 text-center text-muted-foreground">{t("profile.collectionHidden")}</div>
          </ArchiveCard>
        )}
      </div>
    </div>
  )
}
