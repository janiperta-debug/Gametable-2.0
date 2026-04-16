"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { BadgeIcon, Lock, Trophy, Award, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { BADGE_DEFINITIONS, type BadgeSeries } from "@/lib/badge-definitions"
import { getBadgesWithProgress, type BadgeWithProgress } from "@/app/actions/badges"
import { useUser } from "@/hooks/useUser"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

export default function TrophiesPage() {
  const { user, loading: userLoading } = useUser()
  const t = useTranslations()
  const [badges, setBadges] = useState<BadgeWithProgress[]>([])
  const [earnedCount, setEarnedCount] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBadges() {
      console.log("[v0] loadBadges called, user:", user?.id)
      if (!user) {
        // Use local badge definitions with no progress for non-logged in users
        const localBadges: BadgeWithProgress[] = BADGE_DEFINITIONS.map((b) => ({
          id: b.id,
          series: b.series,
          tier: b.tier,
          name: b.name,
          description: b.description,
          requirement_type: getRequirementType(b.series),
          requirement_value: b.requirement,
          xp_reward: b.xp,
          image_url: b.image,
          earned: false,
          current_progress: 0,
        }))
        setBadges(localBadges)
        setEarnedCount(0)
        setTotalXP(0)
        setLoading(false)
        return
      }

      console.log("[v0] Calling getBadgesWithProgress for user:", user.id)
      const result = await getBadgesWithProgress(user.id)
      console.log("[v0] getBadgesWithProgress result:", { 
        badgeCount: result.badges.length, 
        earnedCount: result.earnedCount, 
        error: result.error,
        earnedBadges: result.badges.filter(b => b.earned).map(b => b.id)
      })
      if (!result.error) {
        // If we got data from Supabase, use it; otherwise fall back to local definitions
        if (result.badges.length > 0) {
          setBadges(result.badges)
          setEarnedCount(result.earnedCount)
          setTotalXP(result.totalXP)
        } else {
          // Fallback to local definitions with Supabase progress
          const localBadges: BadgeWithProgress[] = BADGE_DEFINITIONS.map((b) => ({
            id: b.id,
            series: b.series,
            tier: b.tier,
            name: b.name,
            description: b.description,
            requirement_type: getRequirementType(b.series),
            requirement_value: b.requirement,
            xp_reward: b.xp,
            image_url: b.image,
            earned: false,
            current_progress: 0,
          }))
          setBadges(localBadges)
          setEarnedCount(0)
          setTotalXP(0)
        }
      }
      setLoading(false)
    }
    
    if (!userLoading) {
      loadBadges()
    }
  }, [user, userLoading])

  // Helper to map series to requirement type
  function getRequirementType(series: string): string {
    switch (series) {
      case "collection": return "game_count"
      case "explorer": return "category_count"
      case "social": return "friend_count"
      case "hosting": return "events_hosted"
      case "attendance": return "events_attended"
      case "manor": return "level"
      case "portal": return "bgg_imports"
      default: return "game_count"
    }
  }

  // Group badges by series using local definitions as fallback
  const seriesOrder: BadgeSeries[] = ["collection", "explorer", "social", "hosting", "attendance", "manor", "portal"]
  
  const badgesBySeries = seriesOrder.map((series) => {
    // Get badges for this series from loaded data or use local definitions
    let seriesBadges = badges.filter((b) => b.series === series)
    
    // If no badges from Supabase, use local definitions
    if (seriesBadges.length === 0) {
      seriesBadges = BADGE_DEFINITIONS
        .filter((b) => b.series === series)
        .map((b) => ({
          id: b.id,
          series: b.series,
          tier: b.tier,
          name: b.name,
          description: b.description,
          requirement_type: getRequirementType(b.series),
          requirement_value: b.requirement,
          xp_reward: b.xp,
          image_url: b.image,
          earned: false,
          current_progress: 0,
        }))
    }
    
    // Sort by tier
    seriesBadges.sort((a, b) => {
      const tierOrder: Record<string, number> = { bronze: 0, silver: 1, gold: 2 }
      return (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0)
    })
    
    return {
      series,
      badges: seriesBadges,
    }
  })

  // Calculate total badges
  const totalBadges = BADGE_DEFINITIONS.length

  if (loading || userLoading) {
    return (
      <div className="min-h-screen manor-bg">
        <Navigation />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-accent-gold" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen manor-bg">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="room-furniture p-4 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl logo-text mb-2">{t("trophies.title")}</h1>
              <p className="text-sm sm:text-lg font-merriweather text-muted-foreground">
                {t("trophies.subtitle")}
              </p>
            </div>
            <div className="flex gap-4 sm:gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-accent-gold" />
                  <span className="text-xl sm:text-3xl font-cinzel text-accent-gold">{earnedCount}</span>
                  <span className="text-sm sm:text-xl font-merriweather text-muted-foreground">/ {totalBadges}</span>
                </div>
                <p className="text-xs sm:text-sm font-merriweather text-muted-foreground">{t("trophies.badgesEarned")}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-accent-gold" />
                  <span className="text-xl sm:text-3xl font-cinzel text-accent-gold">{totalXP}</span>
                </div>
                <p className="text-xs sm:text-sm font-merriweather text-muted-foreground">{t("trophies.totalXP")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Series Grid */}
        <div className="space-y-6">
          {badgesBySeries.map(({ series, badges: seriesBadges }) => {
            const earnedInSeries = seriesBadges.filter((b) => b.earned).length
            const seriesNameTranslated = t(`trophies.series.${series}`)

            return (
              <div key={series} className="room-furniture p-6">
                {/* Series Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-accent-gold/20">
                  <div>
                    <h2 className="text-2xl text-accent-gold mb-1">{seriesNameTranslated}</h2>
                    <p className="text-sm font-merriweather text-muted-foreground">
                      {earnedInSeries} / {seriesBadges.length} {t("trophies.tiersEarned")}
                    </p>
                  </div>
                  <BadgeIcon className="h-6 w-6 text-accent-gold/60" />
                </div>

                {/* Badge Tiers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {seriesBadges.map((badge) => {
                    const isEarned = badge.earned
                    const progress = badge.current_progress
                    const required = badge.requirement_value || 0
                    const progressPercent = required > 0 ? Math.min(100, (progress / required) * 100) : 0
                    
                    // Get badge info from local definitions for translations
                    const localBadge = BADGE_DEFINITIONS.find((b) => b.id === badge.id)
                    const imageUrl = badge.image_url || localBadge?.image || "/placeholder.svg"

                    return (
                      <div
                        key={badge.id}
                        className={`relative group transition-all duration-300 ${
                          isEarned ? "scale-100" : "scale-95 opacity-75"
                        }`}
                      >
                        <div
                          className={`relative p-6 rounded-lg border-2 transition-all duration-300 ${
                            isEarned
                              ? "bg-gradient-to-br from-accent-gold/10 to-accent-gold/5 border-accent-gold/40 shadow-lg shadow-accent-gold/20"
                              : "bg-background/30 border-border/50"
                          }`}
                        >
                          {/* Badge Image */}
                          <div className="relative w-32 h-32 mx-auto mb-4">
                            <Image
                              src={imageUrl}
                              alt={badge.name}
                              fill
                              className={`object-contain transition-all duration-300 ${
                                isEarned ? "grayscale-0" : "grayscale opacity-40"
                              }`}
                            />
                            {!isEarned && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-background/80 rounded-full p-3">
                                  <Lock className="h-6 w-6 text-muted-foreground" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Badge Info */}
                          <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-2">
                              <h3 className="text-lg font-cinzel text-accent-gold">{t(`trophies.badges.${badge.id}.name`)}</h3>
                              <span
                                className={`text-xs font-merriweather uppercase px-2 py-0.5 rounded ${
                                  badge.tier === "bronze"
                                    ? "bg-orange-900/30 text-orange-400"
                                    : badge.tier === "silver"
                                      ? "bg-slate-700/30 text-slate-300"
                                      : "bg-yellow-900/30 text-yellow-400"
                                }`}
                              >
                                {t(`trophies.${badge.tier}`)}
                              </span>
                            </div>
                            <p className="text-sm font-merriweather text-muted-foreground">{t(`trophies.badges.${badge.id}.description`)}</p>
                            
                            {/* Progress bar for unearned badges */}
                            {!isEarned && required > 0 && (
                              <div className="pt-2">
                                <div className="flex justify-between text-xs font-merriweather text-muted-foreground mb-1">
                                  <span>{t("trophies.progress")}</span>
                                  <span>{progress} / {required}</span>
                                </div>
                                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-accent-gold/60 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            
                            {/* Earned date for earned badges */}
                            {isEarned && badge.earned_at && (
                              <p className="text-xs font-merriweather text-accent-gold/80 pt-2">
                                {t("trophies.earnedAt")} {formatDistanceToNow(new Date(badge.earned_at), { addSuffix: true })}
                              </p>
                            )}
                            
                            <div className="pt-2 space-y-1">
                              <p className="text-xs font-merriweather text-foreground">{t(`trophies.badges.${badge.id}.requirement`)}</p>
                              <p className="text-xs font-merriweather text-accent-gold">{t("trophies.reward")}: +{badge.xp_reward || localBadge?.xp || 100} XP</p>
                            </div>
                          </div>

                          {/* Earned Badge Glow Effect */}
                          {isEarned && (
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent-gold/5 to-transparent pointer-events-none" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
