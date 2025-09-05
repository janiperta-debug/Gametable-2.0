import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, Trophy, Users, Star, ExternalLink } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "game_added",
    title: "Added Everdell to collection",
    description: "Rated 9/10 - 'Beautiful artwork and engaging gameplay'",
    time: "2 hours ago",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    action: "View Game",
  },
  {
    id: 2,
    type: "event_created",
    title: "Created 'Strategy Game Night'",
    description: "Friday 7:00 PM at The Gaming Lounge - 8 spots available",
    time: "5 hours ago",
    icon: Calendar,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    action: "View Event",
  },
  {
    id: 3,
    type: "trophy_earned",
    title: "Earned 'Collection Curator' trophy",
    description: "Reached 250 games in your collection",
    time: "1 day ago",
    icon: Trophy,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    action: "View Trophy",
  },
  {
    id: 4,
    type: "friend_added",
    title: "Connected with Sarah Chen",
    description: "You now have 38 gaming friends",
    time: "2 days ago",
    icon: Users,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    action: "View Profile",
  },
  {
    id: 5,
    type: "game_played",
    title: "Played Wingspan",
    description: "Won with 87 points - Personal best!",
    time: "3 days ago",
    icon: Star,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    action: "Log Details",
  },
]

export function RecentActivity() {
  return (
    <Card className="room-furniture">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="ornate-text font-heading text-2xl font-bold">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm">
          <span className="font-body">View All</span>
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4 p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
            >
              <div className={`p-2 rounded-full ${activity.color} flex-shrink-0`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm font-body">{activity.title}</p>
                    <p className="text-sm text-muted-foreground font-body">{activity.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <span className="font-body">{activity.action}</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-body">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
