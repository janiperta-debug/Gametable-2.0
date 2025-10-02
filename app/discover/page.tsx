"use client"

import { Navigation } from "@/components/navigation"
import { DiscoverPlayers } from "@/components/discover-players"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Clock } from "lucide-react"

export default function CommunityPage() {
  const recentActivity = [
    {
      id: 1,
      user: "Sarah Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      action: "completed a campaign",
      game: "Gloomhaven",
      time: "2 hours ago",
    },
    {
      id: 2,
      user: "Mike Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      action: "added to collection",
      game: "Wingspan",
      time: "5 hours ago",
    },
    {
      id: 3,
      user: "Emma Thompson",
      avatar: "/placeholder.svg?height=40&width=40",
      action: "hosted a game night",
      game: "Root",
      time: "1 day ago",
    },
  ]

  return (
    <div className="min-h-screen room-environment">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Community</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Connect with fellow gamers and stay updated with your gaming circle
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="room-furniture">
            <CardHeader>
              <CardTitle className="text-2xl font-charm ornate-text flex items-center">
                <Clock className="h-6 w-6 mr-2 text-accent-gold" />
                Recent Friend Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4 p-4 rounded-lg picture-frame hover:bg-accent-gold/5 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activity.avatar || "/placeholder.svg"} alt={activity.user} />
                      <AvatarFallback className="font-cinzel">
                        {activity.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-merriweather text-sm">
                        <span className="font-semibold text-accent-gold">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>{" "}
                        <span className="font-semibold">{activity.game}</span>
                      </p>
                      <p className="text-xs text-muted-foreground font-merriweather">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <DiscoverPlayers />
        </div>
      </main>
    </div>
  )
}
