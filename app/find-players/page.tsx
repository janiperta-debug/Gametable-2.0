"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslations } from "@/lib/i18n"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Search } from "lucide-react"
import { PlayerCard } from "@/components/player-card"

export default function FindPlayersPage() {
  const t = useTranslations()
  // TODO: Fetch real players from database
  const mockPlayers = [
    {
      userId: "1",
      name: "Sarah Chen",
      location: "Seattle, WA",
      profilePicture: "/placeholder.svg?height=80&width=80",
      gamesCount: 156,
      interests: ["Strategy", "Euro Games", "Worker Placement"],
      status: "Looking for group",
    },
    {
      userId: "2",
      name: "Mike Rodriguez",
      location: "Portland, OR",
      profilePicture: "/placeholder.svg?height=80&width=80",
      gamesCount: 89,
      interests: ["RPG", "D&D", "Storytelling"],
      status: "Available weekends",
    },
    {
      userId: "3",
      name: "Emma Thompson",
      location: "Vancouver, BC",
      profilePicture: "/placeholder.svg?height=80&width=80",
      gamesCount: 203,
      interests: ["Cooperative", "Legacy", "Campaign"],
      status: "Hosting weekly",
    },
  ]

  return (
    <div className="min-h-screen manor-bg">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Card className="decorative-border mb-8">
          <CardContent className="pt-6">
            <h2 className="font-cinzel text-2xl font-bold mb-2">{t("findPlayers.refineSearch")}</h2>
            <p className="font-merriweather text-muted-foreground mb-6">
              {t("findPlayers.subtitle")}
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-semibold text-amber-600 mb-2 block uppercase tracking-wide">
                  {t("findPlayers.location")}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("findPlayers.locationPlaceholder")} className="pl-10 bg-background/50" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-amber-600 mb-2 block uppercase tracking-wide">
                  {t("findPlayers.searchByGame")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("findPlayers.gamePlaceholder")} className="pl-10 bg-background/50" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-amber-600 mb-2 block uppercase tracking-wide">
                  {t("findPlayers.preferredGameType")}
                </label>
                <Select>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder={t("findPlayers.anyGameType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t("findPlayers.anyGameType")}</SelectItem>
                    <SelectItem value="board">{t("findPlayers.boardGames")}</SelectItem>
                    <SelectItem value="rpg">{t("findPlayers.rpgs")}</SelectItem>
                    <SelectItem value="miniatures">{t("findPlayers.miniatures")}</SelectItem>
                    <SelectItem value="card">{t("findPlayers.cardGames")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full md:w-auto bg-amber-600 hover:bg-amber-700">{t("findPlayers.searchForPlayers")}</Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPlayers.map((player) => (
            <PlayerCard key={player.userId} {...player} />
          ))}
        </div>
      </main>
    </div>
  )
}
