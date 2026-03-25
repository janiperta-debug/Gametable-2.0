"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { DiscoverPlayers } from "@/components/discover-players"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Clock, Loader2, Gamepad2, Calendar } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { getFriendActivity } from "@/app/actions/friends"
import { useUser } from "@/hooks/useUser"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  type: "game_added" | "event_joined"
  user: { id: string; display_name: string | null; avatar_url: string | null }
  game?: { id: string; name: string; thumbnail_url: string | null }
  event?: { id: string; title: string }
  created_at: string
}

export default function CommunityPage() {
  const t = useTranslations()
  const { user } = useUser()
  const [activity, setActivity] = useState<Activity[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)

  useEffect(() => {
    async function loadActivity() {
      if (!user) {
        setLoadingActivity(false)
        return
      }
      const result = await getFriendActivity()
      if (!result.error) {
        setActivity(result.data)
      }
      setLoadingActivity(false)
    }
    loadActivity()
  }, [user])

  return (
    <div className="min-h-screen room-environment">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="logo-text text-5xl font-bold">{t("community.title")}</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            {t("community.subtitle")}
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="room-furniture">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Clock className="h-6 w-6 mr-2 text-accent-gold" />
                {t("community.recentFriendActivity")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!user ? (
                <p className="text-center text-muted-foreground font-body py-8">
                  {t("community.loginToSeeActivity")}
                </p>
              ) : loadingActivity ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-accent-gold" />
                </div>
              ) : activity.length === 0 ? (
                <p className="text-center text-muted-foreground font-body py-8">
                  {t("community.noFriendActivity")}
                </p>
              ) : (
                <div className="space-y-4">
                  {activity.map((item) => {
                    const userName = item.user?.display_name || "Unknown"
                    const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
                    
                    return (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-4 rounded-lg picture-frame hover:bg-accent-gold/5 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={item.user?.avatar_url || "/placeholder.svg"} alt={userName} />
                          <AvatarFallback className="font-cinzel">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-merriweather text-sm">
                            <span className="font-semibold text-accent-gold">{userName}</span>{" "}
                            {item.type === "game_added" ? (
                              <>
                                <span className="text-muted-foreground">{t("community.addedToCollection")}</span>{" "}
                                <span className="font-semibold">{item.game?.name}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-muted-foreground">{t("community.joinedEvent")}</span>{" "}
                                <span className="font-semibold">{item.event?.title}</span>
                              </>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground font-merriweather">{timeAgo}</p>
                        </div>
                        {item.type === "game_added" ? (
                          <Gamepad2 className="h-5 w-5 text-accent-gold" />
                        ) : (
                          <Calendar className="h-5 w-5 text-accent-gold" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <DiscoverPlayers />
        </div>
      </main>
    </div>
  )
}
