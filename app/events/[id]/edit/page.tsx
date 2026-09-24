"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { getEventById, updateEvent, type Event, type EventType, type EventPrivacy } from "@/app/actions/events"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const { toast } = useToast()
  const eventId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<Event | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [eventType, setEventType] = useState<EventType>("game_night")
  const [privacy, setPrivacy] = useState<EventPrivacy>("public")
  const [location, setLocation] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [maxPlayers, setMaxPlayers] = useState("")
  const [eventConfig, setEventConfig] = useState({
    scoringMode: "3_1_0",
    winPoints: "3",
    drawPoints: "1",
    lossPoints: "0",
  })

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true)
      
      // Check if user is the host
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError(t("auth.loginRequired") || "Please log in to edit events")
        setLoading(false)
        return
      }

      const result = await getEventById(eventId)
      
      if (result.error) {
        setError(result.error)
      } else if (result.event) {
        if (result.event.host_id !== user.id) {
          setError(t("events.notHost") || "Only the host can edit this event")
        } else {
          setEvent(result.event)
          // Populate form
          setTitle(result.event.title)
          setDescription(result.event.description || "")
          setEventType(result.event.event_type || "game_night")
          setPrivacy(result.event.privacy || "public")
          setLocation(result.event.location || "")
          // Format date for datetime-local input
          if (result.event.starts_at) {
            const date = new Date(result.event.starts_at)
            setStartsAt(date.toISOString().slice(0, 16))
          }
          setMaxPlayers(result.event.max_players?.toString() || "")
          const scoring = (result.event.event_config as Record<string, unknown> | null)?.scoring as Record<string, unknown> | undefined
          if (scoring) {
            setEventConfig({
              scoringMode: String(scoring.mode || "custom"),
              winPoints: String(scoring.win ?? 3),
              drawPoints: String(scoring.draw ?? 1),
              lossPoints: String(scoring.loss ?? 0),
            })
          }
        }
      }
      
      setLoading(false)
    }

    loadEvent()
  }, [eventId, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast({
        title: t("common.error"),
        description: t("events.titleRequired") || "Title is required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    
    const result = await updateEvent(eventId, {
      title: title.trim(),
      description: description.trim() || undefined,
      event_type: eventType,
      privacy,
      location: location.trim() || undefined,
      starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
      max_players: maxPlayers ? parseInt(maxPlayers, 10) : undefined,
      event_config: {
        ...(event.event_config || {}),
        scoring: {
          mode: eventConfig.scoringMode,
          win: Number(eventConfig.winPoints),
          draw: Number(eventConfig.drawPoints),
          loss: Number(eventConfig.lossPoints),
        },
      },
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
        description: t("events.eventUpdated") || "Event updated successfully",
      })
      router.push(`/events/${eventId}`)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-dark to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-dark to-background flex items-center justify-center">
        <ArchiveCard className="max-w-md">
          <ArchiveCardContent className="p-8 text-center">
            <h1 className="text-2xl text-accent-gold font-cinzel mb-4">
              {t("common.error") || "Error"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || (t("events.notFound") || "Event not found")}
            </p>
            <div className="flex justify-center">
              <ArchiveCardButton active onClick={() => router.push("/events")} icon={<ArrowLeft className="w-4 h-4" />}>
                {t("events.backToEvents") || "Back to Events"}
              </ArchiveCardButton>
            </div>
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-dark to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <ArchiveCardButton
            onClick={() => router.push(`/events/${eventId}`)}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {t("common.back") || "Back"}
          </ArchiveCardButton>
        </div>

        <ArchiveCard>
          <ArchiveCardHeader>
            <ArchiveCardTitle className="text-2xl normal-case">
              {t("events.editEvent") || "Edit Event"}
            </ArchiveCardTitle>
          </ArchiveCardHeader>
          <ArchiveCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-accent-gold">
                  {t("events.eventTitle") || "Event Title"} *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("events.titlePlaceholder") || "Enter event title"}
                  className={archiveField}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-accent-gold">
                  {t("events.description") || "Description"}
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("events.descriptionPlaceholder") || "Describe your event..."}
                  rows={4}
                  className={archiveField}
                />
              </div>

              {/* Event Type & Privacy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-accent-gold">
                    {t("events.eventType") || "Event Type"}
                  </Label>
                  <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                    <SelectTrigger className={archiveField}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={archiveSelectContent}>
                      <SelectItem value="game_night" className={archiveSelectItem}>
                        {t("events.types.game_night") || "Game Night"}
                      </SelectItem>
                      <SelectItem value="campaign" className={archiveSelectItem}>
                        {t("events.types.campaign") || "Campaign"}
                      </SelectItem>
                      <SelectItem value="tournament" className={archiveSelectItem}>
                        {t("events.types.tournament") || "Tournament"}
                      </SelectItem>
                      <SelectItem value="league" className={archiveSelectItem}>
                        {t("events.types.league") || "League"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-accent-gold">
                    {t("events.privacy") || "Privacy"}
                  </Label>
                  <Select value={privacy} onValueChange={(v) => setPrivacy(v as EventPrivacy)}>
                    <SelectTrigger className={archiveField}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={archiveSelectContent}>
                      <SelectItem value="public" className={archiveSelectItem}>
                        {t("events.public") || "Public"}
                      </SelectItem>
                      <SelectItem value="friends" className={archiveSelectItem}>
                        {t("events.friendsOnly") || "Friends Only"}
                      </SelectItem>
                      <SelectItem value="private" className={archiveSelectItem}>
                        {t("events.private") || "Private"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scoring */}
              {(eventType === "tournament" || eventType === "league") && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-accent-gold">Pisteytys</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Valitse pisteytys, jota käytetään ottelutulosten pisteiden laskemiseen.
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
                      <SelectValue placeholder="Valitse pisteytysmalli" />
                    </SelectTrigger>
                    <SelectContent className={archiveSelectContent}>
                      <SelectItem value="3_1_0" className={archiveSelectItem}>Voitto 3 / tasapeli 1 / tappio 0</SelectItem>
                      <SelectItem value="3_0_0" className={archiveSelectItem}>Voitto 3 / tasapeli 0 / tappio 0</SelectItem>
                      <SelectItem value="2_1_0" className={archiveSelectItem}>Voitto 2 / tasapeli 1 / tappio 0</SelectItem>
                      <SelectItem value="2_0_0" className={archiveSelectItem}>Voitto 2 / tasapeli 0 / tappio 0</SelectItem>
                      <SelectItem value="1_0_0" className={archiveSelectItem}>Voitto 1 / tasapeli 0 / tappio 0</SelectItem>
                      <SelectItem value="custom" className={archiveSelectItem}>Mukautettu</SelectItem>
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
                              <SelectItem key={i} value={String(i)} className={archiveSelectItem}>{i} p</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-accent-gold">
                  {t("events.location") || "Location"}
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("events.locationPlaceholder") || "Where will this event take place?"}
                  className={archiveField}
                />
              </div>

              {/* Date/Time & Max Players */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startsAt" className="text-accent-gold">
                    {t("events.dateTime") || "Date & Time"} *
                  </Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className={archiveField}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPlayers" className="text-accent-gold">
                    {t("events.maxPlayers") || "Max Players"}
                  </Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    min="2"
                    max="100"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    placeholder="e.g. 8"
                    className={archiveField}
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4">
                <ArchiveCardButton
                  type="button"
                  onClick={() => router.push(`/events/${eventId}`)}
                >
                  {t("common.cancel") || "Cancel"}
                </ArchiveCardButton>
                <ArchiveCardButton
                  type="submit"
                  active
                  disabled={saving}
                  icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                >
                  {t("common.save") || "Save Changes"}
                </ArchiveCardButton>
              </div>
            </form>
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    </div>
  )
}
