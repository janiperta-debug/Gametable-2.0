"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArchiveCard,
  ArchiveCardButton,
  ArchiveCardContent,
  ArchiveCardHeader,
  ArchiveCardTitle,
  ArchiveIconButton,
} from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { EventChat } from "@/components/event-chat"
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, Globe, UserCheck, Lock, 
  Edit, Loader2, User, XCircle, CheckCircle2, UserPlus, X
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { getEventById, updateRSVP, cancelEvent, completeEvent, getInvitableUsers, inviteToEvent, uninviteFromEvent, type Event, type EventParticipant, type RSVPStatus } from "@/app/actions/events"
import { useToast } from "@/hooks/use-toast"
import { awardPersonalTrophies, getSourcePersonalTrophies } from "@/app/actions/personal-trophies"
import { getLeagueTournaments, setTournamentLeague, getLeagueStandings, updateLeaguePlacementPoints, type LeagueStanding } from "@/app/actions/league"
import { createClient } from "@/lib/supabase/client"
import { convertLegacyLeague } from "@/app/actions/league-hub"
import { addEventRound, addPlannedEventRounds, addEventSession, addPlannedEventSessions, updateEventSession, updateCampaignProgression, addEventMatch, addEventEntry, removeEventEntry, recordEventMatch, getEventStructure, getEventStandings, type CampaignProgression } from "@/app/actions/event-structure"

const EVENT_TYPE_IMAGES: Record<string, string> = {
  game_night: "/images/events/game-night.png",
  campaign: "/images/events/campaign.png",
  tournament: "/images/events/tournament.png",
  league: "/images/events/league.png",
}

const getPrivacyIcon = (privacy: string | null) => {
  switch (privacy) {
    case "public":
      return <Globe className="w-4 h-4" />
    case "friends":
      return <UserCheck className="w-4 h-4" />
    case "private":
      return <Lock className="w-4 h-4" />
    default:
      return <Globe className="w-4 h-4" />
  }
}

const getPrivacyLabel = (privacy: string | null, t: (key: string) => string) => {
  switch (privacy) {
    case "public":
      return t("events.publicEvent") || "Public Event"
    case "friends":
      return t("events.friendsOnly") || "Friends Only"
    case "private":
      return t("events.privateEvent") || "Private (Invite Only)"
    default:
      return t("events.publicEvent") || "Public Event"
  }
}

const formatEventDate = (dateString: string, locale: "fi" | "en") => {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return locale === "fi" ? "Tänään" : "Today"
  if (date.toDateString() === tomorrow.toDateString()) return locale === "fi" ? "Huomenna" : "Tomorrow"

  return date.toLocaleDateString(locale === "fi" ? "fi-FI" : "en-GB", {
    weekday: "long", day: "numeric", month: "long",
  })
}

