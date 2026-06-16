"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArchiveButton,
  ArchiveCard,
  ArchiveCardButton,
  ArchiveCardContent,
  ArchiveCardHeader,
  ArchiveCardTitle,
  ArchiveToggle,
  archiveField,
} from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeHero } from "@/components/theme-hero"
import { Calendar, MapPin, Users, Clock, Plus, Search, Filter, Loader2, Check, HelpCircle, X } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { useEvents } from "@/hooks/useEvents"
import { updateRSVP, type Event, type RSVPStatus } from "@/app/actions/events"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/useUser"

const statusColors: Record<string, string> = {
  attending: "bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  maybe: "bg-yellow-100 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  invited: "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  hosting: "bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  declined: "bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  not_attending: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
}

const eventTypeLabels: Record<string, string> = {
  board_game_night: "Board Games",
  rpg_session: "RPG",
  tournament: "Tournament",
  custom: "Custom",
}

const eventTypeColors: Record<string, string> = {
  board_game_night: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  rpg_session: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  tournament: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  custom: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
}

interface EventCardProps {
  event: Event
  onViewDetails: (event: Event) => void
  onRSVP: (eventId: string, status: RSVPStatus) => void
  t: (key: string) => string
  isLoggedIn: boolean
  currentUserId?: string
}

