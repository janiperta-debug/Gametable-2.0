"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAppTheme } from "@/components/app-theme-provider"
import type { RoomTheme } from "@/lib/room-themes"
import { unlockManorRoom, updateActiveRoom } from "@/app/actions/xp"
import { canUnlockManorRoom, isManorRoomUnlocked, THEME_ACCESS_TEST_MODE } from "@/lib/manor-progression"
import { useUser } from "@/hooks/useUser"
import { Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

interface ThemeSelectorProps {
  room: RoomTheme
}

export function ThemeSelector({ room }: ThemeSelectorProps) {
  const { currentAppTheme, setAppTheme } = useAppTheme()
  const { user, profile, refetch } = useUser()
  const [saving, setSaving] = useState(false)
  const t = useTranslations()

  const isCurrentTheme = currentAppTheme === room.id
  const isUnlocked = THEME_ACCESS_TEST_MODE || isManorRoomUnlocked(room.id, profile)
  const canUnlock = !THEME_ACCESS_TEST_MODE && canUnlockManorRoom(room.id, profile)
  const canUseTheme = isUnlocked

  const handleUnlock = async () => {
    if (!user || !canUnlock || saving) return
    setSaving(true)
    try {
      const result = await unlockManorRoom(room.id)
      if (result.success) await refetch()
      else console.error("Failed to unlock room:", result.error)
    } catch (error) {
      console.error("Error unlocking room:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = async () => {
    if (!canUseTheme || isCurrentTheme || saving) return

    setSaving(true)
    try {
      // Update local state immediately for responsiveness
      setAppTheme(room.id)

      // Persist to database
      const result = await updateActiveRoom(room.id)
      if (!result.success) {
        console.error("Failed to save room:", result.error)
        // Optionally revert on failure
      }
    } catch (error) {
      console.error("Error updating room:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Button
      size="sm"
      variant={isCurrentTheme ? "secondary" : canUseTheme || canUnlock ? "outline" : "ghost"}
      className={isCurrentTheme ? "cursor-default" : !canUseTheme && !canUnlock ? "cursor-not-allowed" : "bg-transparent"}
      disabled={isCurrentTheme || (!canUseTheme && !canUnlock) || saving}
      onClick={canUnlock ? handleUnlock : handleThemeChange}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isCurrentTheme ? (
        t("themes.currentlyActive")
      ) : isUnlocked || canUnlock ? (
        t("themes.enterRoom")
      ) : (
        t("themes.locked")
      )}
    </Button>
  )
}
