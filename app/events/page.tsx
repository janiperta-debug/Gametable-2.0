"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Clock, Plus, Search, Filter, Star, Gamepad2 } from "lucide-react"

const upcomingEvents = [
  {
    id: 1,
    title: "Strategy Game Night",
    date: "Tonight",
    time: "7:00 PM - 11:00 PM",
    location: "The Gaming Lounge",
    address: "123 Board Game Ave, Seattle, WA",
    attendees: 8,
    maxAttendees: 12,
    host: "Mike Johnson",
    hostAvatar: "/placeholder.svg?height=32&width=32",
    category: "Board Games",
    description: "Join us for an evening of strategic board games including Wingspan, Azul, and more!",
    status: "attending",
    featured: true,
  },
  {
    id: 2,
    title: "D&D: The Lost Mines Campaign",
    date: "Tomorrow",
    time: "2:00 PM - 6:00 PM",
    location: "Mike's House",
    address: "Private Location",
    attendees: 5,
    maxAttendees: 6,
    host: "Sarah Chen",
    hostAvatar: "/placeholder.svg?height=32&width=32",
    category: "RPG",
    description: "Continue our epic D&D 5e campaign as we explore the mysterious Lost Mines of Phandelver.",
    status: "maybe",
    featured: false,
  },
  {
    id: 3,
    title: "Magic: The Gathering Draft",
    date: "Friday, Dec 15",
    time: "6:30 PM - 10:00 PM",
    location: "Local Game Store",
    address: "456 Card Game St, Seattle, WA",
    attendees: 12,
    maxAttendees: 16,
    host: "Alex Rivera",
    hostAvatar: "/placeholder.svg?height=32&width=32",
    category: "Card Game",
    description: "Weekly MTG draft tournament with prizes for top performers. All skill levels welcome!",
    status: "invited",
    featured: false,
  },
  {
    id: 4,
    title: "Warhammer 40K Tournament",
    date: "Saturday, Dec 16",
    time: "10:00 AM - 6:00 PM",
    location: "Gaming Convention Center",
    address: "789 Miniature Way, Seattle, WA",
    attendees: 24,
    maxAttendees: 32,
    host: "Emma Thompson",
    hostAvatar: "/placeholder.svg?height=32&width=32",
    category: "Miniatures",
    description: "Competitive 40K tournament with multiple rounds. Bring your best army!",
    status: "not_attending",
    featured: true,
  },
]

const myEvents = [
  {
    id: 5,
    title: "Cooperative Game Night",
    date: "Sunday, Dec 17",
    time: "3:00 PM - 8:00 PM",
    location: "My Place",
    address: "Private Location",
    attendees: 6,
    maxAttendees: 8,
    host: "You",
    hostAvatar: "/placeholder.svg?height=32&width=32",
    category: "Board Games",
    description: "Let's tackle some challenging cooperative games like Pandemic Legacy and Spirit Island.",
    status: "hosting",
    featured: false,
  },
]

const statusColors = {
  attending: "bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  maybe: "bg-yellow-100 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  invited: "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  hosting: "bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  not_attending: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
}

const categoryColors = {
  "Board Games": "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  RPG: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "Card Game": "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  Miniatures: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
}

