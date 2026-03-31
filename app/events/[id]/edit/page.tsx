"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [eventType, setEventType] = useState<EventType>("board_game_night")
  const [privacy, setPrivacy] = useState<EventPrivacy>("public")
  const [location, setLocation] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [maxPlayers, setMaxPlayers] = useState("")

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
          setEventType(result.event.event_type || "board_game_night")
          setPrivacy(result.event.privacy || "public")
          setLocation(result.event.location || "")
          // Format date for datetime-local input
          if (result.event.starts_at) {
            const date = new Date(result.event.starts_at)
            setStartsAt(date.toISOString().slice(0, 16))
          }
          setMaxPlayers(result.event.max_players?.toString() || "")
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
        <Card className="room-furniture max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl text-accent-gold font-cinzel mb-4">
              {t("common.error") || "Error"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || (t("events.notFound") || "Event not found")}
            </p>
            <Button onClick={() => router.push("/events")} className="theme-accent-gold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("events.backToEvents") || "Back to Events"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-dark to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/events/${eventId}`)}
            className="text-accent-gold hover:text-accent-gold/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back") || "Back"}
          </Button>
        </div>

        <Card className="room-furniture">
          <CardHeader>
            <CardTitle className="text-2xl text-accent-gold font-cinzel">
              {t("events.editEvent") || "Edit Event"}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                />
              </div>

              {/* Event Type & Privacy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-accent-gold">
                    {t("events.eventType") || "Event Type"}
                  </Label>
                  <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="board_game_night">
                        {t("events.boardGameNight") || "Board Game Night"}
                      </SelectItem>
                      <SelectItem value="rpg_session">
                        {t("events.rpgSession") || "RPG Session"}
                      </SelectItem>
                      <SelectItem value="tournament">
                        {t("events.tournament") || "Tournament"}
                      </SelectItem>
                      <SelectItem value="custom">
                        {t("events.custom") || "Custom Event"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-accent-gold">
                    {t("events.privacy") || "Privacy"}
                  </Label>
                  <Select value={privacy} onValueChange={(v) => setPrivacy(v as EventPrivacy)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        {t("events.public") || "Public"}
                      </SelectItem>
                      <SelectItem value="friends">
                        {t("events.friendsOnly") || "Friends Only"}
                      </SelectItem>
                      <SelectItem value="private">
                        {t("events.private") || "Private"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/events/${eventId}`)}
                >
                  {t("common.cancel") || "Cancel"}
                </Button>
                <Button type="submit" className="theme-accent-gold" disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {t("common.save") || "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
