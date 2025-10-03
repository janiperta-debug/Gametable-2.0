"use client"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, MapPin, BookOpen, Users, Calendar, Trophy, ArrowLeft } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params

  // TODO: Fetch user data from Firebase using userId
  // For now, using mock data
  const userData = {
    name: "Karimatti Hautala",
    location: "Espoo",
    bio: "Into all kind of board games and very interested in Warhammer 40 000",
    profilePicture: "/placeholder.svg?height=120&width=120",
    level: 9,
    totalXP: 800,
    xpToNextLevel: 100,
    currentXP: 45,
    gameInterests: ["Board & Card Games", "Warhammer", "Other Miniature Games", "RPGs"],
    progress: {
      gamesOwned: { current: 482, goal: 500, recentChange: "+12 this month" },
      gamingFriends: { current: 38, goal: 50, recentChange: "+3 new friends" },
      eventsHosted: { current: 15, goal: 25, recentChange: "+5 this month" },
      trophiesEarned: { current: 23, goal: 50, recentChange: "+2 this week" },
    },
    privacy: {
      showEventActivity: true,
      showFriendList: true,
      showGameCollection: true,
    },
  }

  const progressItems = [
    {
      icon: BookOpen,
      label: "Games Owned",
      current: userData.progress.gamesOwned.current,
      goal: userData.progress.gamesOwned.goal,
      change: userData.progress.gamesOwned.recentChange,
      visible: userData.privacy.showGameCollection,
      color: "text-blue-400",
    },
    {
      icon: Users,
      label: "Gaming Friends",
      current: userData.progress.gamingFriends.current,
      goal: userData.progress.gamingFriends.goal,
      change: userData.progress.gamingFriends.recentChange,
      visible: userData.privacy.showFriendList,
      color: "text-green-400",
    },
    {
      icon: Calendar,
      label: "Events Hosted",
      current: userData.progress.eventsHosted.current,
      goal: userData.progress.eventsHosted.goal,
      change: userData.progress.eventsHosted.recentChange,
      visible: userData.privacy.showEventActivity,
      color: "text-purple-400",
    },
    {
      icon: Trophy,
      label: "Trophies Earned",
      current: userData.progress.trophiesEarned.current,
      goal: userData.progress.trophiesEarned.goal,
      change: userData.progress.trophiesEarned.recentChange,
      visible: true,
      color: "text-yellow-400",
    },
  ]

  return (
    <div className="min-h-screen manor-bg">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 text-accent-gold hover:text-accent-gold/80 mb-6 font-merriweather"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </Link>

        <div className="room-furniture p-8 mb-6">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Profile Picture */}
            <Avatar className="h-32 w-32 border-4 border-accent-gold/40">
              <AvatarImage src={userData.profilePicture || "/placeholder.svg"} alt={userData.name} />
              <AvatarFallback className="text-4xl font-cinzel">{userData.name.charAt(0)}</AvatarFallback>
            </Avatar>

            {/* Name and Location */}
            <div>
              <h1 className="font-cinzel text-4xl font-bold text-accent-gold mb-2">{userData.name}</h1>
              <div className="flex items-center justify-center gap-2 text-accent-gold/70">
                <MapPin className="h-4 w-4" />
                <span className="font-merriweather">{userData.location}</span>
              </div>
            </div>

            {/* Game Interests */}
            <div className="flex flex-wrap gap-2 justify-center">
              {userData.gameInterests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="bg-accent-gold/20 border border-accent-gold/40 text-accent-gold font-merriweather"
                >
                  {interest}
                </Badge>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button className="bg-accent-gold hover:bg-accent-gold/90 text-background font-cinzel">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
              <Link href={`/collection/${userId}`}>
                <Button
                  variant="outline"
                  className="border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background bg-transparent font-cinzel"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Game Collection ({userData.progress.gamesOwned.current})
                </Button>
              </Link>
              <Link href={`/trophies/${userId}`}>
                <Button
                  variant="outline"
                  className="border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background bg-transparent font-cinzel"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  View Trophies ({userData.progress.trophiesEarned.current})
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="room-furniture p-8">
          <div className="space-y-6">
            {/* Header with Level and XP */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-accent-gold/20">
              <h2 className="text-3xl text-accent-gold font-merriweather">Gaming Progress</h2>
              <div className="flex items-center gap-4">
                <div className="px-5 py-2 bg-accent-gold/20 border border-accent-gold/40 rounded-lg">
                  <span className="text-xl font-cinzel text-accent-gold">LEVEL {userData.level}</span>
                </div>
                <span className="text-lg font-merriweather text-accent-gold/80">{userData.totalXP} total XP</span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-2 pb-4 border-b border-accent-gold/20">
              <div className="flex items-center justify-between text-sm font-merriweather">
                <span className="text-accent-gold">Progress to Level {userData.level + 1}</span>
                <span className="text-muted-foreground">
                  {userData.currentXP} / {userData.xpToNextLevel} XP
                </span>
              </div>
              <Progress value={(userData.currentXP / userData.xpToNextLevel) * 100} className="h-2.5" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {progressItems.map((item) => {
                const Icon = item.icon
                const percentage = Math.round((item.current / item.goal) * 100)

                if (!item.visible) {
                  return (
                    <div key={item.label} className="space-y-3 p-4 rounded-lg bg-background/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm font-cinzel text-muted-foreground uppercase tracking-wide">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground italic font-merriweather">Hidden by user</p>
                    </div>
                  )
                }

                return (
                  <div key={item.label} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-sm font-cinzel text-muted-foreground uppercase tracking-wide">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-cinzel text-accent-gold">{item.current}</span>
                      <span className="text-lg font-merriweather text-muted-foreground">/ {item.goal} goal</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-merriweather text-foreground">{percentage}% complete</span>
                        <span className="font-merriweather text-green-400">{item.change}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
