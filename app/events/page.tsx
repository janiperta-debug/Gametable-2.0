"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Clock, Plus, Search, Filter, Star, Gamepad2, Loader2, Check, HelpCircle, X } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { useEvents } from "@/hooks/useEvents"
import { updateRSVP, type Event, type RSVPStatus } from "@/app/actions/events"
import { CreateEventModal } from "@/components/create-event-modal"
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
    <Card className="room-furniture hover:shadow-lg transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="font-heading text-lg md:text-xl mb-2 break-words">{event.title}</CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-4">
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
              <Button 
                size="sm" 
                className={event.user_rsvp === 'attending' ? 'theme-accent-gold' : 'bg-transparent'}
                variant={event.user_rsvp === 'attending' ? 'default' : 'outline'}
                onClick={() => handleRSVP('attending')}
                disabled={rsvpLoading !== null}
              >
                {rsvpLoading === 'attending' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                {t("events.join")}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className={event.user_rsvp === 'maybe' ? 'border-yellow-500 text-yellow-600' : 'bg-transparent'}
                onClick={() => handleRSVP('maybe')}
                disabled={rsvpLoading !== null}
              >
                {rsvpLoading === 'maybe' ? <Loader2 className="h-3 w-3 animate-spin" /> : <HelpCircle className="h-3 w-3 mr-1" />}
                {t("events.maybe")}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className={event.user_rsvp === 'declined' ? 'border-red-500 text-red-600' : 'bg-transparent'}
                onClick={() => handleRSVP('declined')}
                disabled={rsvpLoading !== null}
              >
                {rsvpLoading === 'declined' ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
                {t("events.decline")}
              </Button>
            </div>
          )}
          
          {isHost && (
            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => onViewDetails(event)}>
              {t("events.manage")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [searchQuery, setSearchQuery] = useState("")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations()
  const { toast } = useToast()
  const { user } = useUser()
  const { publicEvents, myEvents, loading, refetch } = useEvents()

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

  // Filter events by search query
  const query = searchQuery.toLowerCase()
  const filteredPublicEvents = publicEvents.filter(function(event) {
    return event.title.toLowerCase().includes(query) || (event.description ? event.description.toLowerCase().includes(query) : false)
  })

  const filteredMyEvents = myEvents.filter(function(event) {
    return event.title.toLowerCase().includes(query) || (event.description ? event.description.toLowerCase().includes(query) : false)
  })

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-accent-gold mr-2 md:mr-3" />
            <h1 className="logo-text text-3xl md:text-5xl font-bold">{t("events.title")}</h1>
          </div>
          <p className="font-body text-muted-foreground text-base md:text-xl max-w-3xl mx-auto px-4">
            {t("events.subtitle")}
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col gap-3 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("events.searchEvents")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-body w-full"
              />
            </div>
            <Button variant="outline" className="bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              <span className="font-body">{t("common.filters")}</span>
            </Button>
          </div>
          <Button size="lg" className="theme-accent-gold w-full" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="font-body">{t("events.createEvent")}</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8 max-w-2xl mx-auto">
            <TabsTrigger value="upcoming" className="font-body text-xs sm:text-sm">
              {t("events.upcomingEvents")}
            </TabsTrigger>
            <TabsTrigger value="my-events" className="font-body text-xs sm:text-sm">
              {t("events.myEvents")}
            </TabsTrigger>
            <TabsTrigger value="past" className="font-body text-xs sm:text-sm">
              {t("events.pastEvents")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
              </div>
            ) : filteredPublicEvents.length === 0 ? (
              <Card className="room-furniture text-center py-12">
                <CardContent>
                  <Calendar className="h-16 w-16 text-accent-gold mx-auto mb-4" />
                  <h3 className="ornate-text font-heading text-xl font-semibold mb-2">{t("events.noEvents")}</h3>
                  <p className="font-body text-muted-foreground">{t("events.noEventsDesc")}</p>
                </CardContent>
              </Card>
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
          </TabsContent>

          <TabsContent value="my-events">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
              </div>
            ) : !user ? (
              <Card className="room-furniture text-center py-12">
                <CardContent>
                  <Calendar className="h-16 w-16 text-accent-gold mx-auto mb-4" />
                  <h3 className="ornate-text font-heading text-xl font-semibold mb-2">{t("events.loginRequired")}</h3>
                  <p className="font-body text-muted-foreground">{t("events.loginToSeeMyEvents")}</p>
                </CardContent>
              </Card>
            ) : filteredMyEvents.length === 0 ? (
              <Card className="room-furniture text-center py-12">
                <CardContent>
                  <Calendar className="h-16 w-16 text-accent-gold mx-auto mb-4" />
                  <h3 className="ornate-text font-heading text-xl font-semibold mb-2">{t("events.noMyEvents")}</h3>
                  <p className="font-body text-muted-foreground">{t("events.noMyEventsDesc")}</p>
                </CardContent>
              </Card>
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
          </TabsContent>

          <TabsContent value="past">
            <Card className="room-furniture text-center py-12">
              <CardContent>
                <Calendar className="h-16 w-16 text-accent-gold mx-auto mb-4" />
                <h3 className="ornate-text font-heading text-xl font-semibold mb-2">No Past Events</h3>
                <p className="font-body text-muted-foreground">
                  Your event history will appear here once you start attending gaming events.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-12 md:mt-16">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">{t("events.quickActions")}</h2>
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            <Card className="room-furniture hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
                  <Gamepad2 className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{t("events.boardGameNight")}</h3>
                <p className="font-body text-sm text-muted-foreground">{t("events.boardGameNightDesc")}</p>
              </CardContent>
            </Card>

            <Card className="room-furniture hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{t("events.rpgSession")}</h3>
                <p className="font-body text-sm text-muted-foreground">{t("events.rpgSessionDesc")}</p>
              </CardContent>
            </Card>

            <Card className="room-furniture hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-4">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{t("events.tournament")}</h3>
                <p className="font-body text-sm text-muted-foreground">{t("events.tournamentDesc")}</p>
              </CardContent>
            </Card>

            <Card className="room-furniture hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 mb-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{t("events.customEvent")}</h3>
                <p className="font-body text-sm text-muted-foreground">{t("events.customEventDesc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Management Hub */}
        <div className="mt-12 md:mt-16">
          <Card className="room-furniture max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-3xl font-bold">{t("events.managementHub")}</CardTitle>
              <p className="font-body text-muted-foreground">
                {t("events.managementHubDesc")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3 text-center">
                <div>
                  <div className="text-3xl font-bold text-accent-gold font-heading mb-2">24</div>
                  <div className="font-body text-sm text-muted-foreground">{t("events.eventsThisMonth")}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent-gold font-heading mb-2">156</div>
                  <div className="font-body text-sm text-muted-foreground">{t("events.totalAttendees")}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent-gold font-heading mb-2">8</div>
                  <div className="font-body text-sm text-muted-foreground">{t("events.eventsHosted")}</div>
                </div>
              </div>
              <div className="text-center mt-8">
                <Button size="lg" className="theme-accent-gold">
                  <span className="font-body">{t("events.exploreEventTools")}</span>
</Button>
            </CardContent>
          </Card>
        </div>

        {/* Create Event Modal */}
        <CreateEventModal 
          open={createModalOpen} 
          onOpenChange={setCreateModalOpen}
          onEventCreated={refetch}
        />
      </main>
    </div>
  )
}
