"use client"

import { Navigation } from "@/components/navigation"
import { BadgeIcon, Lock, Trophy, Award, ArrowLeft } from "lucide-react"
import { BADGE_DEFINITIONS, type BadgeSeries } from "@/lib/badge-definitions"
import { getUserBadgeProgress } from "@/lib/mock-user-progress"
import Image from "next/image"
import Link from "next/link"

export default function TrophiesPage({ params }: { params: { userId: string } }) {
  const { userId } = params

  // Fetch user badge progress from Firebase using userId
  const userProgress = getUserBadgeProgress(userId)

  // Group badges by series
  const seriesOrder: BadgeSeries[] = ["collection", "explorer", "social", "hosting", "attendance", "manor", "portal"]
  const badgesBySeries = seriesOrder.map((series) => {
    const badges = BADGE_DEFINITIONS.filter((b) => b.series === series).sort((a, b) => {
      const tierOrder = { bronze: 0, silver: 1, gold: 2 }
      return tierOrder[a.tier] - tierOrder[b.tier]
    })
    return {
      series,
      seriesName: badges[0]?.seriesName || "",
      badges,
    }
  })

  // Calculate stats
  const totalBadges = BADGE_DEFINITIONS.length
  const earnedBadges = userProgress.earnedBadges.length
  const totalXP = userProgress.earnedBadges.reduce((sum, badgeId) => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId)
    return sum + (badge?.xp || 0)
  }, 0)

  return (
    <div className="min-h-screen manor-bg">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Link
          href={`/profile/${userId}`}
          className="inline-flex items-center gap-2 text-accent-gold hover:text-accent-gold/80 mb-6 font-merriweather"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        {/* Header */}
        <div className="room-furniture p-8 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <h1 className="text-5xl font-charm logo-text mb-2">Trophy Collection</h1>
              <p className="text-lg font-merriweather text-muted-foreground">
                Achievements earned through dedication and mastery
              </p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="h-5 w-5 text-accent-gold" />
                  <span className="text-3xl font-cinzel text-accent-gold">{earnedBadges}</span>
                  <span className="text-xl font-merriweather text-muted-foreground">/ {totalBadges}</span>
                </div>
                <p className="text-sm font-merriweather text-muted-foreground">Badges Earned</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Award className="h-5 w-5 text-accent-gold" />
                  <span className="text-3xl font-cinzel text-accent-gold">{totalXP}</span>
                </div>
                <p className="text-sm font-merriweather text-muted-foreground">Total XP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Series Grid */}
        <div className="space-y-6">
          {badgesBySeries.map(({ series, seriesName, badges }) => {
            const earnedInSeries = badges.filter((b) => userProgress.earnedBadges.includes(b.id)).length

            return (
              <div key={series} className="room-furniture p-6">
                {/* Series Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-accent-gold/20">
                  <div>
                    <h2 className="text-2xl text-accent-gold mb-1">{seriesName}</h2>
                    <p className="text-sm font-merriweather text-muted-foreground">
                      {earnedInSeries} of {badges.length} tiers earned
                    </p>
                  </div>
                  <BadgeIcon className="h-6 w-6 text-accent-gold/60" />
                </div>

                {/* Badge Tiers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {badges.map((badge) => {
                    const isEarned = userProgress.earnedBadges.includes(badge.id)

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
                              src={badge.image || "/placeholder.svg"}
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
                              <h3 className="text-lg font-cinzel text-accent-gold">{badge.name}</h3>
                              <span
                                className={`text-xs font-merriweather uppercase px-2 py-0.5 rounded ${
                                  badge.tier === "bronze"
                                    ? "bg-orange-900/30 text-orange-400"
                                    : badge.tier === "silver"
                                      ? "bg-slate-700/30 text-slate-300"
                                      : "bg-yellow-900/30 text-yellow-400"
                                }`}
                              >
                                {badge.tier}
                              </span>
                            </div>
                            <p className="text-sm font-merriweather text-muted-foreground">{badge.description}</p>
                            <div className="pt-2 space-y-1">
                              <p className="text-xs font-merriweather text-foreground">{badge.requirementText}</p>
                              <p className="text-xs font-merriweather text-accent-gold">Reward: +{badge.xp} XP</p>
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
