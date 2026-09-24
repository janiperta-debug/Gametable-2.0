"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArchiveCard,
  ArchiveCardButton,
  ArchiveCardContent,
  ArchiveCardHeader,
  ArchiveCardTitle,
  archiveField,
  archiveSelectContent,
  archiveSelectItem,
} from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Globe, UserCheck, Lock, Loader2, Calendar, Search, X, UserPlus, Check } from "lucide-react"
import { createEvent, inviteToEvent, type EventType, type EventPrivacy } from "@/app/actions/events"
import { createLeague } from "@/app/actions/league-hub"
import { getUserFriendsList } from "@/app/actions/friends"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const eventTypes: { value: EventType; image: string }[] = [
  { value: "game_night", image: "/images/events/game-night.png" },
  { value: "campaign", image: "/images/events/campaign.png" },
  { value: "tournament", image: "/images/events/tournament.png" },
  { value: "league", image: "/images/events/league.png" },
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
  const [eventType, setEventType] = useState<EventType>("game_night")
  const [privacy, setPrivacy] = useState<EventPrivacy>("public")
  const [eventConfig, setEventConfig] = useState({
    format: "",
    rounds: "",
    scoringMode: "3_1_0",
    winPoints: "3",
    drawPoints: "1",
    lossPoints: "0",
    tiebreaker: "",
    organizerNotes: "",
    leagueStructure: "mixed",
    placementPoints: "10, 7, 5, 3, 1",
  })
  const [leagueSeason, setLeagueSeason] = useState({ name: "", startsOn: "", endsOn: "" })
  const [saving, setSaving] = useState(false)
  const [userGames, setUserGames] = useState<UserGame[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [gameSearchQuery, setGameSearchQuery] = useState("")
  const [showGameResults, setShowGameResults] = useState(false)
  const [friends, setFriends] = useState<Array<{ id: string; display_name: string | null; avatar_url: string | null }>>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)
  const { toast } = useToast()
  const t = useTranslations()
  
  // Filter games based on search query
  const filteredGames = userGames.filter(userGame => 
    userGame.game.name.toLowerCase().includes(gameSearchQuery.toLowerCase())
  )
  
  // Fetch user's collection and friends
  useEffect(() => {
    async function fetchGames() {
      const { games } = await getUserGames()
      setUserGames(games as UserGame[])
      setLoadingGames(false)
    }
    async function fetchFriends() {
      const result = await getUserFriendsList()
      if (result.friends) {
        setFriends(result.friends)
      }
      setLoadingFriends(false)
    }
    fetchGames()
    fetchFriends()
  }, [])
  const [formData, setFormData] = useState({
    title: "",
    game: "",
    date: "",
    time: "19:00",
    endDate: "",
    endTime: "22:00",
    location: "",
    maxPlayers: "",
    description: "",
  })

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    if (eventType === "league") {
      if (!leagueSeason.name.trim()) {
        toast({ title: t("eventDynamic.s0"), variant: "destructive" })
        return
      }
      if (leagueSeason.startsOn && leagueSeason.endsOn && leagueSeason.endsOn < leagueSeason.startsOn) {
        toast({ title: t("eventDynamic.s1"), variant: "destructive" })
        return
      }
      setSaving(true)
      try {
        const result = await createLeague({
          name: formData.title,
          game: formData.game,
          description: formData.description,
          privacy: privacy === "public" ? "public" : "private",
          seasonName: leagueSeason.name,
          startsOn: leagueSeason.startsOn,
          endsOn: leagueSeason.endsOn,
        })
        if (result.error) toast({ title: t("eventDynamic.s2"), description: result.error, variant: "destructive" })
        else if (result.id) router.push("/leagues/" + result.id)
      } catch {
        toast({ title: t("eventDynamic.s2"), variant: "destructive" })
      } finally { setSaving(false) }
      return
    }
    if (!formData.date || !formData.time || !formData.endDate || !formData.endTime) return

    setSaving(true)

    try {
      const startsAt = new Date(formData.date + "T" + formData.time + ":00")
      const endsAt = new Date(formData.endDate + "T" + formData.endTime + ":00")

      const result = await createEvent({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        event_type: eventType,
        privacy: privacy,
        location: formData.location.trim() || undefined,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        max_players: formData.maxPlayers ? parseInt(formData.maxPlayers) : undefined,
        event_config: {
          format: eventConfig.format.trim() || undefined,
          rounds: eventConfig.rounds.trim() || undefined,
          ...(eventType === "tournament" || eventType === "league" ? {
            scoring: {
              mode: eventConfig.scoringMode,
              win: Number(eventConfig.winPoints),
              draw: Number(eventConfig.drawPoints),
              loss: Number(eventConfig.lossPoints),
            },
            tiebreaker: eventConfig.tiebreaker.trim() || undefined,
          } : {}),
          ...(eventType === "league" ? {
            leagueStructure: eventConfig.leagueStructure,
            placementPoints: eventConfig.placementPoints.split(",").map((value) => Number(value.trim())),
            format: "season",
            rounds: undefined,
          } : {}),
          organizerNotes: eventConfig.organizerNotes.trim() || undefined,
        },
      })

      if (result.error) {
        toast({
          title: t("common.error"),
          description: result.error,
          variant: "destructive",
        })
      } else if (result.event) {
        // Invite selected friends if any
        if (selectedFriends.length > 0 && (privacy === "private" || privacy === "friends")) {
          for (const friendId of selectedFriends) {
            await inviteToEvent(result.event.id, friendId)
          }
        }
        
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
          <div className="flex items-center gap-4 mb-8">
            <ArchiveCardButton onClick={() => router.back()} icon={<ArrowLeft className="h-4 w-4" />}>
              {t("events.back")}
            </ArchiveCardButton>
            <h1 className="ornate-text font-heading text-3xl font-bold">{t("events.createEvent")}</h1>
          </div>

          {/* Form */}
          <ArchiveCard>
            <ArchiveCardHeader>
              <ArchiveCardTitle className="text-xl normal-case">{t("events.eventDetails")}</ArchiveCardTitle>
            </ArchiveCardHeader>
            <ArchiveCardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-body text-accent-gold">
                    {t("events.eventTitle")}
                  </Label>
                  <Input 
                    id="title" 
                    placeholder={eventType === "league" ? t("eventDynamic.s3") : t("events.eventTitlePlaceholder")}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={cn("font-body", archiveField)}
                    required
                  />
                </div>

                {/* Game Selection */}
                <div className="space-y-4">
                  <Label className="font-body text-accent-gold">{t("events.game")}</Label>
                  <div className="flex gap-2">
                    <ArchiveCardButton
                      type="button"
                      active={gameSelection === "collection"}
                      onClick={() => setGameSelection("collection")}
                    >
                      {t("events.fromCollection")}
                    </ArchiveCardButton>
                    <ArchiveCardButton
                      type="button"
                      active={gameSelection === "manual"}
                      onClick={() => setGameSelection("manual")}
                    >
                      {t("events.manualEntry")}
                    </ArchiveCardButton>
                  </div>

                  {gameSelection === "collection" ? (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          placeholder={loadingGames ? t("common.loading") : t("events.searchCollection")}
                          value={formData.game || gameSearchQuery}
                          onChange={(e) => {
                            setGameSearchQuery(e.target.value)
                            setFormData({ ...formData, game: "" })
                            setShowGameResults(true)
                          }}
                          onFocus={() => setShowGameResults(true)}
                          className={cn("pl-10 pr-10", archiveField)}
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
                      className={archiveField}
                    />
                  )}
                </div>

                {/* Event Type Selection */}
                <div className="space-y-4">
                  <Label className="font-body text-accent-gold">{t("events.eventType")}</Label>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {eventTypes.map(({ value, image }) => {
                      const label = t(`events.types.${value}`)
                      const selected = eventType === value
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setEventType(value)}
                          className={cn(
                            "group relative flex min-h-[145px] flex-col items-center justify-center overflow-hidden rounded-lg px-3 py-3 text-center transition-all duration-200",
                            "border border-[var(--archive-gold,#d9b65c)]/25",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--archive-gold,#d9b65c)]/70",
                            selected
                              ? "bg-[var(--archive-surface-shade,rgba(0,0,0,0.28))] border-[var(--archive-gold,#d9b65c)]/75 shadow-[inset_0_0_18px_rgba(217,182,92,0.10)]"
                              : "bg-[var(--archive-surface-shade,rgba(0,0,0,0.16))] hover:bg-[var(--archive-surface-shade,rgba(0,0,0,0.24))] hover:border-[var(--archive-gold,#d9b65c)]/50"
                          )}
                        >
                          <img
                            src={image}
                            alt=""
                            className="h-20 w-full object-contain drop-shadow-[0_5px_9px_rgba(0,0,0,0.45)] transition-transform duration-200 group-hover:scale-105"
                          />
                          <span className={cn(
                            "mt-2 font-cinzel text-sm font-semibold",
                            selected ? "text-[var(--archive-gold,#d9b65c)]" : "text-foreground"
                          )}>
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {eventType === "league" && (
                  <div className="rounded-lg border border-accent-gold/25 bg-background/20 p-4 space-y-2">
                    <h3 className="font-heading text-lg text-accent-gold">{t("eventUi.s0")}</h3>
                    <p className="text-sm text-muted-foreground">{t("eventUi.s1")}</p>
                  </div>
                )}

                {/* Organizer-defined event structure */}
                {eventType !== "game_night" && eventType !== "league" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-heading text-lg text-accent-gold">{t("eventUi.s2")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("eventUi.structureRules")}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="event-format" className="font-body text-accent-gold">{t("eventUi.s3")}</Label>
                        <Select
                          value={eventConfig.format}
                          onValueChange={(value) => setEventConfig({ ...eventConfig, format: value })}
                        >
                          <SelectTrigger id="event-format" className={archiveField}>
                            <SelectValue placeholder={t("eventUi.s22")} />
                          </SelectTrigger>
                          <SelectContent className={archiveSelectContent}>
                            {eventType === "campaign" ? (
                              <>
                                <SelectItem className={archiveSelectItem} value="weekly">{t("eventUi.s4")}</SelectItem>
                                <SelectItem className={archiveSelectItem} value="biweekly">{t("eventUi.s5")}</SelectItem>
                                <SelectItem className={archiveSelectItem} value="freeform">{t("eventUi.s6")}</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem className={archiveSelectItem} value="swiss">Swiss</SelectItem>
                                <SelectItem className={archiveSelectItem} value="round_robin">Round robin</SelectItem>
                                <SelectItem className={archiveSelectItem} value="single_elimination">Single elimination</SelectItem>
                                <SelectItem className={archiveSelectItem} value="double_elimination">Double elimination</SelectItem>
                                <SelectItem className={archiveSelectItem} value="groups_playoffs">{t("eventUi.s7")}</SelectItem>
                                <SelectItem className={archiveSelectItem} value="freeform">{t("eventUi.s6")}</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-rounds" className="font-body text-accent-gold">
                          {eventType === "campaign" ? "Sessiot" : t("eventDynamic.s4")}
                        </Label>
                        <Select
                          value={eventConfig.rounds}
                          onValueChange={(value) => setEventConfig({ ...eventConfig, rounds: value })}
                        >
                          <SelectTrigger id="event-rounds" className={archiveField}>
                            <SelectValue placeholder={t("eventUi.s23")} />
                          </SelectTrigger>
                          <SelectContent className={archiveSelectContent}>
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((count) => (
                              <SelectItem className={archiveSelectItem} key={count} value={String(count)}>{count}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {eventType !== "campaign" && (
                          <p className="text-xs text-muted-foreground">
                            {t("eventUi.roundPlanNote")}
                          </p>
                        )}
                      </div>
                    </div>

                    {(eventType === "tournament" || eventType === "league") && (
                    <div className="space-y-3">
                      <div>
                        <Label className="font-body text-accent-gold">{t("eventUi.s8")}</Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("eventUi.scoringHint")}
                        </p>
                      </div>

                      <Select
                        value={eventConfig.scoringMode}
                        onValueChange={(value) => {
                          const presets: Record<string, { win: string; draw: string; loss: string }> = {
                            "3_1_0": { win: "3", draw: "1", loss: "0" },
                            "3_0_0": { win: "3", draw: "0", loss: "0" },
                            "2_1_0": { win: "2", draw: "1", loss: "0" },
                            "2_0_0": { win: "2", draw: "0", loss: "0" },
                            "1_0_0": { win: "1", draw: "0", loss: "0" },
                          }
                          const preset = presets[value]
                          setEventConfig({
                            ...eventConfig,
                            scoringMode: value,
                            ...(preset || {}),
                          })
                        }}
                      >
                        <SelectTrigger className={archiveField}>
                          <SelectValue placeholder={t("eventUi.s24")} />
                        </SelectTrigger>
                        <SelectContent className={archiveSelectContent}>
                          <SelectItem className={archiveSelectItem} value="3_1_0">{t("eventUi.s9")}</SelectItem>
                          <SelectItem className={archiveSelectItem} value="3_0_0">{t("eventUi.s10")}</SelectItem>
                          <SelectItem className={archiveSelectItem} value="2_1_0">{t("eventUi.s11")}</SelectItem>
                          <SelectItem className={archiveSelectItem} value="2_0_0">{t("eventUi.s12")}</SelectItem>
                          <SelectItem className={archiveSelectItem} value="1_0_0">{t("eventUi.s13")}</SelectItem>
                          <SelectItem className={archiveSelectItem} value="custom">{t("eventUi.s14")}</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          { key: "winPoints", label: "Voitto" },
                          { key: "drawPoints", label: "Tasapeli" },
                          { key: "lossPoints", label: "Tappio" },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-2">
                            <Label className="text-sm text-muted-foreground">{label}</Label>
                            <Select
                              value={eventConfig[key as "winPoints" | "drawPoints" | "lossPoints"]}
                              onValueChange={(value) => setEventConfig({ ...eventConfig, scoringMode: "custom", [key]: value })}
                            >
                              <SelectTrigger className={archiveField}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className={archiveSelectContent}>
                                {Array.from({ length: 11 }, (_, i) => (
                                  <SelectItem className={archiveSelectItem} key={i} value={String(i)}>{i} p</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>


                    )}

                    {(eventType === "tournament" || eventType === "league") && (
                      <div className="space-y-2">
                        <Label htmlFor="event-tiebreaker" className="font-body text-accent-gold">{t("eventUi.s15")}</Label>
                        <Input
                          id="event-tiebreaker"
                          placeholder={t("eventUi.s25")}
                          value={eventConfig.tiebreaker}
                          onChange={(e) => setEventConfig({ ...eventConfig, tiebreaker: e.target.value })}
                          className={archiveField}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="event-organizer-notes" className="font-body text-accent-gold">{t("eventUi.s16")}</Label>
                      <Textarea
                        id="event-organizer-notes"
                        placeholder={t("eventUi.s26")}
                        value={eventConfig.organizerNotes}
                        onChange={(e) => setEventConfig({ ...eventConfig, organizerNotes: e.target.value })}
                        className={archiveField}
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {eventType === "league" && (
                  <div className="space-y-4 rounded-lg border border-accent-gold/25 p-4">
                    <div>
                      <h3 className="font-heading text-lg text-accent-gold">{t("eventUi.s17")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{t("eventUi.s18")}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="league-season-name" className="text-accent-gold">{t("eventUi.s19")}</Label>
                      <Input id="league-season-name" required={eventType === "league"} maxLength={120} value={leagueSeason.name} onChange={(e) => setLeagueSeason({ ...leagueSeason, name: e.target.value })} placeholder={t("eventUi.s27")} className={archiveField} />
                    </div>
                    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="min-w-0 space-y-2">
                        <Label htmlFor="league-start" className="text-accent-gold">{t("eventUi.s20")}</Label>
                        <Input id="league-start" type="date" value={leagueSeason.startsOn} onChange={(e) => setLeagueSeason({ ...leagueSeason, startsOn: e.target.value })} className={cn(archiveField, "block !w-full !min-w-0 !max-w-full [min-inline-size:0]")} />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <Label htmlFor="league-end" className="text-accent-gold">{t("eventUi.s21")}</Label>
                        <Input id="league-end" type="date" min={leagueSeason.startsOn || undefined} value={leagueSeason.endsOn} onChange={(e) => setLeagueSeason({ ...leagueSeason, endsOn: e.target.value })} className={cn("w-full min-w-0", archiveField)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Date & Time Range */}
                {eventType !== "league" && <div className="space-y-4">
                  <div className="space-y-3">
                  <Label className="font-body text-accent-gold">{eventType === "league" ? "Kausi" : "Ajankohta"}</Label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm text-muted-foreground">{eventType === "league" ? "Kausi alkaa" : "Alkaa"}</Label>
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 min-w-0">
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => {
                            const nextDate = e.target.value
                            setFormData({
                              ...formData,
                              date: nextDate,
                              endDate: !formData.endDate || formData.endDate === formData.date ? nextDate : formData.endDate,
                            })
                          }}
                          className={cn("font-body w-full min-w-0", archiveField)}
                          required
                        />
                        <Input
                          id="time"
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className={cn("font-body w-full min-w-0", archiveField)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm text-muted-foreground">{eventType === "league" ? t("eventDynamic.s5") : t("eventDynamic.s6")}</Label>
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 min-w-0">
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          min={formData.date || undefined}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className={cn("font-body w-full min-w-0", archiveField)}
                          required
                        />
                        <Input
                          id="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className={cn("font-body w-full min-w-0", archiveField)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  </div>
                </div>}

                {/* Location */}
                {eventType !== "league" && <div className="space-y-2">
                  <Label htmlFor="location" className="font-body text-accent-gold">
                    {t("events.location")}
                  </Label>
                  <Input 
                    id="location" 
                    placeholder={t("events.locationPlaceholder")}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={cn("font-body", archiveField)}
                  />
                </div>}

                {/* Max Players */}
                {eventType !== "league" && <div className="space-y-2">
                  <Label htmlFor="maxPlayers" className="font-body text-accent-gold">
                    {t("events.maxPlayers")}
                  </Label>
                  <Input 
                    id="maxPlayers" 
                    type="number" 
                    placeholder="4"
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                    className={cn("font-body", archiveField)}
                    min="1"
                  />
                </div>}

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
                    className={cn("font-body min-h-[100px]", archiveField)}
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

                {/* Invite Friends Section - Show for private/friends events */}
                {eventType !== "league" && (privacy === "private" || privacy === "friends") && (
                  <div className="space-y-4 p-4 border border-accent-gold/30 rounded-lg bg-accent-gold/5">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-accent-gold" />
                      <Label className="font-body text-accent-gold font-medium">
                        {t("events.inviteFriends")}
                      </Label>
                      {selectedFriends.length > 0 && (
                        <Badge variant="secondary" className="bg-accent-gold/20 text-accent-gold">
                          {selectedFriends.length} {t("events.selected")}
                        </Badge>
                      )}
                    </div>
                    
                    {loadingFriends ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-accent-gold" />
                      </div>
                    ) : friends.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("events.noFriendsToInvite")}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {friends.map((friend) => {
                          const isSelected = selectedFriends.includes(friend.id)
                          return (
                            <button
                              key={friend.id}
                              type="button"
                              onClick={() => toggleFriendSelection(friend.id)}
                              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                                isSelected 
                                  ? "bg-accent-gold/20 border border-accent-gold" 
                                  : "bg-background/50 border border-transparent hover:border-accent-gold/30"
                              }`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={friend.avatar_url || undefined} />
                                <AvatarFallback className="bg-accent-gold/20 text-accent-gold text-sm">
                                  {(friend.display_name || "?").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm flex-1 text-left truncate">
                                {friend.display_name || "Anonymous"}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-accent-gold" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6">
                  <ArchiveCardButton type="button" onClick={() => router.push("/events")} disabled={saving}>
                    {t("common.cancel")}
                  </ArchiveCardButton>
                  <ArchiveCardButton
                    type="submit"
                    active
                    disabled={saving}
                    icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                  >
                    {saving ? t("common.loading") : eventType === "league" ? "Perusta liiga" : t("events.createEvent")}
                  </ArchiveCardButton>
                </div>
              </form>
            </ArchiveCardContent>
          </ArchiveCard>
        </div>
      </main>
    </div>
  )
}
