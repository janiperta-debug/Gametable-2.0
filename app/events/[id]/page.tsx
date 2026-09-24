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
import { useTranslations } from "@/lib/i18n"
import { getEventById, updateRSVP, cancelEvent, completeEvent, getInvitableUsers, inviteToEvent, uninviteFromEvent, type Event, type EventParticipant, type RSVPStatus } from "@/app/actions/events"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { addEventRound, addPlannedEventRounds, addEventSession, addEventMatch, addEventEntry, removeEventEntry, recordEventMatch, getEventStructure, getEventStandings } from "@/app/actions/event-structure"

const EVENT_TYPE_LABELS: Record<string, string> = {
  game_night: "Peli-ilta",
  campaign: "Kampanja",
  tournament: "Turnaus",
  league: "Liiga",
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

const formatEventDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return "Today"
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow"
  } else {
    return date.toLocaleDateString(undefined, { 
      weekday: "long", 
      month: "long", 
      day: "numeric" 
    })
  }
}

const formatEventTime = (startDate: string, endDate?: string | null) => {
  const start = new Date(startDate)
  const startTime = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  
  if (endDate) {
    const end = new Date(endDate)
    const endTime = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return `${startTime} - ${endTime}`
  }
  
  return startTime
}

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const { toast } = useToast()
  const eventId = params.id as string

  const [event, setEvent] = useState<(Event & { participants?: EventParticipant[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [updatingRsvp, setUpdatingRsvp] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [invitableUsers, setInvitableUsers] = useState<Array<{ id: string; display_name: string | null; avatar_url: string | null }>>([])
  const [inviting, setInviting] = useState<string | null>(null)
  const [showInviteSection, setShowInviteSection] = useState(false)
  const [standings, setStandings] = useState<any[]>([])
  const [structure, setStructure] = useState<{ sessions: any[]; rounds: any[]; matches: any[]; participants: any[]; entries: any[]; profiles: any[] }>({ sessions: [], rounds: [], matches: [], participants: [], entries: [], profiles: [] })
  const [structureTitle, setStructureTitle] = useState("")
  const [structureLoading, setStructureLoading] = useState(false)

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
    if (!confirm(t("events.confirmComplete") || "Are you sure you want to mark this event as completed? This will move it to past events.")) {
      return
    }

    setCompleting(true)
    const result = await completeEvent(eventId)

    if (result.error) {
      toast({
        title: t("common.error"),
        description: result.error,
        variant: "destructive",
      })
    } else {
      setEvent((current) => current ? { ...current, status: "completed" } : current)
      toast({
        title: t("common.success"),
        description: t("events.eventCompleted") || "Event completed",
      })
      router.push("/events")
    }

    setCompleting(false)
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
                disabled={completing || cancelling}
                icon={completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              >
                {t("events.completeEvent") || "Päätä tapahtuma"}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Competition Entries */}
            {(event.event_type === "tournament" || event.event_type === "league") && (
              <ArchiveCard>
                <ArchiveCardHeader>
                  <ArchiveCardTitle className="text-xl normal-case">Kilpailijat</ArchiveCardTitle>
                </ArchiveCardHeader>
                <ArchiveCardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    RSVP kertoo, ketkä ovat mukana tapahtumassa. Tässä valitaan erikseen ne osallistujat, jotka ovat mukana itse kilpailussa.
                  </p>
                  {isHost && (
                    <div className="flex gap-2">
                      <select id="competitor-select" className="flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm">
                        <option value="">Valitse kilpailija</option>
                        {structure.profiles
                          .filter((p: any) => structure.participants.some((participant: any) => participant.user_id === p.id && participant.status === "attending"))
                          .filter((p: any) => !structure.entries.some((e: any) => e.user_id === p.id && e.status === "active"))
                          .map((p: any) => <option key={p.id} value={p.id}>{p.display_name || p.username || "Pelaaja"}</option>)}
                      </select>
                      <ArchiveCardButton onClick={() => {
                        const select = document.getElementById("competitor-select") as HTMLSelectElement | null
                        if (select?.value) addCompetitor(select.value)
                      }}>
                        Lisää
                      </ArchiveCardButton>
                    </div>
                  )}
                  {structure.entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Kilpailijoita ei ole vielä valittu.</p>
                  ) : (
                    <div className="space-y-2">
                      {structure.entries.map((entry: any) => {
                        const profile = structure.profiles.find((p: any) => p.id === entry.user_id)
                        return (
                          <div key={entry.id} className="flex items-center justify-between rounded-md border border-accent-gold/10 p-3">
                            <span>{entry.display_name || profile?.display_name || profile?.username || "Kilpailija"}</span>
                            {isHost && (
                              <button
                                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                onClick={() => removeCompetitor(entry.id)}
                                aria-label="Poista kilpailija"
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

            {/* Event Structure */}
            {event.event_type && event.event_type !== "game_night" && (
              <ArchiveCard>
                <ArchiveCardHeader>
                  <ArchiveCardTitle className="text-xl normal-case">
                    {event.event_type === "campaign" ? "Kampanjan sessiot" : "Tapahtuman kierrokset"}
                  </ArchiveCardTitle>
                </ArchiveCardHeader>
                <ArchiveCardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Järjestäjä voi rakentaa tapahtuman etenemisen vaiheittain. GameTable ei määrää kierrosten tai sessioiden sisältöä.
                  </p>
                  {event.event_type !== "campaign" && (() => {
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
                              {structureLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : currentRounds === 0 ? `Luo ${plannedRounds} kierrosta` : `Täydennä ${plannedRounds} kierrokseen`}
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
                      placeholder={event.event_type === "campaign" ? "Esim. Sessio 1 – Kaupungin portit" : "Esim. Kierros 1"}
                      className="flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm"
                    />
                    <ArchiveCardButton onClick={addStructureItem} disabled={structureLoading || !structureTitle.trim()}>
                      {structureLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lisää"}
                    </ArchiveCardButton>
                  </div>}
                  {(event.event_type === "campaign" ? structure.sessions : structure.rounds).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Rakennetta ei ole vielä määritelty.</p>
                  ) : (
                    <div className="space-y-3">
                      {(event.event_type === "campaign" ? structure.sessions : structure.rounds).map((item: any, index: number) => (
                        <div key={item.id} className="rounded-md border border-accent-gold/15 p-3 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="font-cinzel text-accent-gold">{item.session_number ?? item.round_number ?? index + 1}</span>
                            <span>{item.title || "Nimetön vaihe"}</span>
                          </div>
                          {event.event_type !== "campaign" && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{structure.matches.filter((m: any) => m.round_id === item.id).length} ottelua</span>
                              <span>{item.status === "completed" ? "Valmis" : item.status === "active" ? "Käynnissä" : "Suunniteltu"}</span>
                            </div>
                          )}
                          {event.event_type !== "campaign" && (
                            <div data-round-id={item.id} className="space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {[0,1].map((slot) => (
                                  <select key={slot} className="rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm">
                                    <option value="">Valitse pelaaja {slot + 1}</option>
                                    {structure.entries.map((entry: any) => {
                                      const p = structure.profiles.find((profile: any) => profile.id === entry.user_id)
                                      return <option key={entry.id} value={entry.id}>{entry.display_name || p?.display_name || p?.username || "Kilpailija"}</option>
                                    })}
                                  </select>
                                ))}
                              </div>
                              {isHost && <ArchiveCardButton onClick={() => addMatch(item.id)}>Lisää ottelu</ArchiveCardButton>}
                              {structure.matches.filter((m: any) => m.round_id === item.id).map((m: any) => {
                                const entryA = structure.entries.find((e: any) => e.id === m.entry_a_id)
                                const entryB = structure.entries.find((e: any) => e.id === m.entry_b_id)
                                const a = structure.profiles.find((p: any) => p.id === entryA?.user_id)
                                const b = structure.profiles.find((p: any) => p.id === entryB?.user_id)
                                const nameA = entryA?.display_name || a?.display_name || a?.username || "Kilpailija"
                                const nameB = entryB?.display_name || b?.display_name || b?.username || "Kilpailija"
                                return (
                                  <div key={m.id} className="rounded-md bg-background/40 border border-accent-gold/10 p-3 space-y-2">
                                    <div className="text-sm">{nameA} vs {nameB}</div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                      <input aria-label="Pelaaja 1 tulos" type="number" placeholder="P1 tulos" defaultValue={m.score_a ?? ""} className="rounded border border-accent-gold/20 bg-background px-2 py-1 text-sm" id={`score-a-${m.id}`} />
                                      <input aria-label="Pelaaja 2 tulos" type="number" placeholder="P2 tulos" defaultValue={m.score_b ?? ""} className="rounded border border-accent-gold/20 bg-background px-2 py-1 text-sm" id={`score-b-${m.id}`} />
                                      <select defaultValue={m.winner_id || ""} className="rounded border border-accent-gold/20 bg-background px-2 py-1 text-sm" id={`winner-${m.id}`}>
                                        <option value="">Ei voittajaa</option><option value={m.player_a_id}>{nameA}</option><option value={m.player_b_id}>{nameB}</option>
                                      </select>
                                    </div>
                                    {isHost && <ArchiveCardButton onClick={() => saveMatchResult(m.id, (document.getElementById(`winner-${m.id}`) as HTMLSelectElement)?.value, (document.getElementById(`score-a-${m.id}`) as HTMLInputElement)?.value, (document.getElementById(`score-b-${m.id}`) as HTMLInputElement)?.value)}>Tallenna tulos</ArchiveCardButton>}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ArchiveCardContent>
              </ArchiveCard>
            )}

            {event.event_type !== "campaign" && event.event_type !== "game_night" && standings.length > 0 && (
              <ArchiveCard>
                <ArchiveCardHeader><ArchiveCardTitle className="text-xl normal-case">Sarjataulukko</ArchiveCardTitle></ArchiveCardHeader>
                <ArchiveCardContent>
                  <p className="text-sm text-muted-foreground mb-4">Pisteet ovat järjestäjän määrittelemiä. GameTable ei päätä pisteytyssääntöä.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm"><thead><tr className="border-b border-accent-gold/20 text-muted-foreground">
                      <th className="text-left py-2 pr-3">Pelaaja</th><th className="text-right px-2">Ott.</th><th className="text-right px-2">V</th><th className="text-right px-2">T</th><th className="text-right px-2">H</th><th className="text-right pl-2">Pisteet</th>
                    </tr></thead><tbody>{standings.map((row: any) => <tr key={row.user_id} className="border-b border-accent-gold/10">
                      <td className="py-2 pr-3">{row.name}</td><td className="text-right px-2">{row.played}</td><td className="text-right px-2">{row.wins}</td><td className="text-right px-2">{row.draws}</td><td className="text-right px-2">{row.losses}</td><td className="text-right pl-2 font-medium text-accent-gold">{row.points}</td>
                    </tr>)}</tbody></table>
                  </div>
                </ArchiveCardContent>
              </ArchiveCard>
            )}
            {/* Main Event Info */}
            <ArchiveCard>
              <ArchiveCardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <ArchiveCardTitle className="text-3xl mb-2 normal-case">
                      {event.title}
                    </ArchiveCardTitle>
                    <div className="flex items-center gap-4 text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        {getPrivacyIcon(event.privacy)}
                        <span className="text-sm">{getPrivacyLabel(event.privacy, t)}</span>
                      </div>
                      {event.status === "cancelled" && (
                        <Badge variant="destructive">
                          {t("events.cancelled") || "Cancelled"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {userRsvp && (
                      <Badge
                        variant={userRsvp === "attending" ? "default" : "secondary"}
                        className={userRsvp === "attending" ? "bg-green-600" : userRsvp === "maybe" ? "bg-yellow-600" : ""}
                      >
                        {userRsvp === "attending" ? (t("events.attending") || "Attending") : 
                         userRsvp === "maybe" ? (t("events.maybe") || "Maybe") : 
                         t("events.invited") || "Invited"}
                      </Badge>
                    )}
                    {event.event_type && (
                      <Badge variant="outline" className="border-accent-gold/30 text-accent-gold">
                        {EVENT_TYPE_LABELS[event.event_type] || event.event_type.replace(/_/g, " ")}
                      </Badge>
                    )}
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
                      <p className="font-medium">{formatEventDate(event.starts_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-accent-gold" />
                    <div>
                      <p className="font-medium">{formatEventTime(event.starts_at, event.ends_at)}</p>
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
