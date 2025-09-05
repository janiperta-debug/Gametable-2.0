"use client"

import { Button } from "@/components/ui/button"
import { useAppTheme } from "@/components/app-theme-provider"
import type { RoomTheme } from "@/lib/room-themes"

interface ThemeSelectorProps {
  room: RoomTheme
}

export function ThemeSelector({ room }: ThemeSelectorProps) {
  const { currentAppTheme, setAppTheme } = useAppTheme()

  const isCurrentTheme = currentAppTheme === room.id
  const canUseTheme = room.isUnlocked || room.canUnlock

  const handleThemeChange = () => {
    if (canUseTheme && !isCurrentTheme) {
      setAppTheme(room.id)
    }
  }

  return (
    <Button
      size="sm"
      variant={isCurrentTheme ? "secondary" : canUseTheme ? "outline" : "ghost"}
      className={isCurrentTheme ? "cursor-default" : !canUseTheme ? "cursor-not-allowed" : "bg-transparent"}
      disabled={isCurrentTheme || !canUseTheme}
      onClick={handleThemeChange}
    >
      {isCurrentTheme ? "Currently Active" : canUseTheme ? "Enter Room" : "Locked"}
    </Button>
  )
}
