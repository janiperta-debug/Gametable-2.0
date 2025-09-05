"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EventChat } from "@/components/event-chat"
import { ArrowLeft, Calendar, Clock, MapPin, Users, Globe, UserCheck, Lock } from "lucide-react"

// Mock event data - in real app this would come from API/database
const mockEvents = {
  1: {
    id: 1,
    title: "Strategy Game Night",
    game: "Wingspan",
    date: "Tonight",
    time: "7:00 PM - 11:00 PM",
    location: "The Gaming Lounge",
    address: "123 Board Game Ave, Seattle, WA",
    maxPlayers: 8,
    currentPlayers: 12,
    attendees: [
      { name: "Mike Johnson", status: "attending", avatar: "/placeholder.svg" },
      { name: "Sarah Chen", status: "attending", avatar: "/placeholder.svg" },
      { name: "Alex Rivera", status: "maybe", avatar: "/placeholder.svg" },
    ],
    description: "Join us for an evening of strategic board games including Wingspan, Azul, and more!",
    privacy: "public",
    host: "Mike Johnson",
    tags: ["attending", "Board Games"],
  },
  2: {
    id: 2,
    title: "D&D: The Lost Mines Campaign",
    game: "Dungeons & Dragons 5e",
    date: "Tomorrow",
    time: "2:00 PM - 6:00 PM",
    location: "Mike's House",
    address: "Private Location",
    maxPlayers: 6,
    currentPlayers: 5,
    attendees: [
      { name: "Sarah Chen", status: "attending", avatar: "/placeholder.svg" },
      { name: "Mike Rodriguez", status: "attending", avatar: "/placeholder.svg" },
      { name: "Emma Thompson", status: "maybe", avatar: "/placeholder.svg" },
    ],
    description: "Continue our epic D&D 5e campaign as we explore the mysterious Lost Mines of Phandelver.",
    privacy: "friends",
    host: "Sarah Chen",
    tags: ["maybe", "RPG"],
  },
}

const getPrivacyIcon = (privacy: string) => {
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

const getPrivacyLabel = (privacy: string) => {
  switch (privacy) {
    case "public":
      return "Public Event"
    case "friends":
      return "Friends Only"
    case "private":
      return "Private (Invite Only)"
    default:
      return "Public Event"
  }
}

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const event = mockEvents[eventId as keyof typeof mockEvents]

  const [userStatus, setUserStatus] = useState<"attending" | "maybe" | "not-attending">("not-attending")

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-dark to-background flex items-center justify-center">
        <Card className="room-furniture max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-charm text-accent-gold mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/events")} className="theme-accent-gold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-dark to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/events")}
            className="text-accent-gold hover:text-accent-gold/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Event Info */}
            <Card className="room-furniture">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl font-charm text-accent-gold mb-2">{event.title}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                      {getPrivacyIcon(event.privacy)}
                      <span className="text-sm">{getPrivacyLabel(event.privacy)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant={tag === "attending" ? "default" : tag === "maybe" ? "secondary" : "outline"}
                        className={tag === "attending" ? "bg-green-600" : tag === "maybe" ? "bg-yellow-600" : ""}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Game */}
                <div>
                  <h3 className="font-cinzel text-accent-gold mb-2">Game</h3>
                  <p className="text-lg">{event.game}</p>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-accent-gold" />
                    <div>
                      <p className="font-medium">{event.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-accent-gold" />
                    <div>
                      <p className="font-medium">{event.time}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent-gold mt-1" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                    <p className="text-muted-foreground text-sm">{event.address}</p>
                  </div>
                </div>

                {/* Players */}
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-accent-gold" />
                  <div>
                    <p className="font-medium">
                      {event.currentPlayers}/{event.maxPlayers} attending
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-cinzel text-accent-gold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                </div>

                {/* RSVP Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={() => setUserStatus("attending")}
                    className={userStatus === "attending" ? "theme-accent-gold" : ""}
                    variant={userStatus === "attending" ? "default" : "outline"}
                  >
                    Attending
                  </Button>
                  <Button
                    onClick={() => setUserStatus("maybe")}
                    className={userStatus === "maybe" ? "theme-accent-gold" : ""}
                    variant={userStatus === "maybe" ? "default" : "outline"}
                  >
                    Maybe
                  </Button>
                  <Button
                    onClick={() => setUserStatus("not-attending")}
                    variant="ghost"
                    className="text-muted-foreground"
                  >
                    Can't Attend
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Attendees */}
            <Card className="room-furniture">
              <CardHeader>
                <CardTitle className="font-cinzel text-accent-gold">Attendees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.attendees.map((attendee, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-accent-gold">{attendee.name.charAt(0)}</span>
                        </div>
                        <span>{attendee.name}</span>
                      </div>
                      <Badge
                        variant={attendee.status === "attending" ? "default" : "secondary"}
                        className={attendee.status === "attending" ? "bg-green-600" : "bg-yellow-600"}
                      >
                        {attendee.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Chat */}
          <div className="lg:col-span-1">
            <EventChat eventId={eventId} eventTitle={event.title} />
          </div>
        </div>
      </div>
    </div>
  )
}
