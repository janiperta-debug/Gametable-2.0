import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, ExternalLink } from "lucide-react"

const events = [
  {
    id: 1,
    title: "Strategy Game Night",
    date: "Tonight",
    time: "7:00 PM",
    location: "The Gaming Lounge",
    attendees: 8,
    maxAttendees: 12,
    status: "hosting",
    type: "Board Games",
  },
  {
    id: 2,
    title: "D&D: Lost Mines Campaign",
    date: "Tomorrow",
    time: "2:00 PM",
    location: "Mike's House",
    attendees: 5,
    maxAttendees: 6,
    status: "attending",
    type: "RPG",
  },
  {
    id: 3,
    title: "Magic Draft Tournament",
    date: "Friday",
    time: "6:30 PM",
    location: "Local Game Store",
    attendees: 12,
    maxAttendees: 16,
    status: "maybe",
    type: "Card Game",
  },
]

export function UpcomingEvents() {
  return (
    <Card className="room-furniture">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="ornate-text font-heading text-xl font-bold">Upcoming Events</CardTitle>
        <Button variant="ghost" size="sm">
          <span className="font-body">View All</span>
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="p-4 rounded-lg border bg-card/50 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm font-body">{event.title}</h4>
                  <Badge
                    variant={
                      event.status === "hosting" ? "default" : event.status === "attending" ? "secondary" : "outline"
                    }
                    className="text-xs mt-1 font-body"
                  >
                    {event.status}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs font-body">
                  {event.type}
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span className="font-body">{event.date}</span>
                  <Clock className="h-3 w-3 ml-2" />
                  <span className="font-body">{event.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span className="font-body">{event.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3" />
                  <span className="font-body">
                    {event.attendees}/{event.maxAttendees} attending
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
