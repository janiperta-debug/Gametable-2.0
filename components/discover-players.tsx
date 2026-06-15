"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArchiveCardButton,
  ArchiveCard,
  ArchiveCardContent,
  ArchiveCardHeader,
  ArchiveCardTitle,
  archiveField,
  archiveSelectContent,
  archiveSelectItem,
} from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Users, Loader2, UserPlus, UserCheck, Clock, UserX } from "lucide-react"
import { searchUsers, sendFriendRequest, removeFriend, type DiscoverUser } from "@/app/actions/friends"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"

export function DiscoverPlayers() {
  const [locationFilter, setLocationFilter] = useState("")
  const [gameFilter, setGameFilter] = useState("")
  const [gameTypeFilter, setGameTypeFilter] = useState("")
  const [players, setPlayers] = useState<DiscoverUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const t = useTranslations()
  const { user } = useUser()

  async function handleSearch() {
    setLoading(true)
    setSearched(true)
    const result = await searchUsers({
      location: locationFilter,
      gameTitle: gameFilter,
      gameType: gameTypeFilter,
    })
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      setPlayers(result.data)
    }
    setLoading(false)
  }

  async function handleConnect(player: DiscoverUser) {
    if (!user) {
      toast({ title: t("common.error"), description: t("community.loginToConnect"), variant: "destructive" })
      return
    }
    setActionLoading(player.id)
    const result = await sendFriendRequest(player.id)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      toast({ title: t("common.success"), description: t("community.requestSent") })
      // Update local state
      setPlayers(prev => prev.map(p => 
        p.id === player.id ? { ...p, friendship_status: "pending" } : p
      ))
    }
    setActionLoading(null)
  }

  async function handleCancelRequest(player: DiscoverUser) {
    if (!player.friendship_id) return
    setActionLoading(player.id)
    const result = await removeFriend(player.friendship_id)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      toast({ title: t("common.success"), description: t("community.requestCancelled") })
      setPlayers(prev => prev.map(p => 
        p.id === player.id ? { ...p, friendship_status: null, friendship_id: null } : p
      ))
    }
    setActionLoading(null)
  }

  // Don't load users until search is initiated - users should search first

  return (
    <div className="space-y-8">
      <ArchiveCard>
        <ArchiveCardHeader>
          <ArchiveCardTitle className="text-2xl normal-case">{t("community.refineSearch")}</ArchiveCardTitle>
          <p className="font-merriweather text-muted-foreground mt-1">
            {t("community.refineSearchDescription")}
          </p>
        </ArchiveCardHeader>
        <ArchiveCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-cinzel text-accent-gold">{t("community.location")}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("community.locationPlaceholder")}
                  className={cn("pl-10 font-merriweather", archiveField)}
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Game Title Filter */}
            <div className="space-y-2">
              <label className="text-sm font-cinzel text-accent-gold">{t("community.searchByGameTitle")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("community.gameTitlePlaceholder")}
                  className={cn("pl-10 font-merriweather", archiveField)}
                  value={gameFilter}
                  onChange={(e) => setGameFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Game Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-cinzel text-accent-gold">{t("community.preferredGameType")}</label>
              <Select value={gameTypeFilter} onValueChange={setGameTypeFilter}>
                <SelectTrigger className={cn("font-merriweather", archiveField)}>
                  <SelectValue placeholder={t("community.anyGameType")} />
                </SelectTrigger>
                <SelectContent className={archiveSelectContent}>
                  <SelectItem value="board-games" className={archiveSelectItem}>{t("community.boardGames")}</SelectItem>
                  <SelectItem value="rpgs" className={archiveSelectItem}>{t("community.rpgs")}</SelectItem>
                  <SelectItem value="miniatures" className={archiveSelectItem}>{t("community.miniatures")}</SelectItem>
                  <SelectItem value="trading-cards" className={archiveSelectItem}>{t("community.tradingCards")}</SelectItem>
                  <SelectItem value="party-games" className={archiveSelectItem}>{t("community.partyGames")}</SelectItem>
                  <SelectItem value="strategy" className={archiveSelectItem}>{t("community.strategyGames")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center">
            <ArchiveCardButton
              onClick={handleSearch}
              disabled={loading}
              icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {t("community.searchPlayers")}
            </ArchiveCardButton>
          </div>
        </ArchiveCardContent>
      </ArchiveCard>

      {/* Players Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
        </div>
      ) : players.length === 0 && searched ? (
        <ArchiveCard className="text-center">
          <ArchiveCardContent className="py-12">
            <Users className="h-16 w-16 text-accent-gold mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">{t("community.noPlayersFound")}</h3>
            <p className="font-body text-muted-foreground">{t("community.tryDifferentFilters")}</p>
          </ArchiveCardContent>
        </ArchiveCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => {
            const displayName = player.display_name || player.username || "Unknown"
            const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
            
            return (
              <ArchiveCard key={player.id}>
                <ArchiveCardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={player.avatar_url || "/placeholder.svg"} alt={displayName} />
                        <AvatarFallback className="font-cinzel">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-cinzel font-semibold text-lg">{displayName}</h3>
                        {player.location && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="font-merriweather">{player.location}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          <span className="font-merriweather">{player.games_count} {t("community.games")}</span>
                        </div>
                      </div>
                    </div>

                    {player.bio && (
                      <p className="text-sm font-merriweather text-muted-foreground line-clamp-2">{player.bio}</p>
                    )}

                    <div className="flex gap-2">
                      <ArchiveCardButton asChild fullWidth className="flex-1">
                        <Link href={`/users/${player.username || player.id}`}>{t("community.viewProfile")}</Link>
                      </ArchiveCardButton>

                      {player.friendship_status === "accepted" ? (
                        <ArchiveCardButton
                          fullWidth
                          className="flex-1"
                          icon={<UserCheck className="h-4 w-4" />}
                          disabled
                        >
                          {t("community.friends")}
                        </ArchiveCardButton>
                      ) : player.friendship_status === "pending" ? (
                        <ArchiveCardButton
                          fullWidth
                          className="flex-1"
                          onClick={() => handleCancelRequest(player)}
                          disabled={actionLoading === player.id}
                          icon={
                            actionLoading === player.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )
                          }
                        >
                          {t("community.pending")}
                        </ArchiveCardButton>
                      ) : (
                        <ArchiveCardButton
                          fullWidth
                          active
                          className="flex-1"
                          onClick={() => handleConnect(player)}
                          disabled={actionLoading === player.id}
                          icon={
                            actionLoading === player.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )
                          }
                        >
                          {t("community.connect")}
                        </ArchiveCardButton>
                      )}
                    </div>
                  </div>
                </ArchiveCardContent>
              </ArchiveCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
