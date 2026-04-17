"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, BookOpen, Users, Calendar, Trophy, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { xpForNextLevel, xpForCurrentLevel } from "@/lib/xp-utils"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect, useCallback } from "react"

export function GamingProgress() {
  const t = useTranslations()
  const { user, profile, loading } = useUser()
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsData, setStatsData] = useState({
    gamesOwned: 0,
    gamesThisMonth: 0,
    friendsCount: 0,
    newFriendsThisMonth: 0,
    eventsHosted: 0,
    eventsThisMonth: 0,
    badgesEarned: 0,
    badgesThisWeek: 0,
  })
  
  const fetchStats = useCallback(async () => {
    if (!user?.id) return
    
    setStatsLoading(true)
    const supabase = createClient()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString()
    
    try {
      // Fetch games owned count
      const { count: gamesCount } = await supabase
        .from("user_games")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
      
      // Fetch games added this month
      const { count: gamesThisMonth } = await supabase
        .from("user_games")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth)
      
      // Fetch friends count (accepted friendships)
      const { count: friendsCount } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq("status", "accepted")
      
      // Fetch new friends this month
      const { count: newFriendsThisMonth } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq("status", "accepted")
        .gte("updated_at", startOfMonth)
      
      // Fetch events hosted
      const { count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("host_id", user.id)
      
      // Fetch events hosted this month
      const { count: eventsThisMonth } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("host_id", user.id)
        .gte("created_at", startOfMonth)
      
      // Fetch badges earned
      const { count: badgesCount } = await supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
      
      // Fetch badges earned this week
      const { count: badgesThisWeek } = await supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("earned_at", startOfWeek)
      
      setStatsData({
        gamesOwned: gamesCount ?? 0,
        gamesThisMonth: gamesThisMonth ?? 0,
        friendsCount: friendsCount ?? 0,
        newFriendsThisMonth: newFriendsThisMonth ?? 0,
        eventsHosted: eventsCount ?? 0,
        eventsThisMonth: eventsThisMonth ?? 0,
        badgesEarned: badgesCount ?? 0,
        badgesThisWeek: badgesThisWeek ?? 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }, [user?.id])
  
  useEffect(() => {
    fetchStats()
  }, [fetchStats])
  
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
    gamesOwned: { current: statsData.gamesOwned, recentChange: `+${statsData.gamesThisMonth}` },
    gamingFriends: { current: statsData.friendsCount, recentChange: `+${statsData.newFriendsThisMonth}` },
    eventsHosted: { current: statsData.eventsHosted, recentChange: `+${statsData.eventsThisMonth}` },
    trophiesEarned: { current: statsData.badgesEarned, recentChange: `+${statsData.badgesThisWeek}` },
  }

  if (loading || statsLoading) {
    return (
      <div className="room-furniture p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  return (
    <div className="room-furniture p-4 sm:p-8 space-y-4 sm:space-y-6">
      {/* Header with Level and XP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <h2 className="text-xl sm:text-3xl text-accent-gold">{t("profile.myProgress")}</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="px-3 sm:px-5 py-1.5 sm:py-2 bg-accent-gold/20 border border-accent-gold/40 rounded-lg">
              <span className="text-sm sm:text-xl font-cinzel text-accent-gold">{t("profile.level")} {stats.level}</span>
            </div>
            <span className="text-sm sm:text-lg font-merriweather text-accent-gold/80">{stats.totalXP} {t("profile.totalXP")}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background bg-transparent w-full sm:w-auto"
          onClick={() => fetchStats()}
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
