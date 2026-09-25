"use client"

import { useEffect, useState } from "react"
import { Trophy, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { BADGE_DEFINITIONS, type BadgeSeries } from "@/lib/badge-definitions"
import { getBadgesWithProgress, type BadgeWithProgress } from "@/app/actions/badges"
import { useUser } from "@/hooks/useUser"
import { ThemeHero } from "@/components/theme-hero"
import { ArchiveCard, ArchiveCardContent, ArchiveFrame, ArchiveToggle } from "@/components/archive-frame"
import { ArchiveDivider } from "@/components/archive-divider"
import Image from "next/image"

export default function TrophiesPage() {
  const { user, loading: userLoading } = useUser()
  const t = useTranslations()
  const [badges, setBadges] = useState<BadgeWithProgress[]>([])
  const [earnedCount, setEarnedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState<"progress" | "cabinet">("progress")
  const [expandedSeries, setExpandedSeries] = useState<BadgeSeries[]>([])

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
      case "portal-keeper": return "import_operations"
      case "tournament-champion": return "tournament_wins"
      case "tournament-master": return "tournaments_hosted"
      case "chronicler-of-legends": return "campaigns_played"
      case "master-storyteller": return "campaigns_hosted"
      case "league-veteran": return "league_seasons_played"
      case "league-commissioner": return "league_seasons_hosted"
      default: return "game_count"
    }
  }

  // Group badges by series using local definitions as fallback
  const seriesOrder: BadgeSeries[] = ["curator-of-wonders", "dimensional-wanderer", "fellowship-weaver", "gathering-master", "stalwart-companion", "manor-ascendant", "portal-keeper", "tournament-champion", "tournament-master", "chronicler-of-legends", "master-storyteller", "league-veteran", "league-commissioner"]
  
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
          </div>
        </ThemeHero>

        {loadError && <div role="alert" className="mb-5 rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-sm font-merriweather text-amber-100">Could not load your achievements. Showing available achievement definitions; earned medals and progress are temporarily unavailable. Please try reloading the page.</div>}
        <ArchiveFrame weight="thin" cornerSize="sm" className="mb-8 rounded-xl">
          <div className="flex justify-center px-2 pt-2">
            <ArchiveToggle
              framed={false}
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: "progress", label: t("trophies.progress"), icon: <Trophy className="h-4 w-4" /> },
                { value: "cabinet", label: t("trophies.showcase"), icon: <Trophy className="h-4 w-4" /> },
              ]}
            />
          </div>
          <ArchiveDivider />
          <div className="px-4 py-4 text-center sm:px-6 sm:py-5">
            <h2 className="logo-text text-2xl sm:text-3xl">{t("trophies.title")}</h2>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-accent-gold" />
              <span className="font-cinzel text-xl text-accent-gold">{earnedCount}</span>
              <span className="font-merriweather text-foreground/80">/ {totalBadges}</span>
            </div>
            <p className="mt-1 font-merriweather text-sm text-foreground/80">{t("trophies.badgesEarned")}</p>
          </div>
        </ArchiveFrame>
        {activeTab === "progress" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {badgesBySeries.map(({ series, badges: seriesBadges }) => {
              const verified = (badge: BadgeWithProgress) => badge.earned && (series !== "portal-keeper" || badge.current_progress >= (badge.requirement_value || 0))
              const earned = seriesBadges.filter(verified)
              const highest = earned[earned.length - 1]
              const next = seriesBadges.find((badge) => !verified(badge))
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
                        <p className="text-sm text-muted-foreground">{`${earned.length} / ${seriesBadges.length} ${t("trophies.tiersEarned")}`}</p>
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
                    <button
                      type="button"
                      aria-expanded={expandedSeries.includes(series)}
                      aria-controls={`badge-details-${series}`}
                      onClick={() => setExpandedSeries((current) => current.includes(series) ? current.filter((item) => item !== series) : [...current, series])}
                      className="mt-4 flex w-full items-center justify-between border-t border-accent-gold/25 pt-3 text-left font-merriweather text-sm text-accent-gold transition-colors hover:text-foreground"
                    >
                      <span>{t(expandedSeries.includes(series) ? "trophies.showLess" : "trophies.showMore")}</span>
                      {expandedSeries.includes(series) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expandedSeries.includes(series) && (
                      <div id={`badge-details-${series}`} className="mt-4 space-y-4 border-t border-accent-gold/20 pt-4 font-merriweather text-sm">
                        <p className="leading-relaxed text-foreground/80">{t(`trophies.seriesDescriptions.${series}`)}</p>
                        <div>
                            <h3 className="mb-3 font-cinzel text-accent-gold">{t("trophies.nextTiers")}</h3>
                            <ul className="space-y-3">
                              {seriesBadges.map((badge) => (
                                <li key={badge.id} className="flex items-start gap-3">
                                  <span aria-hidden="true" className={verified(badge) ? "text-accent-gold" : "text-muted-foreground"}>{verified(badge) ? "✓" : "○"}</span>
                                  <div>
                                    <p className="font-semibold">{t(`trophies.${badge.tier}`)} · {t(`trophies.badges.${badge.id}.name`)}</p>
                                    <p className="mt-1 text-foreground/75">{t(`trophies.badges.${badge.id}.description`)}</p>
                                    <p className="mt-1 text-accent-gold">{t(`trophies.badges.${badge.id}.requirement`)}</p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                        </div>
                      </div>
                    )}
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
                    <div className="relative mx-auto mb-3 h-32 w-32 sm:h-36 sm:w-36">
                      <Image src={badge.image_url || local?.image || "/placeholder.svg"} alt="" fill className="object-contain" />
                    </div>
                    <h2 className="text-center font-cinzel text-lg text-accent-gold">{t(`trophies.badges.${badge.id}.name`)}</h2>
                    <p className="mt-1 text-center text-sm text-muted-foreground">{t(`trophies.${badge.tier}`)} · {t(`trophies.series.${badge.series}`)}</p>
                    {badge.series === "portal-keeper" && badge.current_progress < (badge.requirement_value || 0) && <p className="mt-2 text-center text-xs text-amber-200/90">{t("trophies.legacyMedal")}</p>}
                    {badge.earned_at && <p className="mt-2 text-center text-xs text-muted-foreground">{t("trophies.earnedAt")} {new Date(badge.earned_at).toLocaleDateString()}</p>}
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
