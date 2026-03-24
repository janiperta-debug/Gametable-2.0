"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, BookOpen, Users, Calendar, Trophy, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { xpForNextLevel, xpForCurrentLevel } from "@/lib/xp-utils"

export function GamingProgress() {
  const t = useTranslations()
  const { profile, loading } = useUser()
  
  // Calculate XP progress from profile data
  const level = profile?.level ?? 1
  const totalXP = profile?.xp ?? 0
  const currentLevelXP = xpForCurrentLevel(level)
  const nextLevelXP = xpForNextLevel(level)
  const xpInCurrentLevel = totalXP - currentLevelXP
  const xpNeededForLevel = nextLevelXP - currentLevelXP
  
  // Stats - showing current counts and recent changes
  const stats = {
    level,
    totalXP,
    currentXP: xpInCurrentLevel,
    xpToNextLevel: xpNeededForLevel,
    gamesOwned: { current: 0, recentChange: "+0" },
    gamingFriends: { current: 0, recentChange: "+0" },
    eventsHosted: { current: 0, recentChange: "+0" },
    trophiesEarned: { current: 0, recentChange: "+0" },
  }

  if (loading) {
    return (
      <div className="room-furniture p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  return (
    <div className="room-furniture p-8 space-y-6">
      {/* Header with Level and XP */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <h2 className="text-3xl text-accent-gold">{t("profile.myProgress")}</h2>
          <div className="flex items-center gap-4">
            <div className="px-5 py-2 bg-accent-gold/20 border border-accent-gold/40 rounded-lg">
              <span className="text-xl font-cinzel text-accent-gold">{t("profile.level")} {stats.level}</span>
            </div>
            <span className="text-lg font-merriweather text-accent-gold/80">{stats.totalXP} {t("profile.totalXP")}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background bg-transparent"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("common.refresh")}
        </Button>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2 pb-4 border-b border-accent-gold/20">
        <div className="flex items-center justify-between text-sm font-merriweather">
          <span className="text-accent-gold">{t("profile.progressToLevel")} {stats.level + 1}</span>
          <span className="text-muted-foreground">
            {stats.currentXP} / {stats.xpToNextLevel} XP
          </span>
        </div>
        <Progress value={(stats.currentXP / stats.xpToNextLevel) * 100} className="h-2.5" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Games Owned */}
        <div className="space-y-3 p-4 rounded-lg bg-card/30 border border-accent-gold/10">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-cinzel text-muted-foreground uppercase tracking-wide">{t("profile.gamesOwned")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-cinzel text-accent-gold">{stats.gamesOwned.current}</span>
            <span className="text-sm font-merriweather text-green-400">{stats.gamesOwned.recentChange} {t("profile.thisMonth")}</span>
          </div>
        </div>

        {/* Gaming Friends */}
        <div className="space-y-3 p-4 rounded-lg bg-card/30 border border-accent-gold/10">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-sm font-cinzel text-muted-foreground uppercase tracking-wide">{t("profile.gamingFriends")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-cinzel text-accent-gold">{stats.gamingFriends.current}</span>
            <span className="text-sm font-merriweather text-green-400">{stats.gamingFriends.recentChange} {t("profile.newFriends")}</span>
          </div>
        </div>

        {/* Events Hosted */}
        <div className="space-y-3 p-4 rounded-lg bg-card/30 border border-accent-gold/10">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-cinzel text-muted-foreground uppercase tracking-wide">{t("profile.eventsHosted")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-cinzel text-accent-gold">{stats.eventsHosted.current}</span>
            <span className="text-sm font-merriweather text-green-400">{stats.eventsHosted.recentChange} {t("profile.thisMonth")}</span>
          </div>
        </div>

        {/* Trophies Earned */}
        <div className="space-y-3 p-4 rounded-lg bg-card/30 border border-accent-gold/10">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-cinzel text-muted-foreground uppercase tracking-wide">{t("profile.trophiesEarned")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-cinzel text-accent-gold">{stats.trophiesEarned.current}</span>
            <span className="text-sm font-merriweather text-green-400">{stats.trophiesEarned.recentChange} {t("profile.thisWeek")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
