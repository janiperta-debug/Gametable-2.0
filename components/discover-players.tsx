"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
      <Card className="room-furniture">
        <CardHeader>
          <CardTitle className="text-2xl">{t("community.refineSearch")}</CardTitle>
          <p className="font-merriweather text-muted-foreground">
            {t("community.refineSearchDescription")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-cinzel text-accent-gold">{t("community.location")}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("community.locationPlaceholder")}
                  className="pl-10 font-merriweather"
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
                  className="pl-10 font-merriweather"
                  value={gameFilter}
                  onChange={(e) => setGameFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Game Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-cinzel text-accent-gold">{t("community.preferredGameType")}</label>
              <Select value={gameTypeFilter} onValueChange={setGameTypeFilter}>
                <SelectTrigger className="font-merriweather">
                  <SelectValue placeholder={t("community.anyGameType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="board-games">{t("community.boardGames")}</SelectItem>
                  <SelectItem value="rpgs">{t("community.rpgs")}</SelectItem>
                  <SelectItem value="miniatures">{t("community.miniatures")}</SelectItem>
                  <SelectItem value="trading-cards">{t("community.tradingCards")}</SelectItem>
                  <SelectItem value="party-games">{t("community.partyGames")}</SelectItem>
                  <SelectItem value="strategy">{t("community.strategyGames")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              className="px-8 font-cinzel bg-accent-gold hover:bg-accent-copper"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {t("community.searchPlayers")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
        </div>
      ) : players.length === 0 && searched ? (
        <Card className="room-furniture text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 text-accent-gold mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">{t("community.noPlayersFound")}</h3>
            <p className="font-body text-muted-foreground">{t("community.tryDifferentFilters")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => {
            const displayName = player.display_name || player.username || "Unknown"
            const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
            
            return (
              <Card key={player.id} className="picture-frame">
                <CardContent className="p-6">
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
                      <Button asChild variant="outline" className="flex-1 font-cinzel bg-transparent">
                        <Link href={`/users/${player.username || player.id}`}>{t("community.viewProfile")}</Link>
                      </Button>
                      
                      {player.friendship_status === "accepted" ? (
                        <Button variant="outline" className="flex-1 font-cinzel" disabled>
                          <UserCheck className="h-4 w-4 mr-1" />
                          {t("community.friends")}
                        </Button>
                      ) : player.friendship_status === "pending" ? (
                        <Button 
                          variant="outline" 
                          className="flex-1 font-cinzel"
                          onClick={() => handleCancelRequest(player)}
                          disabled={actionLoading === player.id}
                        >
                          {actionLoading === player.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Clock className="h-4 w-4 mr-1" />
                              {t("community.pending")}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1 font-cinzel bg-accent-gold hover:bg-accent-copper"
                          onClick={() => handleConnect(player)}
                          disabled={actionLoading === player.id}
                        >
                          {actionLoading === player.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              {t("community.connect")}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
