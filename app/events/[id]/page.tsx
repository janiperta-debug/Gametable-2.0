"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
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
  Edit, Loader2, User, XCircle, UserPlus, X
} from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { getEventById, updateRSVP, cancelEvent, getInvitableUsers, inviteToEvent, uninviteFromEvent, type Event, type EventParticipant, type RSVPStatus } from "@/app/actions/events"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

const EVENT_TYPE_LABELS: Record<string, string> = {
  board_game_night: "Lautapeli-ilta",
  rpg_session: "Roolipeli",
  tournament: "Turnaus",
  trading: "Vaihtokauppa",
  meetup: "Tapaaminen",
  other: "Muu",
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
  const [invitableUsers, setInvitableUsers] = useState<Array<{ id: string; display_name: string | null; avatar_url: string | null }>>([])
  const [inviting, setInviting] = useState<string | null>(null)
  const [showInviteSection, setShowInviteSection] = useState(false)

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
      
      setLoading(false)
    }

    loadEvent()
  }, [eventId])

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
              <span className="hidden sm:inline">{t("events.backToEvents") || "Back to Events"}</span>
            </ArchiveCardButton>
          </div>

          {isHost && (
            <>
              <ArchiveCardButton asChild icon={<Edit className="w-4 h-4" />}>
                <Link href={`/events/${eventId}/edit`}>
                  <span className="hidden sm:inline">{t("common.edit") || "Edit"}</span>
                </Link>
              </ArchiveCardButton>
              <ArchiveCardButton
                onClick={handleCancel}
                disabled={cancelling}
                icon={cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">{t("events.cancel") || "Cancel"}</span>
              </ArchiveCardButton>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
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
                          <span>{participant.user?.display_name || t("profile.anonymous") || "Anonymous"}</span>
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
