"use client"

import { useEffect, useState } from "react"
import { Trophy, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { BADGE_DEFINITIONS, type BadgeSeries } from "@/lib/badge-definitions"
import { getBadgesWithProgress, type BadgeWithProgress } from "@/app/actions/badges"
import { useUser } from "@/hooks/useUser"
import { ThemeHero } from "@/components/theme-hero"
import { ArchiveCard, ArchiveCardContent, ArchiveToggle } from "@/components/archive-frame"
import Image from "next/image"

export default function TrophiesPage() {
  const { user, loading: userLoading } = useUser()
  const t = useTranslations()
  const [badges, setBadges] = useState<BadgeWithProgress[]>([])
  const [earnedCount, setEarnedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState<"progress" | "cabinet">("progress")

  useEffect(() => {
    let active = true
    async function loadBadges() {
      setLoading(true)
      setLoadError(false)
      try {
        const localBadges: BadgeWithProgress[] = BADGE_DEFINITIONS.map((b) => ({
          id: b.id, series: b.series, tier: b.tier, name: b.name,
          description: b.description, requirement_type: getRequirementType(b.series),
          requirement_value: b.requirement, xp_reward: b.xp, image_url: b.image,
          earned: false, current_progress: 0,
        }))
        if (!user) {
          if (active) { setBadges(localBadges); setEarnedCount(0) }
          return
        }
        const result = await getBadgesWithProgress(user.id)
        if (!active) return
        if (result.error) {
          console.error("Could not load trophies:", result.error)
          setLoadError(true)
          setBadges(localBadges)
          setEarnedCount(0)
        } else {
          setBadges(result.badges.length ? result.badges : localBadges)
          setEarnedCount(result.earnedCount)
        }
      } catch (error) {
        console.error("Trophy page failed to load:", error)
        if (active) {
          setLoadError(true)
          setBadges(BADGE_DEFINITIONS.map((b) => ({
            id: b.id, series: b.series, tier: b.tier, name: b.name,
            description: b.description, requirement_type: getRequirementType(b.series),
            requirement_value: b.requirement, xp_reward: b.xp, image_url: b.image,
            earned: false, current_progress: 0,
          })))
          setEarnedCount(0)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    if (!userLoading) {
      loadBadges()
    }
    return () => { active = false }
  }, [user?.id, userLoading])

  // Helper to map series to requirement type
  function getRequirementType(series: string): string {
    switch (series) {
      case "curator-of-wonders": return "game_count"
      case "dimensional-wanderer": return "category_count"
      case "fellowship-weaver": return "friend_count"
      case "gathering-master": return "events_hosted"
      case "stalwart-companion": return "events_attended"
      case "manor-ascendant": return "level"
      case "portal-keeper": return "bgg_imports"
      default: return "game_count"
    }
  }

  // Group badges by series using local definitions as fallback
  const seriesOrder: BadgeSeries[] = ["curator-of-wonders", "dimensional-wanderer", "fellowship-weaver", "gathering-master", "stalwart-companion", "manor-ascendant", "portal-keeper"]
  
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <ThemeHero page="trophies" mode="backdrop">
          <div className="flex flex-col items-center gap-6 text-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl logo-text mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                {t("trophies.title")}
              </h1>
              <p className="text-base sm:text-lg font-merriweather text-foreground/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                {t("trophies.subtitle")}
              </p>
            </div>
            <div className="flex gap-6 sm:gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-accent-gold" />
                  <span className="text-xl sm:text-3xl font-cinzel text-accent-gold">{earnedCount}</span>
                  <span className="text-sm sm:text-xl font-merriweather text-foreground/90">/ {totalBadges}</span>
                </div>
                <p className="text-xs sm:text-sm font-merriweather text-foreground/80">{t("trophies.badgesEarned")}</p>
              </div>
            </div>
          </div>
        </ThemeHero>

        {loadError && <div role="alert" className="mb-5 rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-sm font-merriweather text-amber-100">Could not load your achievements. Showing available achievement definitions; earned medals and progress are temporarily unavailable. Please try reloading the page.</div>}
        <div className="mb-6 flex justify-center">
          <ArchiveToggle
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: "progress", label: t("trophies.progress") },
              { value: "cabinet", label: t("trophies.showcase") },
            ]}
          />
        </div>
        {activeTab === "progress" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {badgesBySeries.map(({ series, badges: seriesBadges }) => {
              const earned = seriesBadges.filter((badge) => badge.earned)
              const highest = earned[earned.length - 1]
              const next = seriesBadges.find((badge) => !badge.earned)
              const featured = highest || next
              if (!featured) return null
              const local = BADGE_DEFINITIONS.find((badge) => badge.id === featured.id)
              const target = next?.requirement_value || 0
              const progress = next?.current_progress || 0
              const percent = target > 0 ? Math.min(100, Math.max(0, progress / target * 100)) : 100
              return (
                <ArchiveCard key={series}>
                  <ArchiveCardContent>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                        <Image src={featured.image_url || local?.image || "/placeholder.svg"} alt="" fill className={`object-contain ${highest ? "" : "grayscale opacity-50"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-cinzel text-accent-gold">{t(`trophies.series.${series}`)}</h2>
                        <p className="text-sm text-muted-foreground">{earned.length} / {seriesBadges.length} {t("trophies.tiersEarned")}</p>
                        {highest && <p className="text-sm text-accent-gold mt-1">{t(`trophies.${highest.tier}`)} · {t(`trophies.badges.${highest.id}.name`)}</p>}
                        {!highest && <p className="text-sm text-muted-foreground mt-1">{t("trophies.locked")}</p>}
                      </div>
                    </div>
                    {next ? (
                      <div className="mt-4">
                        <div className="flex justify-between gap-3 text-xs sm:text-sm font-merriweather mb-2">
                          <span>{t(`trophies.${next.tier}`)} · {t(`trophies.badges.${next.id}.requirement`)}</span>
                          <span className="whitespace-nowrap text-accent-gold">{progress} / {target}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden bg-background/50" role="progressbar" aria-valuenow={Math.min(progress, target)} aria-valuemin={0} aria-valuemax={target}>
                          <div className="h-full bg-accent-gold/70 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    ) : <p className="mt-4 text-sm font-merriweather text-accent-gold">{t("trophies.gold")} · {t("trophies.earned")}</p>}
                  </ArchiveCardContent>
                </ArchiveCard>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.filter((badge) => badge.earned).map((badge) => {
              const local = BADGE_DEFINITIONS.find((item) => item.id === badge.id)
              return (
                <ArchiveCard key={badge.id}>
                  <ArchiveCardContent>
                    <div className="relative w-28 h-28 mx-auto mb-3">
                      <Image src={badge.image_url || local?.image || "/placeholder.svg"} alt="" fill className="object-contain" />
                    </div>
                    <h2 className="text-center text-lg font-cinzel text-accent-gold">{t(`trophies.badges.${badge.id}.name`)}</h2>
                    <p className="text-center text-sm text-muted-foreground mt-1">{t(`trophies.${badge.tier}`)} · {t(`trophies.series.${badge.series}`)}</p>
                    {badge.earned_at && <p className="text-center text-xs text-muted-foreground mt-2">{t("trophies.earnedAt")} {new Date(badge.earned_at).toLocaleDateString()}</p>}
                  </ArchiveCardContent>
                </ArchiveCard>
              )
            })}
            {earnedCount === 0 && <p className="font-merriweather text-muted-foreground">{t("trophies.locked")}</p>}
          </div>
        )}
      </main>
    </div>
  )
}
