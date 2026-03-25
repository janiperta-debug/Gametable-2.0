"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAppTheme } from "@/components/app-theme-provider"
import type { RoomTheme } from "@/lib/room-themes"
import { updateActiveRoom } from "@/app/actions/xp"
import { useUser } from "@/hooks/useUser"
import { Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

interface ThemeSelectorProps {
  room: RoomTheme
}

export function ThemeSelector({ room }: ThemeSelectorProps) {
  const { currentAppTheme, setAppTheme } = useAppTheme()
  const { profile } = useUser()
  const [saving, setSaving] = useState(false)
  const t = useTranslations()

  // Check if room is unlocked based on profile data
  const unlockedRooms = profile?.unlocked_themes ?? []
  const isRoomUnlocked = room.id === "main-hall" || unlockedRooms.includes(room.id)
  
  const isCurrentTheme = currentAppTheme === room.id
  const canUseTheme = isRoomUnlocked || room.canUnlock

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
      variant={isCurrentTheme ? "secondary" : canUseTheme ? "outline" : "ghost"}
      className={isCurrentTheme ? "cursor-default" : !canUseTheme ? "cursor-not-allowed" : "bg-transparent"}
      disabled={isCurrentTheme || !canUseTheme || saving}
      onClick={handleThemeChange}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isCurrentTheme ? (
        t("themes.currentlyActive")
      ) : canUseTheme ? (
        t("themes.enterRoom")
      ) : (
        t("themes.locked")
      )}
    </Button>
  )
}
