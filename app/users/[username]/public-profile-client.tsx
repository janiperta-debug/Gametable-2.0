"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n"
import { BADGE_DEFINITIONS } from "@/lib/badge-definitions"
import { LeagueTrophyImage, isLeagueTrophyVariant } from "@/components/league-trophy-image"
import { Trophy, X } from "lucide-react"
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

interface SharedBadge { id:string; name:string; series:string; tier:string; image_url:string|null; earned_at:string }
interface SharedTrophy { id:string; source_type:string; source_name:string|null; category:string; placement:number; award_variant:string|null; awarded_at:string }

interface PublicProfileClientProps {
  showTrophyCabinet: boolean
  sharedBadges: SharedBadge[]
  sharedTrophies: SharedTrophy[]
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
  showTrophyCabinet,
  sharedBadges,
  sharedTrophies,
  gameInterests,
  gameCount,
  games,
  categoryCounts,
  currentUserId,
  initialFriendshipStatus,
  initialFriendshipId,
}: PublicProfileClientProps) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const [friendshipStatus, setFriendshipStatus] = useState(initialFriendshipStatus)
  const [friendshipId] = useState(initialFriendshipId)
  const [loading, setLoading] = useState(false)
  const [showAllGames, setShowAllGames] = useState(false)
  const [showAllTrophies, setShowAllTrophies] = useState(false)
  const [previewTrophy, setPreviewTrophy] = useState<{kind:"badge"|"personal";id:string}|null>(null)
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
        <ArchiveCardButton onClick={() => router.back()} className="mb-4">
          ← {t("common.back")}
        </ArchiveCardButton>

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

        {showTrophyCabinet && <ArchiveCard className="mb-6">
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent-gold" />
              <h2 className="font-heading text-xl text-accent-gold">{t("profile.publicTrophyCabinet")}</h2>
            </div>
            {sharedBadges.length === 0 && sharedTrophies.length === 0
              ? <p className="text-sm text-muted-foreground">{t("profile.publicTrophyEmpty")}</p>
              : <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ...sharedTrophies.map(item => ({kind:"personal" as const, id:item.id, date:item.awarded_at, trophy:item})),
                    ...sharedBadges.map(item => ({kind:"badge" as const, id:item.id, date:item.earned_at, badge:item})),
                  ].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,showAllTrophies?undefined:3).map(item => {
                    const personal = item.kind === "personal" ? item.trophy : null
                    const badge = item.kind === "badge" ? item.badge : null
                    const local = badge ? BADGE_DEFINITIONS.find(def => def.id === badge.id) : null
                    const tier = personal?.placement === 1 ? "gold" : personal?.placement === 2 ? "silver" : "bronze"
                    const variant = personal && isLeagueTrophyVariant(personal.award_variant) ? personal.award_variant : "crystal"
                    const label = badge ? (local ? t(`trophies.badges.${badge.id}.name`) : badge.name)
                      : personal?.source_type === "league_season" ? t("profile.leaguePrize")
                      : personal?.placement === 1 ? t("trophies.gold") : personal?.placement === 2 ? t("trophies.silver") : t("trophies.bronze")
                    return <button key={item.kind+item.id} type="button" onClick={()=>setPreviewTrophy({kind:item.kind,id:item.id})}
                      className="group min-w-0 rounded-xl border border-accent-gold/25 bg-accent-gold/5 p-3 text-center hover:border-accent-gold/60">
                      <div className="mx-auto mb-2 flex h-28 w-full items-center justify-center sm:h-36">
                        {badge ? <img src={local?.image || badge.image_url || "/placeholder.svg"} alt="" className="h-full w-full object-contain" />
                          : personal?.source_type === "league_season" ? <LeagueTrophyImage variant={variant} alt="" className="h-full w-full" iconClassName="h-20 w-20" />
                          : <img src={`/images/awards/tournament/${personal?.category}-tournament-${tier}.png`} alt="" className="h-full w-full object-contain" />}
                      </div>
                      <p className="break-words font-heading text-sm text-accent-gold">{label}</p>
                      {personal?.source_name && <p className="mt-1 break-words text-xs text-muted-foreground">{personal.source_name}</p>}
                      {personal && !personal.source_name && <p className="mt-1 text-xs text-muted-foreground">{t("profile.privateEventPrize")}</p>}
                    </button>
                  })}
                </div>
                {sharedBadges.length + sharedTrophies.length > 3 && <ArchiveCardButton onClick={()=>setShowAllTrophies(!showAllTrophies)}>
                  {showAllTrophies ? t("common.showLess") : t("profile.viewFullTrophyCabinet")}
                </ArchiveCardButton>}
              </>}
          </div>
        </ArchiveCard>}
        {previewTrophy && showTrophyCabinet && (() => {
          const badge = previewTrophy.kind === "badge" ? sharedBadges.find(item=>item.id===previewTrophy.id) : null
          const personal = previewTrophy.kind === "personal" ? sharedTrophies.find(item=>item.id===previewTrophy.id) : null
          const local = badge ? BADGE_DEFINITIONS.find(def=>def.id===badge.id) : null
          const tier = personal?.placement===1?"gold":personal?.placement===2?"silver":"bronze"
          return <div role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setPreviewTrophy(null)}}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <div role="dialog" aria-modal="true" aria-label={t("profile.publicTrophyCabinet")}
              className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-xl border border-accent-gold/40 bg-background p-5 text-center">
              <button type="button" onClick={()=>setPreviewTrophy(null)} aria-label={t("common.close")} className="absolute right-3 top-3 rounded-full p-2"><X className="h-5 w-5"/></button>
              <div className="mx-auto mt-6 h-64 w-full sm:h-80">
                {badge ? <img src={local?.image||badge.image_url||"/placeholder.svg"} alt="" className="h-full w-full object-contain"/>
                  : personal?.source_type==="league_season" ? <LeagueTrophyImage variant={isLeagueTrophyVariant(personal.award_variant)?personal.award_variant:"crystal"} alt="" className="h-full w-full" iconClassName="h-40 w-40"/>
                  : personal ? <img src={`/images/awards/tournament/${personal.category}-tournament-${tier}.png`} alt="" className="h-full w-full object-contain"/> : null}
              </div>
              <h3 className="mt-4 font-heading text-xl text-accent-gold">{badge ? (local?t(`trophies.badges.${badge.id}.name`):badge.name)
                : personal?.source_type==="league_season"?t("profile.leaguePrize"):tier==="gold"?t("trophies.gold"):tier==="silver"?t("trophies.silver"):t("trophies.bronze")}</h3>
              {personal?.source_name && <p className="mt-2">{personal.source_name}</p>}
              {personal && !personal.source_name && <p className="mt-2 text-sm text-muted-foreground">{t("profile.privateEventPrize")}</p>}
              <p className="mt-2 text-sm text-muted-foreground">{new Date(badge?.earned_at||personal?.awarded_at||"").toLocaleDateString(locale==="fi"?"fi-FI":"en-GB")}</p>
            </div>
          </div>
        })()}

        {profile.show_collection === false && (
          <ArchiveCard>
            <div className="p-8 text-center text-muted-foreground">{t("profile.collectionHidden")}</div>
          </ArchiveCard>
        )}
      </div>
    </div>
  )
}
