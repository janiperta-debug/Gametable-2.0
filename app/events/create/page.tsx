"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Globe, UserCheck, Lock, Loader2, Calendar, Search, X, Dices, Swords, Trophy, Sparkles } from "lucide-react"
import { createEvent, type EventType, type EventPrivacy } from "@/app/actions/events"

const eventTypes: { value: EventType; icon: React.ElementType }[] = [
  { value: "board_game_night", icon: Dices },
  { value: "rpg_session", icon: Swords },
  { value: "tournament", icon: Trophy },
  { value: "custom", icon: Sparkles },
]
import { getUserGames } from "@/app/actions/games"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/i18n"

interface UserGame {
  id: string
  game: {
    id: string
    name: string
    image_url?: string
  }
}

export default function CreateEventPage() {
  const router = useRouter()
  const [gameSelection, setGameSelection] = useState("collection")
  const [eventType, setEventType] = useState<EventType>("board_game_night")
  const [privacy, setPrivacy] = useState<EventPrivacy>("public")
  const [saving, setSaving] = useState(false)
  const [userGames, setUserGames] = useState<UserGame[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [gameSearchQuery, setGameSearchQuery] = useState("")
  const [showGameResults, setShowGameResults] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()
  
  // Filter games based on search query
  const filteredGames = userGames.filter(userGame => 
    userGame.game.name.toLowerCase().includes(gameSearchQuery.toLowerCase())
  )
  
  // Fetch user's collection
  useEffect(() => {
    async function fetchGames() {
      const { games } = await getUserGames()
      setUserGames(games as UserGame[])
      setLoadingGames(false)
    }
    fetchGames()
  }, [])
  const [formData, setFormData] = useState({
    title: "",
    game: "",
    date: "",
    time: "19:00",
    location: "",
    maxPlayers: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.date || !formData.time) return

    setSaving(true)

    try {
      const startsAt = new Date(formData.date + "T" + formData.time + ":00")

      const result = await createEvent({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        event_type: eventType,
        privacy: privacy,
        location: formData.location.trim() || undefined,
        starts_at: startsAt.toISOString(),
        max_players: formData.maxPlayers ? parseInt(formData.maxPlayers) : undefined,
      })

      if (result.error) {
        toast({
          title: t("common.error"),
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: t("common.success"),
          description: t("events.eventCreated"),
        })
        router.push("/events")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: t("common.error"),
        description: t("events.createFailed"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("events.back")}
            </Button>
            <h1 className="ornate-text font-heading text-3xl font-bold">{t("events.createEvent")}</h1>
          </div>

          {/* Form */}
          <Card className="room-furniture">
            <CardHeader>
              <CardTitle className="font-heading text-xl">{t("events.eventDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-body text-accent-gold">
                    {t("events.eventTitle")}
                  </Label>
                  <Input 
                    id="title" 
                    placeholder={t("events.eventTitlePlaceholder")}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="font-body" 
                    required
                  />
                </div>

                {/* Game Selection */}
                <div className="space-y-4">
                  <Label className="font-body text-accent-gold">{t("events.game")}</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={gameSelection === "collection" ? "default" : "outline"}
                      className={gameSelection === "collection" ? "theme-accent-gold" : "bg-transparent"}
                      onClick={() => setGameSelection("collection")}
                    >
                      {t("events.fromCollection")}
                    </Button>
                    <Button
                      type="button"
                      variant={gameSelection === "manual" ? "default" : "outline"}
                      className={gameSelection === "manual" ? "theme-accent-gold" : "bg-transparent"}
                      onClick={() => setGameSelection("manual")}
                    >
                      {t("events.manualEntry")}
                    </Button>
                  </div>

                  {gameSelection === "collection" ? (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={loadingGames ? t("common.loading") : t("events.searchCollection")}
                          value={formData.game || gameSearchQuery}
                          onChange={(e) => {
                            setGameSearchQuery(e.target.value)
                            setFormData({ ...formData, game: "" })
                            setShowGameResults(true)
                          }}
                          onFocus={() => setShowGameResults(true)}
                          className="pl-10 pr-10"
                          disabled={loadingGames}
                        />
                        {(formData.game || gameSearchQuery) && (
                          <button
                            type="button"
                            onClick={() => {
                              setGameSearchQuery("")
                              setFormData({ ...formData, game: "" })
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {showGameResults && !formData.game && (
                        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredGames.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              {userGames.length === 0 
                                ? t("events.noGamesInCollection")
                                : t("events.noMatchingGames")
                              }
                            </div>
                          ) : (
                            filteredGames.map((userGame) => (
                              <button
                                key={userGame.game.id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, game: userGame.game.name })
                                  setGameSearchQuery("")
                                  setShowGameResults(false)
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                              >
                                {userGame.game.image_url && (
                                  <img 
                                    src={userGame.game.image_url} 
                                    alt="" 
                                    className="w-8 h-8 object-cover rounded"
                                  />
                                )}
                                <span>{userGame.game.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input 
                      placeholder={t("events.enterGameName")} 
                      value={formData.game}
                      onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    />
                  )}
                </div>

                {/* Event Type Selection */}
                <div className="space-y-4">
                  <Label className="font-body text-accent-gold">{t("events.eventType")}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {eventTypes.map(({ value, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setEventType(value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                          eventType === value
                            ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                            : "border-border bg-transparent hover:border-accent-gold/50"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-body text-center">{t(`events.types.${value}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="font-body text-accent-gold">
                      {t("events.date")}
                    </Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="font-body" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="font-body text-accent-gold">
                      {t("events.time")}
                    </Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="font-body" 
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-body text-accent-gold">
                    {t("events.location")}
                  </Label>
                  <Input 
                    id="location" 
                    placeholder={t("events.locationPlaceholder")}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="font-body" 
                  />
                </div>

                {/* Max Players */}
                <div className="space-y-2">
                  <Label htmlFor="maxPlayers" className="font-body text-accent-gold">
                    {t("events.maxPlayers")}
                  </Label>
                  <Input 
                    id="maxPlayers" 
                    type="number" 
                    placeholder="4"
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                    className="font-body" 
                    min="1"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-body text-accent-gold">
                    {t("events.description")}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={t("events.descriptionPlaceholder")}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="font-body min-h-[100px]"
                  />
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <Label className="font-body text-accent-gold">{t("events.eventPrivacy")}</Label>
                  <RadioGroup value={privacy} onValueChange={setPrivacy} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="public" id="public" />
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-accent-gold" />
                        <div>
                          <Label htmlFor="public" className="font-body font-medium text-accent-gold">
                            {t("events.public")}
                          </Label>
                          <p className="font-body text-sm text-muted-foreground">{t("events.publicDesc")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="friends" id="friends" />
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-accent-gold" />
                        <div>
                          <Label htmlFor="friends" className="font-body font-medium text-accent-gold">
                            {t("events.friendsOnly")}
                          </Label>
                          <p className="font-body text-sm text-muted-foreground">{t("events.friendsOnlyDesc")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="private" id="private" />
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-accent-gold" />
                        <div>
                          <Label htmlFor="private" className="font-body font-medium text-accent-gold">
                            {t("events.privateInviteOnly")}
                          </Label>
                          <p className="font-body text-sm text-muted-foreground">
                            {t("events.privateDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={() => router.push("/events")} className="bg-transparent" disabled={saving}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" className="theme-accent-gold" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("common.loading")}
                      </>
                    ) : (
                      t("events.createEvent")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