function EventCard({ event, onViewDetails }: { event: any; onViewDetails: (event: any) => void }) {
  return (
    <Card className={`room-furniture hover:shadow-lg transition-all ${event.featured ? "border-accent-gold/60" : ""}`}>
      {event.featured && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-accent-gold text-accent-gold-foreground rounded-full p-2">
            <Star className="h-4 w-4" />
          </div>
        </div>
      )}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="font-heading text-xl mb-2">{event.title}</CardTitle>
            <div className="flex items-center space-x-2 mb-3">
              <Badge className={statusColors[event.status as keyof typeof statusColors]}>{event.status}</Badge>
              <Badge variant="outline" className={categoryColors[event.category as keyof typeof categoryColors]}>
                {event.category}
              </Badge>
            </div>
          </div>
        </div>
        <p className="font-body text-sm text-muted-foreground">{event.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-accent-gold" />
            <span className="font-body">{event.date}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-accent-gold" />
            <span className="font-body">{event.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-accent-gold" />
            <div>
              <div className="font-body">{event.location}</div>
              <div className="font-body text-xs text-muted-foreground">{event.address}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-accent-gold" />
            <span className="font-body">
              {event.attendees}/{event.maxAttendees} attending
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-accent-gold/20">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={event.hostAvatar || "/placeholder.svg"} alt={event.host} />
              <AvatarFallback className="text-xs font-body">
                {event.host
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="font-body text-sm text-muted-foreground">Hosted by {event.host}</span>
          </div>
          <div className="flex space-x-2">
            {event.status === "invited" && (
              <>
                <Button size="sm" className="theme-accent-gold">
                  Join
                </Button>
                <Button size="sm" variant="outline" className="bg-transparent">
                  Maybe
                </Button>
              </>
            )}
            {event.status === "maybe" && (
              <Button size="sm" className="theme-accent-gold">
                Confirm
              </Button>
            )}
            {event.status === "hosting" && (
              <Button size="sm" variant="outline" className="bg-transparent">
                Manage
              </Button>
            )}
            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => onViewDetails(event)}>
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleViewDetails = (event: any) => {
    router.push(`/events/${event.id}`)
  }

  const handleCreateEvent = () => {
    router.push("/events/create")
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Events</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Discover, join, and host amazing gaming events in your community
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-body"
              />
            </div>
            <Button variant="outline" className="bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              <span className="font-body">Filters</span>
            </Button>
          </div>
          <Button size="lg" className="theme-accent-gold w-full sm:w-auto" onClick={handleCreateEvent}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="font-body">Create Event</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-surface-light/50">
            <TabsTrigger value="upcoming" className="font-body data-[state=active]:theme-accent-gold">
              Upcoming Events
            </TabsTrigger>
            <TabsTrigger value="my-events" className="font-body data-[state=active]:theme-accent-gold">
              My Events
            </TabsTrigger>
            <TabsTrigger value="past" className="font-body data-[state=active]:theme-accent-gold">
              Past Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} onViewDetails={handleViewDetails} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-events">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myEvents.map((event) => (
                <EventCard key={event.id} event={event} onViewDetails={handleViewDetails} />
              ))}
            </div>
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
        <div className="mt-16">
          <h2 className="ornate-text font-heading text-3xl font-bold text-center mb-8">Quick Actions</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            <Card className="room-furniture hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
                  <Gamepad2 className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold mb-2">Board Game Night</h3>
                <p className="font-body text-sm text-muted-foreground">Host a casual board game evening</p>
              </CardContent>
            </Card>

            <Card className="room-furniture hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold mb-2">RPG Session</h3>
                <p className="font-body text-sm text-muted-foreground">Start a new campaign or one-shot</p>
              </CardContent>
            </Card>

            <Card className="room-furniture hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-4">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold mb-2">Tournament</h3>
                <p className="font-body text-sm text-muted-foreground">Organize a competitive event</p>
              </CardContent>
            </Card>

            <Card className="room-furniture hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 mb-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-semibold mb-2">Custom Event</h3>
                <p className="font-body text-sm text-muted-foreground">Create your own unique gathering</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Management Hub */}
        <div className="mt-16">
          <Card className="room-furniture max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="ornate-text font-heading text-3xl font-bold">Event Management Hub</CardTitle>
              <p className="font-body text-muted-foreground">
                Comprehensive tools for organizing and managing your gaming events
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3 text-center">
                <div>
                  <div className="text-3xl font-bold text-accent-gold font-heading mb-2">24</div>
                  <div className="font-body text-sm text-muted-foreground">Events This Month</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent-gold font-heading mb-2">156</div>
                  <div className="font-body text-sm text-muted-foreground">Total Attendees</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent-gold font-heading mb-2">8</div>
                  <div className="font-body text-sm text-muted-foreground">Events Hosted</div>
                </div>
              </div>
              <div className="text-center mt-8">
                <Button size="lg" className="theme-accent-gold">
                  <span className="font-body">Explore Event Tools</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