const formatEventTime = (startDate: string, endDate: string | null | undefined, locale: "fi" | "en") => {
  const format = (value: string) => new Date(value).toLocaleTimeString(locale === "fi" ? "fi-FI" : "en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
  return endDate ? `${format(startDate)}–${format(endDate)}` : format(startDate)
}

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { t, locale } = useTranslation()
  const { toast } = useToast()
  const eventId = params.id as string

  const [event, setEvent] = useState<(Event & { participants?: EventParticipant[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [updatingRsvp, setUpdatingRsvp] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [completionError, setCompletionError] = useState("")
  const [championEntryId, setChampionEntryId] = useState("")
  const [runnerUpId, setRunnerUpId] = useState("")
  const [thirdPlaceId, setThirdPlaceId] = useState("")
  const [personalAwardsIssued, setPersonalAwardsIssued] = useState(false)
  const [issuingAwards, setIssuingAwards] = useState(false)
  const [invitableUsers, setInvitableUsers] = useState<Array<{ id: string; display_name: string | null; avatar_url: string | null }>>([])
  const [inviting, setInviting] = useState<string | null>(null)
  const [showInviteSection, setShowInviteSection] = useState(false)
  const [standings, setStandings] = useState<any[]>([])
  const [leagueTournaments, setLeagueTournaments] = useState<any[]>([])
  const [availableTournaments, setAvailableTournaments] = useState<any[]>([])
  const [leagueSaving, setLeagueSaving] = useState(false)
  const [convertingLeague, setConvertingLeague] = useState(false)
  const [leagueMatchForm, setLeagueMatchForm] = useState({ entryA: "", entryB: "", roundId: "" })
  const [leagueStandings, setLeagueStandings] = useState<LeagueStanding[]>([])
  const [placementPoints, setPlacementPoints] = useState("10, 7, 5, 3, 1")
  const [structure, setStructure] = useState<{ sessions: any[]; rounds: any[]; matches: any[]; participants: any[]; entries: any[]; profiles: any[] }>({ sessions: [], rounds: [], matches: [], participants: [], entries: [], profiles: [] })
  const [structureTitle, setStructureTitle] = useState("")
  const [structureLoading, setStructureLoading] = useState(false)
  const [sessionForm, setSessionForm] = useState({ title: "", startsAt: "", endsAt: "", notes: "" })
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingSessionForm, setEditingSessionForm] = useState({ title: "", startsAt: "", endsAt: "", notes: "", status: "planned" })
  const [campaignProgression, setCampaignProgression] = useState<CampaignProgression>({
    mode: "stages",
    label: "Vaihe",
    current: 0,
    total: 0,
    unit: "",
    currentStage: "",
    stages: [],
    note: "",
  })
  const [editingProgression, setEditingProgression] = useState(false)

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true)
      
      // Get current user
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const result = await getEventById(eventId)
      
      if (result.error) {
        setError(result.error)
      } else if (result.event) {
        setEvent(result.event)
        if (result.event.event_type === "tournament" && result.event.status === "completed") {
          void getSourcePersonalTrophies("tournament", eventId).then((award) => setPersonalAwardsIssued(award.awarded))
        }
        if (result.event.event_type === "league") {
          const linked = await getLeagueTournaments(eventId)
          setLeagueTournaments(linked.tournaments)
          setAvailableTournaments(linked.available)
          const season = await getLeagueStandings(eventId)
          setLeagueStandings(season.standings)
          const savedPoints = (result.event.event_config as Record<string, unknown> | null)?.placementPoints
          if (Array.isArray(savedPoints)) setPlacementPoints(savedPoints.join(", "))
        }
        if (result.event.event_type === "campaign") {
          const saved = (result.event.event_config as Record<string, unknown> | null)?.progression as Partial<CampaignProgression> | undefined
          if (saved) {
            setCampaignProgression({
              mode: saved.mode === "counter" || saved.mode === "freeform" ? saved.mode : "stages",
              label: String(saved.label || "Vaihe"),
              current: Number(saved.current || 0),
              total: Number(saved.total || 0),
              unit: String(saved.unit || ""),
              currentStage: String(saved.currentStage || ""),
              stages: Array.isArray(saved.stages) ? saved.stages.map(String) : [],
              note: String(saved.note || ""),
            })
          }
        }
      }
      
      const structureResult = await getEventStructure(eventId)
      const standingsResult = await getEventStandings(eventId)
      setStandings(standingsResult.standings || [])
      setStructure({ sessions: structureResult.sessions, rounds: structureResult.rounds, matches: structureResult.matches || [], participants: structureResult.participants || [], entries: structureResult.entries || [], profiles: structureResult.profiles || [] })
      setLoading(false)
    }

    loadEvent()
  }, [eventId])

  const refreshEventStructure = async () => {
    const refreshed = await getEventStructure(eventId)
    setStructure({ sessions: refreshed.sessions, rounds: refreshed.rounds, matches: refreshed.matches || [], participants: refreshed.participants || [], entries: refreshed.entries || [], profiles: refreshed.profiles || [] })
    const standingsResult = await getEventStandings(eventId)
    setStandings(standingsResult.standings || [])
    if (event?.event_type === "league") {
      const season = await getLeagueStandings(eventId)
      setLeagueStandings(season.standings)
    }
  }

  const refreshLeague = async () => {
    const [linked, season] = await Promise.all([getLeagueTournaments(eventId), getLeagueStandings(eventId)])
    setLeagueTournaments(linked.tournaments)
    setAvailableTournaments(linked.available)
    setLeagueStandings(season.standings)
  }

  const addCompetitor = async (userId: string) => {
    const profile = structure.profiles.find((p: any) => p.id === userId)
    const result = await addEventEntry(eventId, userId, profile?.display_name || profile?.username || undefined)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      await refreshEventStructure()
    }
  }

  const removeCompetitor = async (entryId: string) => {
    const result = await removeEventEntry(eventId, entryId)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      await refreshEventStructure()
    }
  }

  const addMatch = async (roundId: string) => {
    const selects = document.querySelectorAll<HTMLSelectElement>(`[data-round-id="${roundId}"] select`)
    const entryA = selects[0]?.value
    const entryB = selects[1]?.value
    if (!entryA || !entryB || entryA === entryB) return
    const result = await addEventMatch(eventId, { round_id: roundId, entry_a_id: entryA, entry_b_id: entryB })
    if (result.error) toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    else {
      await refreshEventStructure()
    }
  }

  const addLeagueMatch = async () => {
    if (!leagueMatchForm.entryA || !leagueMatchForm.entryB || leagueMatchForm.entryA === leagueMatchForm.entryB) {
      toast({ title: "Valitse kaksi eri kilpailijaa", variant: "destructive" })
      return
    }
    setLeagueSaving(true)
    try {
      let roundId = leagueMatchForm.roundId
      if (!roundId) {
        const existing = structure.rounds.find((round: any) => round.title === "Sarjaottelut")
        if (existing) roundId = existing.id
        else {
          const created = await addEventRound(eventId, { title: "Sarjaottelut" })
          if (created.error || !created.round?.id) {
            toast({ title: t("eventDynamic.s8"), description: created.error, variant: "destructive" })
            return
          }
          roundId = created.round.id
        }
      }
      const result = await addEventMatch(eventId, { round_id: roundId, entry_a_id: leagueMatchForm.entryA, entry_b_id: leagueMatchForm.entryB })
      if (result.error) toast({ title: t("eventDynamic.s8"), description: result.error, variant: "destructive" })
      else {
        setLeagueMatchForm({ entryA: "", entryB: "", roundId: "" })
        await refreshEventStructure()
      }
    } finally {
      setLeagueSaving(false)
    }
  }

  const saveMatchResult = async (matchId: string, winnerId: string, scoreA: string, scoreB: string) => {
    const result = await recordEventMatch(eventId, matchId, {
      winner_id: winnerId || undefined,
      score_a: scoreA === "" ? undefined : Number(scoreA),
      score_b: scoreB === "" ? undefined : Number(scoreB),
    })
    if (result.error) toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    else {
      await refreshEventStructure()
    }
  }

  const createPlannedRounds = async () => {
    if (!event || (event.event_type !== "tournament" && event.event_type !== "league")) return

    const plannedRounds = Number((event.event_config as Record<string, unknown> | null)?.rounds || 0)
    if (!plannedRounds) return

    setStructureLoading(true)
    const result = await addPlannedEventRounds(eventId)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      await refreshEventStructure()
      if (result.created) {
        toast({
          title: t("common.success"),
          description: `${result.created} kierrosta luotu.`,
        })
      }
    }
    setStructureLoading(false)
  }

  const toLocalDateTime = (value?: string | null) => {
    if (!value) return ""
    const date = new Date(value)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const saveCampaignProgression = async () => {
    setStructureLoading(true)
    const result = await updateCampaignProgression(eventId, campaignProgression)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      setEvent((current) => current ? { ...current, event_config: result.event?.event_config || current.event_config } : current)
      setEditingProgression(false)
      toast({ title: t("common.success"), description: "Kampanjan eteneminen tallennettu." })
    }
    setStructureLoading(false)
  }

  const createPlannedSessions = async () => {
    if (!event || event.event_type !== "campaign") return
    const plannedSessions = Number((event.event_config as Record<string, unknown> | null)?.rounds || 0)
    if (!plannedSessions) return

    setStructureLoading(true)
    const result = await addPlannedEventSessions(eventId)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      await refreshEventStructure()
      if (result.created) {
        toast({ title: t("common.success"), description: `${result.created} sessiota luotu.` })
      }
    }
    setStructureLoading(false)
  }

  const createCampaignSession = async () => {
    if (!sessionForm.title.trim()) return
    setStructureLoading(true)
    const result = await addEventSession(eventId, {
      title: sessionForm.title,
      starts_at: sessionForm.startsAt ? new Date(sessionForm.startsAt).toISOString() : undefined,
      ends_at: sessionForm.endsAt ? new Date(sessionForm.endsAt).toISOString() : undefined,
      notes: sessionForm.notes,
    })
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      setSessionForm({ title: "", startsAt: "", endsAt: "", notes: "" })
      await refreshEventStructure()
    }
    setStructureLoading(false)
  }

  const startSessionEdit = (session: any) => {
    setEditingSessionId(session.id)
    setEditingSessionForm({
      title: session.title || "",
      startsAt: toLocalDateTime(session.starts_at),
      endsAt: toLocalDateTime(session.ends_at),
      notes: session.notes || "",
      status: session.status || "planned",
    })
  }

  const completeSession = async (sessionId: string) => {
    setStructureLoading(true)
    const result = await updateEventSession(eventId, sessionId, { status: "completed" })
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      await refreshEventStructure()
    }
    setStructureLoading(false)
  }

  const saveSessionEdit = async () => {
    if (!editingSessionId || !editingSessionForm.title.trim()) return
    setStructureLoading(true)
    const result = await updateEventSession(eventId, editingSessionId, {
      title: editingSessionForm.title,
      starts_at: editingSessionForm.startsAt ? new Date(editingSessionForm.startsAt).toISOString() : null,
      ends_at: editingSessionForm.endsAt ? new Date(editingSessionForm.endsAt).toISOString() : null,
      notes: editingSessionForm.notes,
      status: editingSessionForm.status as "planned" | "active" | "completed" | "cancelled",
    })
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      setEditingSessionId(null)
      await refreshEventStructure()
    }
    setStructureLoading(false)
  }

  const addStructureItem = async () => {
    if (!structureTitle.trim()) return
    setStructureLoading(true)
    const result = event?.event_type === "campaign"
      ? await addEventSession(eventId, { title: structureTitle })
      : await addEventRound(eventId, { title: structureTitle })
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      setStructureTitle("")
      const refreshed = await getEventStructure(eventId)
      setStructure({ sessions: refreshed.sessions, rounds: refreshed.rounds, matches: refreshed.matches || [], participants: refreshed.participants || [], entries: refreshed.entries || [], profiles: refreshed.profiles || [] })
    }
    setStructureLoading(false)
  }

  const handleRSVP = async (status: RSVPStatus) => {
    if (!currentUserId) {
      toast({
        title: t("common.error"),
        description: t("auth.loginRequired") || "Please log in to RSVP",
        variant: "destructive",
      })
      return
    }

    setUpdatingRsvp(true)
    const result = await updateRSVP(eventId, status)
    
    if (result.error) {
      toast({
        title: t("common.error"),
        description: result.error,
        variant: "destructive",
      })
    } else {
      // Refresh event data
      const refreshed = await getEventById(eventId)
      if (refreshed.event) {
        setEvent(refreshed.event)
      }
      toast({
        title: t("common.success"),
        description: t("events.rsvpUpdated") || "Your RSVP has been updated",
      })
    }
    
    setUpdatingRsvp(false)
  }

  const handleComplete = async () => {
    if (completing) return
    if (event?.event_type === "tournament" && awardEnabled && (!championEntryId || (thirdPlaceId && !runnerUpId) || [championEntryId, runnerUpId, thirdPlaceId].filter(Boolean).length !== new Set([championEntryId, runnerUpId, thirdPlaceId].filter(Boolean)).size)) {
      setCompletionError(locale === "fi" ? "Valitse palkintosijat järjestyksessä ja jokaiselle eri kilpailija." : "Choose distinct competitors for each awarded place in order.")
      return
    }
    if (!confirm(t("events.confirmComplete") || "Are you sure you want to mark this event as completed? This will move it to past events.")) return

    setCompletionError("")
    setCompleting(true)
    try {
      // A failed or stale Server Action must never leave the completion button spinning forever.
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      let result: { success: boolean; error?: string; awardError?: string }
      try {
        const response = await fetch("/api/events/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ eventId, championEntryId: event?.event_type === "tournament" ? championEntryId : undefined, awardRecipients: awardEnabled ? [championEntryId, runnerUpId, thirdPlaceId].filter(Boolean).map((id) => structure.entries.find((entry: any) => entry.id === id)?.user_id).filter(Boolean) : [] }),
          signal: controller.signal,
        })
        result = await response.json()
        if (!response.ok && !result.error) result.error = `HTTP ${response.status}`
      } finally {
        clearTimeout(timeout)
      }
      if (!result.success || result.error) {
        const message = result.error || (locale === "fi" ? "Tapahtuman päättäminen epäonnistui." : "Could not complete the event.")
        setCompletionError(message)
        toast({ title: t("common.error"), description: message, variant: "destructive" })
        return
      }
      setEvent((current) => current ? { ...current, status: "completed" } : current)
      if (result.awardError) {
        setCompletionError((locale === "fi" ? "Turnaus päättyi, mutta pokaalien jako odottaa: " : "Tournament completed, but trophy issuance needs retry: ") + result.awardError)
        return
      }
      if (awardEnabled) setPersonalAwardsIssued(true)
      toast({ title: t("common.success"), description: t("events.eventCompleted") || "Event completed" })
      router.push("/events")
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError"
      const message = timedOut
        ? (locale === "fi" ? "Vahvistus ei vastannut ajoissa. Päivitä sivu ja tarkista tapahtuman tila ennen uutta yritystä." : "Confirmation timed out. Refresh and check the event status before retrying.")
        : (locale === "fi" ? "Yhteys katkesi tai julkaisu vaihtui. Päivitä sivu ja yritä uudelleen, jos tapahtuma on edelleen kesken." : "Connection failed or deployment changed. Refresh and retry only if the event is still active.")
      setCompletionError(message)
      console.error("Event completion request failed:", error)
      toast({
        title: t("common.error"),
        description: timedOut
          ? (locale === "fi" ? "Vahvistus ei vastannut ajoissa. Päivitä sivu ja tarkista tapahtuman tila ennen uutta yritystä." : "Confirmation timed out. Refresh and check the event status before retrying.")
          : (locale === "fi" ? "Yhteys katkesi tai julkaisu vaihtui. Päivitä sivu ja yritä uudelleen, jos tapahtuma on edelleen kesken." : "Connection failed or deployment changed. Refresh and retry only if the event is still active."),
        variant: "destructive",
      })
    } finally {
      setCompleting(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm(t("events.confirmCancel") || "Are you sure you want to cancel this event?")) {
      return
    }

    setCancelling(true)
    const result = await cancelEvent(eventId)
    
    if (result.error) {
      toast({
        title: t("common.error"),
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: t("common.success"),
        description: t("events.eventCancelled") || "Event has been cancelled",
      })
      router.push("/events")
    }
    
    setCancelling(false)
  }

  const loadInvitableUsers = async () => {
    const result = await getInvitableUsers(eventId)
    if (!result.error) {
      setInvitableUsers(result.users)
    }
    setShowInviteSection(true)
  }

  const handleInvite = async (userId: string) => {
    setInviting(userId)
    const result = await inviteToEvent(eventId, userId)
    
    if (result.error) {
      toast({
        title: t("common.error"),
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: t("common.success"),
        description: t("events.inviteSent") || "Invitation sent",
      })
      // Remove from invitable list
      setInvitableUsers(prev => prev.filter(u => u.id !== userId))
      // Refresh event to show new participant
      const eventResult = await getEventById(eventId)
      if (eventResult.event) {
        setEvent(eventResult.event)
      }
    }
    
    setInviting(null)
  }

  const handleUninvite = async (participantId: string) => {
    const result = await uninviteFromEvent(eventId, participantId)
    
    if (result.error) {
      toast({
        title: t("common.error"),
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: t("common.success"),
        description: t("events.inviteRemoved") || "Participant removed",
      })
      // Refresh event
      const eventResult = await getEventById(eventId)
      if (eventResult.event) {
        setEvent(eventResult.event)
      }
    }
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
              {t("events.notFound") || "Event Not Found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || (t("events.notFoundDesc") || "The event you're looking for doesn't exist.")}
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

  const awardCategory = (event.event_config as any)?.awards?.category as string | undefined
  const awardEnabled = event.event_type === "tournament" && !!awardCategory && awardCategory !== "none"
  const eligibleAwardEntries = structure.entries.filter((entry: any) => entry.user_id && entry.status === "active" && structure.matches.some((match: any) => match.status === "completed" && (match.entry_a_id === entry.id || match.entry_b_id === entry.id)))
  const isHost = currentUserId === event.host_id
  const userRsvp = event.user_rsvp

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-dark to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div className="mr-auto">
            <ArchiveCardButton onClick={() => router.push("/events")} icon={<ArrowLeft className="w-4 h-4" />}>
              {t("events.backToEvents") || "Takaisin tapahtumiin"}
            </ArchiveCardButton>
          </div>

          {isHost && event.status !== "completed" && event.status !== "cancelled" && (
            <>
              <ArchiveCardButton
                onClick={() => router.push(`/events/${eventId}/edit`)}
                icon={<Edit className="w-4 h-4" />}
              >
                {t("common.edit") || "Muokkaa"}
              </ArchiveCardButton>
              <ArchiveCardButton
                onClick={handleComplete}
                disabled={completing || cancelling || (event.event_type === "tournament" && (!championEntryId || !structure.matches.length || structure.matches.some((match: any) => match.status !== "completed")))}
                icon={completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              >
                {t("events.completeEvent") || t("eventDynamic.s9")}
              </ArchiveCardButton>
              <ArchiveCardButton
                onClick={handleCancel}
                disabled={cancelling || completing}
                icon={cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              >
                {t("events.cancel") || "Peruuta tapahtuma"}
              </ArchiveCardButton>
            </>
          )}
        </div>

        {completionError && <div role="alert" className="mb-4 rounded-md border border-red-400/60 bg-red-950/50 p-4 text-sm text-red-100"><strong>{locale === "fi" ? "Tapahtuman päättäminen epäonnistui" : "Event completion failed"}</strong><p className="mt-2">{completionError}</p></div>}

        {event.event_type === "tournament" && isHost && event.status !== "completed" && event.status !== "cancelled" && (
          <ArchiveCard className="mb-6">
            <ArchiveCardHeader><ArchiveCardTitle className="text-xl normal-case">{locale === "fi" ? "Turnauksen voittajan vahvistaminen" : "Confirm tournament champion"}</ArchiveCardTitle></ArchiveCardHeader>
            <ArchiveCardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{locale === "fi" ? "Kirjaa kaikki ottelutulokset ja valitse voittaja ennen tapahtuman päättämistä. Voittajan on oltava rekisteröitynyt kilpailija, jolla on vähintään yksi kirjattu otteluvoitto." : "Record every match result and select the champion before completing the event. The champion must be a registered competitor with at least one recorded match win."}</p>
              <select aria-label={locale === "fi" ? "Turnauksen voittaja" : "Tournament champion"} value={championEntryId} onChange={(e) => setChampionEntryId(e.target.value)} className="w-full rounded-md border border-accent-gold/30 bg-background p-3">
                <option value="">{locale === "fi" ? "Valitse voittaja" : "Select champion"}</option>
                {structure.entries.filter((entry: any) => entry.user_id && structure.matches.some((match: any) => match.status === "completed" && match.winner_entry_id === entry.id)).map((entry: any) => {
                  const profile = structure.profiles.find((p: any) => p.id === entry.user_id)
                  return <option key={entry.id} value={entry.id}>{entry.display_name || profile?.display_name || profile?.username || (locale === "fi" ? "Kilpailija" : "Competitor")}</option>
                })}
              </select>
              {awardEnabled && <div className="space-y-3 rounded-md border border-accent-gold/30 p-3">
                <h3 className="font-heading text-accent-gold">{locale === "fi" ? "Palkitseminen · kolme parasta" : "Awards · top three"}</h3>
                <p className="text-sm text-muted-foreground">{locale === "fi" ? "Kulta annetaan vahvistetulle voittajalle. Valitse halutessasi myös hopea ja pronssi. Pokaalit jaetaan vasta, kun vahvistat turnauksen päättymisen." : "Gold goes to the confirmed champion. Optionally select silver and bronze. Trophies are issued only after you confirm tournament completion."}</p>
                {([["2", runnerUpId, setRunnerUpId], ["3", thirdPlaceId, setThirdPlaceId]] as const).map(([place, value, setter]) => <label key={place} className="block space-y-1 text-sm">
                  <span>{place === "2" ? (locale === "fi" ? "Hopea" : "Silver") : (locale === "fi" ? "Pronssi" : "Bronze")}</span>
                  <select value={value} onChange={e => setter(e.target.value)} className="w-full rounded-md border border-accent-gold/30 bg-background p-3">
                    <option value="">{locale === "fi" ? "Ei jaeta" : "Not awarded"}</option>
                    {eligibleAwardEntries.filter((entry: any) => entry.id !== championEntryId).map((entry: any) => <option key={entry.id} value={entry.id}>{entry.display_name || structure.profiles.find((profile: any) => profile.id === entry.user_id)?.display_name || (locale === "fi" ? "Kilpailija" : "Competitor")}</option>)}
                  </select>
                </label>)}
              </div>}
              {structure.matches.some((match: any) => match.status !== "completed") && <p className="text-sm text-amber-300">{locale === "fi" ? "Kaikkien otteluiden tulokset on kirjattava ennen turnauksen päättämistä." : "All match results must be recorded before the tournament can be completed."}</p>}
            </ArchiveCardContent>
          </ArchiveCard>
        )}
        {event.event_type === "tournament" && isHost && event.status === "completed" && awardEnabled && !personalAwardsIssued && <ArchiveCard className="mb-6">
          <ArchiveCardHeader><ArchiveCardTitle>{locale === "fi" ? "Pokaalien jako" : "Award trophies"}</ArchiveCardTitle></ArchiveCardHeader>
          <ArchiveCardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{locale === "fi" ? "Turnaus on päättynyt. Voit vahvistaa palkinnot nyt, jos niitä ei vielä jaettu." : "The tournament is complete. Confirm the trophies if they have not yet been issued."}</p>
            {[["1", championEntryId, setChampionEntryId], ["2", runnerUpId, setRunnerUpId], ["3", thirdPlaceId, setThirdPlaceId]].map(([place, value, setter]: any) => <label key={place} className="block space-y-1">
              <span>{place === "1" ? (locale === "fi" ? "Kulta" : "Gold") : place === "2" ? (locale === "fi" ? "Hopea" : "Silver") : (locale === "fi" ? "Pronssi" : "Bronze")}</span>
              <select value={place === "1" ? ((event.event_config as any)?.champion_entry_id || "") : value} disabled={place === "1"} onChange={e => setter(e.target.value)} className="w-full rounded-md border border-accent-gold/30 bg-background p-3">
                <option value="">{locale === "fi" ? "Ei jaeta" : "Not awarded"}</option>
                {structure.entries.filter((entry: any) => entry.user_id).map((entry: any) => <option key={entry.id} value={entry.id}>{entry.display_name || (locale === "fi" ? "Kilpailija" : "Competitor")}</option>)}
              </select>
            </label>)}
            <ArchiveCardButton disabled={issuingAwards} onClick={async () => {
              const ids = [(event.event_config as any)?.champion_entry_id, runnerUpId, thirdPlaceId].filter(Boolean)
              const recipients = ids.map((id: string) => structure.entries.find((entry: any) => entry.id === id)?.user_id).filter(Boolean)
              if (recipients.length !== ids.length || new Set(recipients).size !== recipients.length || (thirdPlaceId && !runnerUpId)) { setCompletionError(locale === "fi" ? "Tarkista palkintosijat." : "Check award placements."); return }
              if (!window.confirm(locale === "fi" ? "Jaetaanko pokaalit valituille kilpailijoille?" : "Issue trophies to the selected competitors?")) return
              setIssuingAwards(true)
              try { const result = await awardPersonalTrophies("tournament", eventId, recipients); if (result.success) { setPersonalAwardsIssued(true); setCompletionError("") } else setCompletionError(result.error || "Award failed") }
              finally { setIssuingAwards(false) }
            }}>{locale === "fi" ? "Vahvista pokaalien jako" : "Confirm trophy awards"}</ArchiveCardButton>
          </ArchiveCardContent>
        </ArchiveCard>}
        {event.event_type === "league" && isHost && (
          <ArchiveCard className="mb-6">
            <ArchiveCardHeader><ArchiveCardTitle className="text-xl normal-case">{t("eventUi.s28")}</ArchiveCardTitle></ArchiveCardHeader>
            <ArchiveCardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("eventUi.s29")}</p>
              <ArchiveCardButton disabled={convertingLeague} onClick={async () => {
                setConvertingLeague(true)
                try {
                  const result = await convertLegacyLeague(eventId)
                  if (result.error) toast({ title: t("eventDynamic.s10"), description: result.error, variant: "destructive" })
                  else if (result.id) {
                    if (result.warning) toast({ title: "Tarkista siirto", description: result.warning })
                    router.push("/leagues/" + result.id)
                  }
                } catch { toast({ title: t("eventDynamic.s10"), variant: "destructive" }) }
                finally { setConvertingLeague(false) }
              }}>{convertingLeague ? t("eventDynamic.s11") : t("eventDynamic.s12")}</ArchiveCardButton>
            </ArchiveCardContent>
          </ArchiveCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Event Info */}
            <ArchiveCard>
              <ArchiveCardHeader>
                <div className="flex flex-col items-center gap-4 text-center">
                  {EVENT_TYPE_IMAGES[event.event_type] && (
                    <div className="relative flex w-full items-center justify-center py-2">
                      {/* Shared ornaments for all event types. Missing files do not display broken image icons. */}
                      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[calc(50%-5rem)] bg-contain bg-left bg-no-repeat sm:w-[calc(50%-6rem)]"
                        style={{ backgroundImage: 'url("/images/events/ornate-left.png")' }} />
                      <div className="relative z-10 aspect-square w-32 overflow-hidden rounded-lg border border-accent-gold/30 sm:w-40">
                        <img src={EVENT_TYPE_IMAGES[event.event_type]} alt={t(`events.types.${event.event_type}`)}
                          className="h-full w-full object-cover" />
                      </div>
                      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[calc(50%-5rem)] bg-contain bg-right bg-no-repeat sm:w-[calc(50%-6rem)]"
                        style={{ backgroundImage: 'url("/images/events/ornate-right.png")' }} />
                    </div>
                  )}
                  <div className="w-full min-w-0">
                    <ArchiveCardTitle className="mb-2 text-center text-3xl normal-case break-words">
                      {event.title}
                    </ArchiveCardTitle>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      {getPrivacyIcon(event.privacy)}
                      <span className="text-sm">{getPrivacyLabel(event.privacy, t)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      {userRsvp && (
                        <Badge variant={userRsvp === "attending" ? "default" : "secondary"}
                          className={userRsvp === "attending" ? "bg-green-600" : userRsvp === "maybe" ? "bg-yellow-600" : ""}>
                          {userRsvp === "attending" ? (t("events.attending") || "Attending") :
                           userRsvp === "maybe" ? (t("events.maybe") || "Maybe") :
                           (t("events.invited") || "Invited")}
                        </Badge>
                      )}
                      {event.event_type && (
                        <Badge variant="outline" className="border-accent-gold/30 text-accent-gold">
                          {t(`events.types.${event.event_type}`)}
                        </Badge>
                      )}
                      {event.status === "cancelled" && (
                        <Badge variant="destructive">{t("events.cancelled") || "Peruttu"}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </ArchiveCardHeader>
              <ArchiveCardContent className="space-y-6">
                {/* Host */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center">
                    {event.host?.avatar_url ? (
                      <img 
                        src={event.host.avatar_url} 
                        alt={event.host?.display_name || "Host"} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-accent-gold" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("events.hostedBy") || "Hosted by"}
                    </p>
                    <p className="font-medium text-accent-gold">
                      {event.host?.display_name || t("profile.anonymous") || "Anonymous"}
                    </p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-accent-gold" />
                    <div>
                      <p className="font-medium">{formatEventDate(event.starts_at, locale)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-accent-gold" />
                    <div>
                      <p className="font-medium">{formatEventTime(event.starts_at, event.ends_at, locale)}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent-gold mt-1" />
                    <div>
                      <p className="font-medium">{event.location}</p>
                    </div>
                  </div>
                )}

                {/* Players */}
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-accent-gold" />
                  <div>
                    <p className="font-medium">
                      {event.participant_count || 0}
                      {event.max_players && `/${event.max_players}`} {t("events.attending") || "attending"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <div>
                    <h3 className="font-cinzel text-accent-gold mb-2">
                      {t("events.description") || "Description"}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                  </div>
                )}

                {/* RSVP Buttons - only show if not cancelled and user is logged in */}
                {event.status !== "cancelled" && currentUserId && !isHost && (
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-accent-gold/20">
                    <ArchiveCardButton
                      active={userRsvp === "attending"}
                      onClick={() => handleRSVP("attending")}
                      disabled={updatingRsvp}
                      icon={updatingRsvp ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                    >
                      {t("events.attending") || "Attending"}
                    </ArchiveCardButton>
                    <ArchiveCardButton
                      active={userRsvp === "maybe"}
                      onClick={() => handleRSVP("maybe")}
                      disabled={updatingRsvp}
                    >
                      {t("events.maybe") || "Maybe"}
                    </ArchiveCardButton>
                    <ArchiveCardButton
                      active={userRsvp === "declined"}
                      onClick={() => handleRSVP("declined")}
                      disabled={updatingRsvp}
                    >
                      {t("events.cantAttend") || "Can't Attend"}
                    </ArchiveCardButton>
                  </div>
                )}

                {!currentUserId && event.status !== "cancelled" && (
                  <div className="pt-4 border-t border-accent-gold/20">
                    <ArchiveCardButton asChild active fullWidth>
                      <Link href="/auth/login">
                        {t("events.loginToRsvp") || t("auth.loginToRsvp") || "Log in to RSVP"}
                      </Link>
                    </ArchiveCardButton>
                  </div>
                )}
              </ArchiveCardContent>
            </ArchiveCard>

            {event.event_type === "league" && (
              <ArchiveCard>
                <ArchiveCardHeader>
                  <ArchiveCardTitle className="text-xl normal-case">{t("eventUi.s30")}</ArchiveCardTitle>
                </ArchiveCardHeader>
                <ArchiveCardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("eventUi.s31")}</p>
                  {leagueTournaments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("eventUi.s32")}</p>
                  ) : (
                    <div className="space-y-2">
                      {leagueTournaments.map((item: any) => (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent-gold/20 p-3">
                          <button className="text-left text-accent-gold hover:underline" onClick={() => router.push(`/events/${item.id}`)}>{item.title}</button>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(item.starts_at).toLocaleDateString("fi-FI")}</span>
                            <span>{item.status === "completed" ? t("eventDynamic.s13") : item.status === "cancelled" ? "Peruttu" : t("eventDynamic.s14")}</span>
                            {isHost && <ArchiveCardButton disabled={leagueSaving} onClick={async () => {
                              setLeagueSaving(true)
                              const result = await setTournamentLeague(eventId, item.id, false)
                              if (result.error) toast({ title: "Virhe", description: result.error, variant: "destructive" })
                              else {
                                await refreshLeague()
                              }
                              setLeagueSaving(false)
                            }}>{t("eventUi.s33")}</ArchiveCardButton>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isHost && (
                    <div className="flex flex-wrap gap-2">
                      <select id="league-tournament-select" className="min-w-0 flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm">
                        <option value="">{t("eventUi.s34")}</option>
                        {availableTournaments.map((item: any) => <option key={item.id} value={item.id}>{item.title}</option>)}
                      </select>
                      <ArchiveCardButton disabled={leagueSaving || availableTournaments.length === 0} onClick={async () => {
                        const select = document.getElementById("league-tournament-select") as HTMLSelectElement | null
                        if (!select?.value) return
                        setLeagueSaving(true)
                        const result = await setTournamentLeague(eventId, select.value, true)
                        if (result.error) toast({ title: "Virhe", description: result.error, variant: "destructive" })
                        else {
                          await refreshLeague()
                        }
                        setLeagueSaving(false)
                      }}>{t("eventUi.s35")}</ArchiveCardButton>
                    </div>
                  )}
                </ArchiveCardContent>
              </ArchiveCard>
            )}
            {event.event_type === "league" && (
              <ArchiveCard>
                <ArchiveCardHeader><ArchiveCardTitle className="text-xl normal-case">{t("eventUi.s36")}</ArchiveCardTitle></ArchiveCardHeader>
                <ArchiveCardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("eventUi.s37")}</p>
                  {isHost && <div className="space-y-2">
                    <label htmlFor="league-placement-points" className="block text-sm text-accent-gold">{t("eventUi.s38")}</label>
                    <div className="flex flex-wrap gap-2">
                      <input id="league-placement-points" className="min-w-0 flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm" value={placementPoints} onChange={(e) => setPlacementPoints(e.target.value)} placeholder="10, 7, 5, 3, 1" />
                      <ArchiveCardButton disabled={leagueSaving} onClick={async () => {
                        const values = placementPoints.split(",").map((value) => Number(value.trim()))
                        if (values.some((value) => !Number.isInteger(value) || value < 0) || values.length < 1 || values.length > 20) {
                          toast({ title: "Virhe", description: "Anna 1–20 kokonaislukua pilkuilla erotettuna.", variant: "destructive" })
                          return
                        }
                        setLeagueSaving(true)
                        const result = await updateLeaguePlacementPoints(eventId, values)
                        if (result.error) toast({ title: "Virhe", description: result.error, variant: "destructive" })
                        else await refreshLeague()
                        setLeagueSaving(false)
                      }}>{t("eventUi.s39")}</ArchiveCardButton>
                    </div>
                  </div>}
                  {leagueStandings.length === 0 ? <p className="text-sm text-muted-foreground">{t("eventUi.s40")}</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-accent-gold/20 text-muted-foreground">
                          <th className="text-left py-2 pr-3">{t("eventUi.s41")}</th><th className="text-right px-2">{t("eventUi.s42")}</th><th className="text-right px-2">{t("eventUi.s43")}</th><th className="text-right px-2">{t("eventUi.s44")}</th><th className="text-right pl-2">{t("eventUi.s45")}</th>
                        </tr></thead>
                        <tbody>{leagueStandings.map((row) => <tr key={row.key} className="border-b border-accent-gold/10">
                          <td className="py-2 pr-3">{row.name}</td><td className="text-right px-2">{row.tournaments}</td><td className="text-right px-2">{row.leaguePoints}</td><td className="text-right px-2">{row.matchPoints}</td><td className="text-right pl-2 font-medium text-accent-gold">{row.points}</td>
                        </tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </ArchiveCardContent>
              </ArchiveCard>
            )}
            {event.event_type === "league" && (
              <ArchiveCard>
                <ArchiveCardHeader><ArchiveCardTitle className="text-xl normal-case">{t("eventUi.s46")}</ArchiveCardTitle></ArchiveCardHeader>
                <ArchiveCardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("eventUi.s47")}</p>
                  {isHost && <div className="space-y-3 rounded-md border border-accent-gold/20 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(["entryA", "entryB"] as const).map((side, index) => (
                        <select key={side} aria-label={`Kilpailija ${index + 1}`} value={leagueMatchForm[side]} onChange={(e) => setLeagueMatchForm((current) => ({ ...current, [side]: e.target.value }))} className="min-w-0 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm">
                          <option value="">Valitse kilpailija {index + 1}</option>
                          {structure.entries.filter((entry: any) => entry.status === "active").map((entry: any) => {
                            const profile = structure.profiles.find((p: any) => p.id === entry.user_id)
                            return <option key={entry.id} value={entry.id}>{entry.display_name || profile?.display_name || profile?.username || t("eventUi.competitor")}</option>
                          })}
                        </select>
                      ))}
                    </div>
                    <select aria-label={t("eventUi.s77")} value={leagueMatchForm.roundId} onChange={(e) => setLeagueMatchForm((current) => ({ ...current, roundId: e.target.value }))} className="w-full min-w-0 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm">
                      <option value="">{t("eventUi.s48")}</option>
                      {structure.rounds.map((round: any) => <option key={round.id} value={round.id}>{round.title?.match(/^Kierros (\d+)$/) ? t("eventFix.roundNumber", { number: round.round_number }) : round.title || t("eventFix.roundNumber", { number: round.round_number })}</option>)}
                    </select>
                    <ArchiveCardButton disabled={leagueSaving || !leagueMatchForm.entryA || !leagueMatchForm.entryB || leagueMatchForm.entryA === leagueMatchForm.entryB} onClick={addLeagueMatch}>{t("eventUi.s49")}</ArchiveCardButton>
                  </div>}
                  {structure.matches.length === 0 ? <p className="text-sm text-muted-foreground">{t("eventUi.s50")}</p> : (
                    <div className="space-y-2">
                      {structure.matches.map((match: any) => {
                        const a = structure.entries.find((entry: any) => entry.id === match.entry_a_id)
                        const b = structure.entries.find((entry: any) => entry.id === match.entry_b_id)
                        const round = structure.rounds.find((item: any) => item.id === match.round_id)
                        return <div key={match.id} className="rounded-md border border-accent-gold/15 p-3 space-y-2">
                          <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{a?.display_name || t("eventUi.competitor")} – {b?.display_name || t("eventUi.competitor")}</span><span className="text-muted-foreground">{round?.title || "Sarjaottelu"} · {match.status === "completed" ? "Pelattu" : "Tulossa"}</span></div>
                          {match.status === "completed" && <div className="text-sm text-accent-gold">Tulos: {match.score_a ?? "–"} – {match.score_b ?? "–"}</div>}
                          {isHost && <div className="grid grid-cols-2 gap-2">
                            <input id={`league-score-a-${match.id}`} aria-label={t("eventUi.s78")} type="number" min="0" defaultValue={match.score_a ?? ""} placeholder={t("eventUi.s79")} className="min-w-0 rounded-md border border-accent-gold/20 bg-background px-2 py-2 text-sm" />
                            <input id={`league-score-b-${match.id}`} aria-label={t("eventUi.s80")} type="number" min="0" defaultValue={match.score_b ?? ""} placeholder={t("eventUi.s81")} className="min-w-0 rounded-md border border-accent-gold/20 bg-background px-2 py-2 text-sm" />
                            <ArchiveCardButton disabled={leagueSaving} onClick={async () => {
                              const first = (document.getElementById(`league-score-a-${match.id}`) as HTMLInputElement)?.value
                              const second = (document.getElementById(`league-score-b-${match.id}`) as HTMLInputElement)?.value
                              if (first === "" || second === "" || Number(first) < 0 || Number(second) < 0) {
                                toast({ title: "Anna molempien kilpailijoiden tulokset", variant: "destructive" })
                                return
                              }
                              const scoreA = Number(first), scoreB = Number(second)
                              const winner = scoreA > scoreB ? match.player_a_id : scoreB > scoreA ? match.player_b_id : undefined
                              setLeagueSaving(true)
                              try {
                                const result = await recordEventMatch(eventId, match.id, { winner_id: winner, score_a: scoreA, score_b: scoreB })
                                if (result.error) toast({ title: "Virhe", description: result.error, variant: "destructive" })
                                else await refreshEventStructure()
                              } finally { setLeagueSaving(false) }
                            }}>{t("eventUi.s51")}</ArchiveCardButton>
                          </div>}
                        </div>
                      })}
                    </div>
                  )}
                </ArchiveCardContent>
              </ArchiveCard>
            )}
            {/* Competition Entries */}
            {(event.event_type === "tournament" || event.event_type === "league") && (
              <ArchiveCard>
                <ArchiveCardHeader>
                  <ArchiveCardTitle className="text-xl normal-case">{t("eventUi.s52")}</ArchiveCardTitle>
                </ArchiveCardHeader>
                <ArchiveCardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("eventUi.competitorHint")}
                  </p>
                  {isHost && (
                    <div className="flex gap-2">
                      <select id="competitor-select" className="flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm">
                        <option value="">{t("eventUi.s53")}</option>
                        {structure.profiles
                          .filter((p: any) => structure.participants.some((participant: any) => participant.user_id === p.id && participant.status === "attending"))
                          .filter((p: any) => !structure.entries.some((e: any) => e.user_id === p.id && e.status === "active"))
                          .map((p: any) => <option key={p.id} value={p.id}>{p.display_name || p.username || t("eventUi.s41")}</option>)}
                      </select>
                      <ArchiveCardButton onClick={() => {
                        const select = document.getElementById("competitor-select") as HTMLSelectElement | null
                        if (select?.value) addCompetitor(select.value)
                      }}>{t("eventDynamic.s24")}</ArchiveCardButton>
                    </div>
                  )}
                  {structure.entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("eventUi.s54")}</p>
                  ) : (
                    <div className="space-y-2">
                      {structure.entries.map((entry: any) => {
                        const profile = structure.profiles.find((p: any) => p.id === entry.user_id)
                        return (
                          <div key={entry.id} className="flex items-center justify-between rounded-md border border-accent-gold/10 p-3">
                            <span>{entry.display_name || profile?.display_name || profile?.username || t("eventUi.competitor")}</span>
                            {isHost && (
                              <button
                                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                onClick={() => removeCompetitor(entry.id)}
                                aria-label={t("eventUi.s82")}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ArchiveCardContent>
              </ArchiveCard>
            )}

            {event.event_type === "campaign" && (
              <ArchiveCard>
                <ArchiveCardHeader>
                  <ArchiveCardTitle className="text-xl normal-case">{t("eventUi.s55")}</ArchiveCardTitle>
                </ArchiveCardHeader>
                <ArchiveCardContent className="space-y-4">
                  {!editingProgression && !campaignProgression.currentStage && campaignProgression.stages.length === 0 && campaignProgression.total === 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t("eventUi.campaignModelHint")}
                      </p>
                      {isHost && (
                        <ArchiveCardButton onClick={() => setEditingProgression(true)}>{t("eventUi.s56")}</ArchiveCardButton>
                      )}
                    </div>
                  ) : editingProgression ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm text-accent-gold">{t("eventUi.s57")}</label>
                          <select
                            value={campaignProgression.mode}
                            onChange={(e) => setCampaignProgression({ ...campaignProgression, mode: e.target.value as CampaignProgression["mode"] })}
                            className="w-full rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                          >
                            <option value="stages">{t("eventUi.s58")}</option>
                            <option value="counter">{t("eventUi.s59")}</option>
                            <option value="freeform">{t("eventUi.s60")}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-accent-gold">{t("eventUi.s61")}</label>
                          <input
                            value={campaignProgression.label}
                            onChange={(e) => setCampaignProgression({ ...campaignProgression, label: e.target.value })}
                            placeholder={t("eventUi.s83")}
                            className="w-full rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      {campaignProgression.mode === "counter" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="number"
                            min="0"
                            value={campaignProgression.current}
                            onChange={(e) => setCampaignProgression({ ...campaignProgression, current: Number(e.target.value) })}
                            placeholder={t("eventUi.s84")}
                            className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                          />
                          <input
                            type="number"
                            min="0"
                            value={campaignProgression.total}
                            onChange={(e) => setCampaignProgression({ ...campaignProgression, total: Number(e.target.value) })}
                            placeholder={t("eventUi.s85")}
                            className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                          />
                          <input
                            value={campaignProgression.unit}
                            onChange={(e) => setCampaignProgression({ ...campaignProgression, unit: e.target.value })}
                            placeholder={t("eventUi.s86")}
                            className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      )}

                      {campaignProgression.mode === "stages" && (
                        <>
                          <input
                            value={campaignProgression.currentStage}
                            onChange={(e) => setCampaignProgression({ ...campaignProgression, currentStage: e.target.value })}
                            placeholder={t("eventUi.s87")}
                            className="w-full rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                          />
                          <textarea
                            value={campaignProgression.stages.join("\n")}
                            onChange={(e) => setCampaignProgression({ ...campaignProgression, stages: e.target.value.split("\n") })}
                            placeholder={t("eventUi.stagesPlaceholder")}
                            rows={5}
                            className="w-full rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                          />
                        </>
                      )}

                      {campaignProgression.mode === "freeform" && (
                        <textarea
                          value={campaignProgression.currentStage}
                          onChange={(e) => setCampaignProgression({ ...campaignProgression, currentStage: e.target.value })}
                          placeholder={t("eventUi.s88")}
                          rows={3}
                          className="w-full rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                        />
                      )}

                      <textarea
                        value={campaignProgression.note}
                        onChange={(e) => setCampaignProgression({ ...campaignProgression, note: e.target.value })}
                        placeholder={t("eventUi.s89")}
                        rows={2}
                        className="w-full rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                      />

                      <div className="flex flex-wrap gap-2">
                        <ArchiveCardButton onClick={saveCampaignProgression} disabled={structureLoading} active>
                          {structureLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tallenna eteneminen"}
                        </ArchiveCardButton>
                        <ArchiveCardButton onClick={() => setEditingProgression(false)} disabled={structureLoading}>
                          Peruuta
                        </ArchiveCardButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {campaignProgression.mode === "counter" && (
                        <>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-sm text-accent-gold">{campaignProgression.label}</span>
                            <span className="font-cinzel text-lg">{campaignProgression.current} / {campaignProgression.total}</span>
                          </div>
                          <div className="h-2 rounded-full bg-background/60 overflow-hidden">
                            <div
                              className="h-full bg-accent-gold transition-all"
                              style={{ width: `${campaignProgression.total > 0 ? Math.min(100, (campaignProgression.current / campaignProgression.total) * 100) : 0}%` }}
                            />
                          </div>
                          {campaignProgression.unit && <div className="text-xs text-muted-foreground">{campaignProgression.unit}</div>}
                        </>
                      )}
                      {campaignProgression.mode === "stages" && (
                        <div className="space-y-2">
                          <div className="text-sm text-accent-gold">{campaignProgression.label}</div>
                          <div className="text-lg">{campaignProgression.currentStage || t("eventDynamic.s15")}</div>
                          {campaignProgression.stages.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {campaignProgression.stages.findIndex((stage) => stage === campaignProgression.currentStage) + 1} / {campaignProgression.stages.length} vaihetta
                            </div>
                          )}
                        </div>
                      )}
                      {campaignProgression.mode === "freeform" && (
                        <div className="space-y-2">
                          <div className="text-sm text-accent-gold">{campaignProgression.label}</div>
                          <div className="text-lg whitespace-pre-wrap">{campaignProgression.currentStage || t("eventDynamic.s16")}</div>
                        </div>
                      )}
                      {campaignProgression.note && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaignProgression.note}</p>}
                      {isHost && <ArchiveCardButton onClick={() => setEditingProgression(true)}>{t("eventUi.s62")}</ArchiveCardButton>}
                    </div>
                  )}
                </ArchiveCardContent>
              </ArchiveCard>
            )}

            {/* Event Structure */}
            {event.event_type && event.event_type !== "game_night" && (
              <ArchiveCard>
                <ArchiveCardHeader>
                  <ArchiveCardTitle className="text-xl normal-case">
                    {event.event_type === "campaign" ? t("eventFix.campaignSessions") : t("eventFix.eventRounds")}
                  </ArchiveCardTitle>
                </ArchiveCardHeader>
                <ArchiveCardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {event.event_type === "campaign"
                      ? t("eventDynamic.s17")
                      : t("eventDynamic.s18")}
                  </p>

                  {event.event_type === "campaign" ? (
                    <>
                      {(() => {
                        const plannedSessions = Number((event.event_config as Record<string, unknown> | null)?.rounds || 0)
                        const currentSessions = structure.sessions.length
                        if (!plannedSessions || currentSessions >= plannedSessions) return null
                        return (
                          <div className="rounded-md border border-accent-gold/20 bg-background/20 p-3 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="text-sm text-accent-gold">Suunniteltu sessiomäärä: {plannedSessions}</div>
                                <div className="text-xs text-muted-foreground">Luotu {currentSessions} / {plannedSessions}. Suunnitelma ei ole yläraja.</div>
                              </div>
                              {isHost && (
                                <ArchiveCardButton onClick={createPlannedSessions} disabled={structureLoading}>
                                  {structureLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : currentSessions === 0 ? `Luo ${plannedSessions} sessiota` : t("eventDynamic.sessionsToFill", { count: plannedSessions })}
                                </ArchiveCardButton>
                              )}
                            </div>
                          </div>
                        )
                      })()}

                      {isHost && (
                        <div className="space-y-3 rounded-md border border-accent-gold/15 p-3">
                          <div className="text-sm text-accent-gold">{t("eventUi.s63")}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              value={sessionForm.title}
                              onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                              placeholder={t("eventUi.s90")}
                              className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="datetime-local"
                                value={sessionForm.startsAt}
                                onChange={(e) => setSessionForm({ ...sessionForm, startsAt: e.target.value })}
                                className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                              />
                              <input
                                type="datetime-local"
                                value={sessionForm.endsAt}
                                onChange={(e) => setSessionForm({ ...sessionForm, endsAt: e.target.value })}
                                className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                          <textarea
                            value={sessionForm.notes}
                            onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                            placeholder={t("eventUi.s91")}
                            rows={2}
                            className="w-full rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                          />
                          <ArchiveCardButton onClick={createCampaignSession} disabled={structureLoading || !sessionForm.title.trim()}>
                            {structureLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("eventDynamic.s19")}
                          </ArchiveCardButton>
                        </div>
                      )}

                      {structure.sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("eventUi.s64")}</p>
                      ) : (
                        <div className="space-y-3">
                          {structure.sessions.map((session: any, index: number) => {
                            const isEditing = editingSessionId === session.id
                            return (
                              <div key={session.id} className="rounded-md border border-accent-gold/15 p-3 space-y-3">
                                {isEditing ? (
                                  <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <input
                                        value={editingSessionForm.title}
                                        onChange={(e) => setEditingSessionForm({ ...editingSessionForm, title: e.target.value })}
                                        className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                                      />
                                      <select
                                        value={editingSessionForm.status}
                                        onChange={(e) => setEditingSessionForm({ ...editingSessionForm, status: e.target.value })}
                                        className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                                      >
                                        <option value="planned">{t("eventUi.s65")}</option>
                                        <option value="active">{t("eventUi.s66")}</option>
                                        <option value="completed">{t("eventUi.s67")}</option>
                                        <option value="cancelled">{t("eventUi.s68")}</option>
                                      </select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <input
                                        type="datetime-local"
                                        value={editingSessionForm.startsAt}
                                        onChange={(e) => setEditingSessionForm({ ...editingSessionForm, startsAt: e.target.value })}
                                        className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                                      />
                                      <input
                                        type="datetime-local"
                                        value={editingSessionForm.endsAt}
                                        onChange={(e) => setEditingSessionForm({ ...editingSessionForm, endsAt: e.target.value })}
                                        className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                                      />
                                    </div>
                                    <textarea
                                      value={editingSessionForm.notes}
                                      onChange={(e) => setEditingSessionForm({ ...editingSessionForm, notes: e.target.value })}
                                      rows={3}
                                      placeholder={t("eventUi.s92")}
                                      className="w-full rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                      <ArchiveCardButton onClick={saveSessionEdit} disabled={structureLoading || !editingSessionForm.title.trim()} active>
                                        {structureLoading ? <Loader2 className="w-4 h-4 animate-spin" />  : t("common.save")}
                                      </ArchiveCardButton>
                                      <ArchiveCardButton onClick={() => setEditingSessionId(null)} disabled={structureLoading}>
                                        Peruuta
                                      </ArchiveCardButton>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-3">
                                          <span className="font-cinzel text-accent-gold">{session.session_number ?? index + 1}</span>
                                          <span className="font-medium">{session.title?.match(/^Sessio (\d+)$/) ? t("eventFix.sessionNumber", { number: session.session_number ?? index + 1 }) : session.title || t("eventDynamic.s20")}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                          {session.starts_at
                                            ? `${new Date(session.starts_at).toLocaleDateString()} ${new Date(session.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                            : t("eventDynamic.s21")}
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="shrink-0 border-accent-gold/30 text-accent-gold">
                                        {session.status === "completed" ? "Valmis" : session.status === "active" ? t("eventDynamic.s22") : session.status === "cancelled" ? "Peruttu"  : t("eventUi.s65")}
                                      </Badge>
                                    </div>
                                    {session.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{session.notes}</p>}
                                    {isHost && (
                                      <div className="flex flex-wrap gap-2">
                                        <ArchiveCardButton onClick={() => startSessionEdit(session)}>
                                          Muokkaa sessiota
                                        </ArchiveCardButton>
                                        {session.status !== "completed" && session.status !== "cancelled" && (
                                          <ArchiveCardButton
                                            onClick={() => completeSession(session.id)}
                                            disabled={structureLoading}
                                            active
                                          >
                                            {structureLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("eventDynamic.s23")}
                                          </ArchiveCardButton>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {(() => {
                        const plannedRounds = Number((event.event_config as Record<string, unknown> | null)?.rounds || 0)
                        const currentRounds = structure.rounds.length
                        if (!plannedRounds || currentRounds >= plannedRounds) return null
                        return (
                          <div className="rounded-md border border-accent-gold/20 bg-background/20 p-3 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm text-accent-gold">Suunniteltu kierrosmäärä: {plannedRounds}</div>
                                <div className="text-xs text-muted-foreground">Luotu {currentRounds} / {plannedRounds}. Suunnitelma ei ole yläraja.</div>
                              </div>
                              {isHost && (
                                <ArchiveCardButton onClick={createPlannedRounds} disabled={structureLoading}>
                                  {structureLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : currentRounds === 0 ? `Luo ${plannedRounds} kierrosta` : t("eventDynamic.roundsToFill", { count: plannedRounds })}
                                </ArchiveCardButton>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                      {isHost && <div className="flex gap-2">
                        <input
                          value={structureTitle}
                          onChange={(e) => setStructureTitle(e.target.value)}
                          placeholder={t("eventUi.s93")}
                          className="flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                        />
                        <ArchiveCardButton onClick={addStructureItem} disabled={structureLoading || !structureTitle.trim()}>
                          {structureLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("eventDynamic.s24")}
                        </ArchiveCardButton>
                      </div>}
                      {(structure.rounds.length === 0) ? (
                        <p className="text-sm text-muted-foreground">{t("eventUi.s69")}</p>
                      ) : (
                        <div className="space-y-3">
                          {structure.rounds.map((item: any, index: number) => (
                            <div key={item.id} className="rounded-md border border-accent-gold/15 p-3 space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="font-cinzel text-accent-gold">{item.round_number ?? index + 1}</span>
                                <span>{item.title?.match(/^Kierros (\d+)$/) ? t("eventFix.roundNumber", { number: item.round_number ?? index + 1 }) : item.title || t("eventDynamic.s25")}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{t("eventFix.matchCount", { count: structure.matches.filter((m: any) => m.round_id === item.id).length })}</span>
                                <span>{item.status === "completed" ? t("eventUi.s67") : item.status === "active" ? t("eventDynamic.s22") : t("eventUi.s65")}</span>
                              </div>
                              <div data-round-id={item.id} className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {[0,1].map((slot) => (
                                    <select key={slot} className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm">
                                      <option value="">{t("eventFix.selectPlayer", { number: slot + 1 })}</option>
                                      {structure.entries.map((entry: any) => {
                                        const p = structure.profiles.find((profile: any) => profile.id === entry.user_id)
                                        return <option key={entry.id} value={entry.id}>{entry.display_name || p?.display_name || p?.username || t("eventUi.competitor")}</option>
                                      })}
                                    </select>
                                  ))}
                                </div>
                                {isHost && <ArchiveCardButton onClick={() => addMatch(item.id)}>{t("eventUi.s70")}</ArchiveCardButton>}
                                {structure.matches.filter((m: any) => m.round_id === item.id).map((m: any) => {
                                  const entryA = structure.entries.find((e: any) => e.id === m.entry_a_id)
                                  const entryB = structure.entries.find((e: any) => e.id === m.entry_b_id)
                                  const a = structure.profiles.find((p: any) => p.id === entryA?.user_id)
                                  const b = structure.profiles.find((p: any) => p.id === entryB?.user_id)
                                  const nameA = entryA?.display_name || a?.display_name || a?.username || t("eventUi.competitor")
                                  const nameB = entryB?.display_name || b?.display_name || b?.username || t("eventUi.competitor")
                                  return (
                                    <div key={m.id} className="rounded-md bg-background/40 border border-accent-gold/10 p-3 space-y-2">
                                      <div className="text-sm">{nameA} vs {nameB}</div>
                                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        <input aria-label={t("eventUi.s94")} type="number" placeholder={t("eventUi.s95")} defaultValue={m.score_a ?? ""} className="rounded border border-accent-gold/20 bg-background px-2 py-1 text-sm" id={`score-a-${m.id}`} />
                                        <input aria-label={t("eventUi.s96")} type="number" placeholder={t("eventUi.s97")} defaultValue={m.score_b ?? ""} className="rounded border border-accent-gold/20 bg-background px-2 py-1 text-sm" id={`score-b-${m.id}`} />
                                        <select defaultValue={m.winner_id || ""} className="rounded border border-accent-gold/20 bg-background px-2 py-1 text-sm" id={`winner-${m.id}`}>
                                          <option value="">{t("eventUi.s71")}</option><option value={m.player_a_id}>{nameA}</option><option value={m.player_b_id}>{nameB}</option>
                                        </select>
                                      </div>
                                      {isHost && <ArchiveCardButton onClick={() => saveMatchResult(m.id, (document.getElementById(`winner-${m.id}`) as HTMLSelectElement)?.value, (document.getElementById(`score-a-${m.id}`) as HTMLInputElement)?.value, (document.getElementById(`score-b-${m.id}`) as HTMLInputElement)?.value)}>{t("eventUi.s51")}</ArchiveCardButton>}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </ArchiveCardContent>
              </ArchiveCard>
            )}

            {event.event_type === "tournament" && (
              <ArchiveCard>
                <ArchiveCardHeader><ArchiveCardTitle className="text-xl normal-case">{t("eventUi.s72")}</ArchiveCardTitle></ArchiveCardHeader>
                <ArchiveCardContent>
                  <p className="text-sm text-muted-foreground mb-4">{t("eventUi.s73")}</p>
                  {standings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("eventUi.s74")}</p>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm"><thead><tr className="border-b border-accent-gold/20 text-muted-foreground">
                      <th className="text-left py-2 pr-3">{t("eventUi.s41")}</th><th className="text-right px-2">{t("eventUi.s75")}</th><th className="text-right px-2">V</th><th className="text-right px-2">T</th><th className="text-right px-2">H</th><th className="text-right pl-2">{t("eventUi.s76")}</th>
                    </tr></thead><tbody>{standings.map((row: any) => <tr key={row.entry_id} className="border-b border-accent-gold/10">
                      <td className="py-2 pr-3">{row.name}</td><td className="text-right px-2">{row.played}</td><td className="text-right px-2">{row.wins}</td><td className="text-right px-2">{row.draws}</td><td className="text-right px-2">{row.losses}</td><td className="text-right pl-2 font-medium text-accent-gold">{row.points}</td>
                    </tr>)}</tbody></table>
                  </div>
                  )}
                </ArchiveCardContent>
              </ArchiveCard>
            )}
            {/* Attendees */}
            <ArchiveCard>
              <ArchiveCardHeader>
                <ArchiveCardTitle className="normal-case">
                  {t("events.attendees") || "Attendees"} ({event.participants?.length || 0})
                </ArchiveCardTitle>
              </ArchiveCardHeader>
              <ArchiveCardContent>
                {event.participants && event.participants.length > 0 ? (
                  <div className="space-y-3">
                    {event.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center">
                            {participant.user?.avatar_url ? (
                              <img 
                                src={participant.user.avatar_url} 
                                alt={participant.user.display_name || ""} 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-accent-gold">
                                {(participant.user?.display_name || "?").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span>{participant.user?.display_name || participant.user?.username || t("profile.anonymous") || "Anonymous"}</span>
                          {participant.user_id === event.host_id && (
                            <Badge variant="outline" className="text-xs border-accent-gold/30 text-accent-gold">
                              {t("events.host") || "Host"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={participant.status === "attending" ? "default" : "secondary"}
                            className={participant.status === "attending" ? "bg-green-600" : participant.status === "invited" ? "bg-blue-600" : "bg-yellow-600"}
                          >
                            {participant.status === "attending" 
                              ? (t("events.attending") || "Attending") 
                              : participant.status === "invited" 
                                ? (t("events.invited") || "Invited")
                                : (t("events.maybe") || "Maybe")}
                          </Badge>
                          {isHost && participant.user_id !== event.host_id && (
                            <button
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              aria-label={t("events.inviteRemoved") || "Remove participant"}
                              onClick={() => handleUninvite(participant.id)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    {t("events.noAttendees") || "No attendees yet. Be the first to RSVP!"}
                  </p>
                )}

                {/* Invite Section - Host Only */}
                {isHost && (
                  <div className="mt-6 pt-4 border-t border-accent-gold/20">
                    {!showInviteSection ? (
                      <ArchiveCardButton
                        fullWidth
                        onClick={loadInvitableUsers}
                        icon={<UserPlus className="w-4 h-4" />}
                      >
                        {t("events.inviteFriends") || "Invite Friends"}
                      </ArchiveCardButton>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="font-medium text-accent-gold">
                          {t("events.inviteFriends") || "Invite Friends"}
                        </h4>
                        {invitableUsers.length > 0 ? (
                          <div className="space-y-2">
                            {invitableUsers.map((user) => (
                              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-black/30">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center">
                                    {user.avatar_url ? (
                                      <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <span className="text-sm font-medium text-accent-gold">
                                        {(user.display_name || "?").charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm">{user.display_name || "Anonymous"}</span>
                                </div>
                                <ArchiveIconButton
                                  active
                                  aria-label={t("events.inviteFriends") || "Invite"}
                                  onClick={() => handleInvite(user.id)}
                                  disabled={inviting === user.id}
                                  icon={inviting === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm text-center py-2">
                            {t("events.noFriendsToInvite") || "No friends available to invite. Add some friends first!"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </ArchiveCardContent>
            </ArchiveCard>
          </div>

          {/* Event Chat - only show for participants/host */}
          <div className="lg:col-span-1">
            {(isHost || userRsvp === "attending") ? (
              <EventChat eventId={eventId} eventTitle={event.title || ""} />
            ) : (
              <ArchiveCard>
                <ArchiveCardHeader>
                  <ArchiveCardTitle className="normal-case">
                    {t("events.eventChat") || "Event Chat"}
                  </ArchiveCardTitle>
                </ArchiveCardHeader>
                <ArchiveCardContent>
                  <p className="text-muted-foreground text-center py-8">
                    {t("events.chatForAttendees") || "RSVP to join the event chat"}
                  </p>
                </ArchiveCardContent>
              </ArchiveCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