function EventCard({ event, onViewDetails, onRSVP, t, isLoggedIn, currentUserId }: EventCardProps) {
  const [rsvpLoading, setRsvpLoading] = useState<RSVPStatus | null>(null)
  
  const isHost = currentUserId === event.host_id
  const eventDate = new Date(event.starts_at)
  const dateStr = eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const hostName = event.host?.display_name || 'Unknown Host'
  const hostInitials = hostName.split(' ').map((n: string) => n[0]).join('').toUpperCase()

  const handleRSVP = async (status: RSVPStatus) => {
    setRsvpLoading(status)
    await onRSVP(event.id, status)
    setRsvpLoading(null)
  }

  return (
    <ArchiveCard className="transition-all">
      <ArchiveCardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <ArchiveCardTitle className="text-lg md:text-xl mb-2 break-words normal-case">{event.title}</ArchiveCardTitle>
            <div className="flex items-center flex-wrap gap-2 mb-3">
              {isHost && (
                <Badge className={statusColors.hosting}>{t("events.hosting")}</Badge>
              )}
              {event.user_rsvp && !isHost && (
                <Badge className={statusColors[event.user_rsvp] || statusColors.attending}>
                  {event.user_rsvp}
                </Badge>
              )}
              {event.event_type && (
                <Badge variant="outline" className={eventTypeColors[event.event_type] || eventTypeColors.custom}>
                  {eventTypeLabels[event.event_type] || event.event_type}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {event.description && (
          <p className="font-body text-sm text-muted-foreground break-words line-clamp-2">{event.description}</p>
        )}
      </ArchiveCardHeader>
      <ArchiveCardContent className="space-y-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-accent-gold flex-shrink-0" />
            <span className="font-body">{dateStr}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-accent-gold flex-shrink-0" />
            <span className="font-body">{timeStr}</span>
          </div>
          {event.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-accent-gold flex-shrink-0" />
              <span className="font-body break-words">{event.location}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-accent-gold flex-shrink-0" />
            <span className="font-body">
              {event.participant_count || 0}{event.max_players ? `/${event.max_players}` : ''} {t("events.attending")}
            </span>
          </div>
        </div>

        <div className="flex flex-col space-y-3 pt-4 border-t border-accent-gold/20">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={event.host?.avatar_url || "/placeholder.svg"} alt={hostName} />
              <AvatarFallback className="text-xs font-body">{hostInitials}</AvatarFallback>
            </Avatar>
            <span className="font-body text-sm text-muted-foreground truncate">{t("events.hostedBy")} {hostName}</span>
          </div>
          
          {/* RSVP Buttons */}
          {isLoggedIn && !isHost && (
            <div className="flex flex-wrap gap-2">
              <ArchiveCardButton
                active={event.user_rsvp === 'attending'}
                onClick={() => handleRSVP('attending')}
                disabled={rsvpLoading !== null}
                icon={rsvpLoading === 'attending' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              >
                {t("events.join")}
              </ArchiveCardButton>
              <ArchiveCardButton
                active={event.user_rsvp === 'maybe'}
                onClick={() => handleRSVP('maybe')}
                disabled={rsvpLoading !== null}
                icon={rsvpLoading === 'maybe' ? <Loader2 className="h-3 w-3 animate-spin" /> : <HelpCircle className="h-3 w-3" />}
              >
                {t("events.maybe")}
              </ArchiveCardButton>
              <ArchiveCardButton
                active={event.user_rsvp === 'declined'}
                onClick={() => handleRSVP('declined')}
                disabled={rsvpLoading !== null}
                icon={rsvpLoading === 'declined' ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              >
                {t("events.decline")}
              </ArchiveCardButton>
            </div>
          )}
          
          {/* View Details - always visible */}
          <ArchiveCardButton fullWidth onClick={() => onViewDetails(event)}>
            {isHost ? t("events.manage") : t("events.viewDetails") || "View Details"}
          </ArchiveCardButton>
        </div>
      </ArchiveCardContent>
    </ArchiveCard>
  )
}

const eventTypes = ["board_game_night", "rpg_session", "tournament", "custom"] as const

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const router = useRouter()
  const t = useTranslations()
  const { toast } = useToast()
  const { user } = useUser()
  const { publicEvents, myEvents, loading, refetch } = useEvents()

  const toggleEventType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSelectedTypes([])
  }

  function handleViewDetails(event: Event) {
    router.push("/events/" + event.id)
  }

  async function handleRSVP(eventId: string, status: RSVPStatus) {
    const result = await updateRSVP(eventId, status)
    if (result.error) {
      toast({
        title: t("common.error"),
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: t("common.success"),
        description: t("events.rsvpUpdated"),
      })
      refetch()
    }
  }

  // Filter events by search query and event type
  const query = searchQuery.toLowerCase()
  const filteredPublicEvents = publicEvents.filter(function(event) {
    const matchesSearch = event.title.toLowerCase().includes(query) || (event.description ? event.description.toLowerCase().includes(query) : false)
    const matchesType = selectedTypes.length === 0 || (event.event_type && selectedTypes.includes(event.event_type))
    return matchesSearch && matchesType
  })

  const filteredMyEvents = myEvents.filter(function(event) {
    const matchesSearch = event.title.toLowerCase().includes(query) || (event.description ? event.description.toLowerCase().includes(query) : false)
    const matchesType = selectedTypes.length === 0 || (event.event_type && selectedTypes.includes(event.event_type))
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <ThemeHero page="events" mode="backdrop">
          <div className="text-center">
            <h1 className="logo-text text-5xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{t("events.title")}</h1>
            <p className="font-body text-foreground/90 text-xl max-w-3xl mx-auto mt-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {t("events.subtitle")}
            </p>
          </div>
        </ThemeHero>

        {/* Action Bar */}
        <div className="flex flex-col gap-3 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder={t("events.searchEvents")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("pl-10 font-body w-full", archiveField)}
              />
            </div>
            <ArchiveButton
              active={showFilters}
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="h-4 w-4" />}
            >
              {showFilters ? t("common.hideFilters") : t("common.filters")}
              {selectedTypes.length > 0 && (
                <Badge className="ml-2 bg-accent-gold text-background">{selectedTypes.length}</Badge>
              )}
            </ArchiveButton>
          </div>
          <div className="flex justify-center">
            <ArchiveButton onClick={() => router.push("/events/create")} icon={<Plus className="h-4 w-4" />}>
              {t("events.createEvent")}
            </ArchiveButton>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <ArchiveCard>
              <ArchiveCardContent className="pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-lg text-accent-gold">{t("events.eventType")}</h3>
                  {selectedTypes.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm font-body text-muted-foreground hover:text-accent-gold transition-colors"
                    >
                      {t("common.clearFilters")}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.map((type) => (
                    <ArchiveCardButton
                      key={type}
                      active={selectedTypes.includes(type)}
                      onClick={() => toggleEventType(type)}
                    >
                      {t(`events.types.${type}`)}
                    </ArchiveCardButton>
                  ))}
                </div>
              </ArchiveCardContent>
            </ArchiveCard>
          )}
        </div>

        {/* Tabs */}
        <div className="w-full">
          <div className="mb-6 md:mb-8 flex justify-center">
            <ArchiveToggle
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: "upcoming", label: t("events.upcomingEvents") },
                { value: "my-events", label: t("events.myEvents") },
                { value: "past", label: t("events.pastEvents") },
              ]}
            />
          </div>

          {activeTab === "upcoming" && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
                </div>
              ) : filteredPublicEvents.length === 0 ? (
                <ArchiveCard className="text-center">
                  <ArchiveCardContent className="py-12">
                    <Calendar className="h-16 w-16 text-accent-gold mx-auto mb-4" />
                    <h3 className="ornate-text font-heading text-xl font-semibold mb-2">{t("events.noEvents")}</h3>
                    <p className="font-body text-muted-foreground">{t("events.noEventsDesc")}</p>
                  </ArchiveCardContent>
                </ArchiveCard>
              ) : (
                <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPublicEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onViewDetails={handleViewDetails} 
                      onRSVP={handleRSVP}
                      t={t}
                      isLoggedIn={!!user}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "my-events" && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
                </div>
              ) : !user ? (
                <ArchiveCard className="text-center">
                  <ArchiveCardContent className="py-12">
                    <Calendar className="h-16 w-16 text-accent-gold mx-auto mb-4" />
                    <h3 className="ornate-text font-heading text-xl font-semibold mb-2">{t("events.loginRequired")}</h3>
                    <p className="font-body text-muted-foreground">{t("events.loginToSeeMyEvents")}</p>
                  </ArchiveCardContent>
                </ArchiveCard>
              ) : filteredMyEvents.length === 0 ? (
                <ArchiveCard className="text-center">
                  <ArchiveCardContent className="py-12">
                    <Calendar className="h-16 w-16 text-accent-gold mx-auto mb-4" />
                    <h3 className="ornate-text font-heading text-xl font-semibold mb-2">{t("events.noMyEvents")}</h3>
                    <p className="font-body text-muted-foreground">{t("events.noMyEventsDesc")}</p>
                  </ArchiveCardContent>
                </ArchiveCard>
              ) : (
                <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMyEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onViewDetails={handleViewDetails}
                      onRSVP={handleRSVP}
                      t={t}
                      isLoggedIn={!!user}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "past" && (
            <ArchiveCard className="text-center">
              <ArchiveCardContent className="py-12">
                <Calendar className="h-16 w-16 text-accent-gold mx-auto mb-4" />
                <h3 className="ornate-text font-heading text-xl font-semibold mb-2">No Past Events</h3>
                <p className="font-body text-muted-foreground">
                  Your event history will appear here once you start attending gaming events.
                </p>
              </ArchiveCardContent>
            </ArchiveCard>
          )}
        </div>
      </main>
    </div>
  )
}
