"use client"

import { useMemo } from "react"
import { ManorMap } from "@/components/manor-map"

export default function ThemesPage() {
  // TEMPORARY: every theme is locked except Main Hall while room work is in progress.
  const unlockedRooms = useMemo(() => ["main-hall"], [])
  const activeRoom = "main-hall"

  // The page IS the map — full-bleed sepia parchment, nothing but the rooms.
  return (
    <main className="manor-map min-h-screen px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <ManorMap activeRoomId={activeRoom} unlockedRooms={unlockedRooms} />
      </div>
    </main>
  )
}
