"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, BookOpen, Users, Calendar, Trophy } from "lucide-react"

export function GamingProgress() {
  // Mock data - will be replaced with Firebase data
  const stats = {
    level: 9,
    totalXP: 800,
    currentXP: 0,
    xpToNextLevel: 100,
    gamesOwned: { current: 247, goal: 300, percentComplete: 82, recentChange: "+12 this month" },
    gamingFriends: { current: 38, goal: 50, percentComplete: 76, recentChange: "+3 new friends" },
    eventsHosted: { current: 15, goal: 25, percentComplete: 60, recentChange: "+5 this month" },
    trophiesEarned: { current: 23, goal: 50, percentComplete: 46, recentChange: "+2 this week" },
  }

  return (
    <div className="room-furniture p-8 space-y-6">
      {/* Header with Level and XP */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <h2 className="text-3xl font-charm ornate-text text-accent-gold">Gaming Progress</h2>
          <div className="flex items-center gap-4">
            <div className="px-5 py-2 bg-accent-gold/20 border border-accent-gold/40 rounded-lg">
              <span className="text-xl font-cinzel text-accent-gold">LEVEL {stats.level}</span>
            </div>
            <span className="text-lg font-merriweather text-accent-gold/80">{stats.totalXP} total XP</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background bg-transparent"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2 pb-4 border-b border-accent-gold/20">
        <div className="flex items-center justify-between text-sm font-merriweather">
          <span className="text-accent-gold">Progress to Level {stats.level + 1}</span>
          <span className="text-muted-foreground">
            {stats.currentXP} / {stats.xpToNextLevel} XP
          </span>
        </div>
        <Progress value={(stats.currentXP / stats.xpToNextLevel) * 100} className="h-2.5" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Games Owned */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-cinzel text-muted-foreground uppercase tracking-wide">Games Owned</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-cinzel text-accent-gold">{stats.gamesOwned.current}</span>
            <span className="text-lg font-merriweather text-muted-foreground">/ {stats.gamesOwned.goal} goal</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-merriweather text-foreground">{stats.gamesOwned.percentComplete}% complete</span>
              <span className="font-merriweather text-green-400">{stats.gamesOwned.recentChange}</span>
            </div>
            <Progress value={stats.gamesOwned.percentComplete} className="h-2" />
          </div>
        </div>

        {/* Gaming Friends */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-sm font-cinzel text-muted-foreground uppercase tracking-wide">Gaming Friends</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-cinzel text-accent-gold">{stats.gamingFriends.current}</span>
            <span className="text-lg font-merriweather text-muted-foreground">/ {stats.gamingFriends.goal} goal</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-merriweather text-foreground">{stats.gamingFriends.percentComplete}% complete</span>
              <span className="font-merriweather text-green-400">{stats.gamingFriends.recentChange}</span>
            </div>
            <Progress value={stats.gamingFriends.percentComplete} className="h-2" />
          </div>
        </div>

        {/* Events Hosted */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-cinzel text-muted-foreground uppercase tracking-wide">Events Hosted</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-cinzel text-accent-gold">{stats.eventsHosted.current}</span>
            <span className="text-lg font-merriweather text-muted-foreground">/ {stats.eventsHosted.goal} goal</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-merriweather text-foreground">{stats.eventsHosted.percentComplete}% complete</span>
              <span className="font-merriweather text-green-400">{stats.eventsHosted.recentChange}</span>
            </div>
            <Progress value={stats.eventsHosted.percentComplete} className="h-2" />
          </div>
        </div>

        {/* Trophies Earned */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-cinzel text-muted-foreground uppercase tracking-wide">Trophies Earned</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-cinzel text-accent-gold">{stats.trophiesEarned.current}</span>
            <span className="text-lg font-merriweather text-muted-foreground">/ {stats.trophiesEarned.goal} goal</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-merriweather text-foreground">
                {stats.trophiesEarned.percentComplete}% complete
              </span>
              <span className="font-merriweather text-green-400">{stats.trophiesEarned.recentChange}</span>
            </div>
            <Progress value={stats.trophiesEarned.percentComplete} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
