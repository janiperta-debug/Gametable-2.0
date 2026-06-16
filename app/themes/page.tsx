"use client"

import { useMemo } from "react"
import { Progress } from "@/components/ui/progress"
import { useTranslations } from "@/lib/i18n"
import { Loader2 } from "lucide-react"
import { ManorMap } from "@/components/manor-map"
import { roomThemes } from "@/lib/room-themes"
import { useUser } from "@/hooks/useUser"
import { xpForNextLevel, xpForCurrentLevel } from "@/lib/xp-utils"

export default function ThemesPage() {
  const t = useTranslations()
  const { profile, loading } = useUser()

  // XP / level progress (kept compact — secondary to the map itself).
  const level = profile?.level ?? 1
  const totalXP = profile?.xp ?? 0
  const currentLevelXP = xpForCurrentLevel(level)
  const nextLevelXP = xpForNextLevel(level)
  const xpInCurrentLevel = totalXP - currentLevelXP
  const xpNeededForLevel = nextLevelXP - currentLevelXP
  const xpProgress = xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 0

  // TEMPORARY: every theme is locked except Main Hall while room work is in progress.
  const unlockedRooms = useMemo(() => ["main-hall"], [])
  const activeRoom = "main-hall"
  const totalRooms = roomThemes.length

  if (loading) {
    return (
      <div className="min-h-screen room-environment flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="logo-text text-4xl font-bold sm:text-5xl">{t("themes.title")}</h1>
          <p className="mt-2 font-body text-muted-foreground text-pretty">{t("themes.subtitle")}</p>
        </div>

        {/* Compact progress strip — intentionally small next to the map */}
        <div className="mx-auto mb-8 max-w-2xl rounded-lg border border-accent-gold/30 bg-card/40 px-4 py-3">
          <div className="flex items-center justify-between gap-4 text-sm font-body">
            <span className="font-heading font-semibold text-accent-gold">
              {t("themes.level")} {level}
            </span>
            <div className="flex-1">
              <Progress value={xpProgress} className="h-2 border border-accent-gold/30" />
            </div>
            <span className="whitespace-nowrap text-muted-foreground">
              {unlockedRooms.length}/{totalRooms} {t("themes.unlocked")}
            </span>
          </div>
        </div>

        {/* The manor map — always the same regardless of active theme */}
        <ManorMap activeRoomId={activeRoom} unlockedRooms={unlockedRooms} />
      </main>
    </div>
  )
}
