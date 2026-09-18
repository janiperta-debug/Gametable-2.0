"use client"

import { Lock } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { getRoomsByCategory, type RoomTheme } from "@/lib/room-themes"
import {
  getManorUnlockedRoomIds,
  type ManorEntitlementProfile,
} from "@/lib/manor-progression"

const camelId = (id: string) => id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())

interface ManorTileProps {
  room: RoomTheme
  isActive: boolean
  isUnlocked: boolean
  t: (key: string) => string
}

function ManorTile({ room, isActive, isUnlocked, t }: ManorTileProps) {
  const name = t(`rooms.${camelId(room.id)}.name`) || room.name
  const locked = !isUnlocked

  return (
    <div
      className={`manor-tile group relative aspect-square overflow-hidden rounded-sm ${
        isActive ? "manor-tile-active" : ""
      } ${locked ? "manor-tile-locked" : ""}`}
      title={name}
    >
      <img
        src={`/themes/sketches/${room.id}.png`}
        alt={name}
        loading="lazy"
        className="manor-tile-sketch h-full w-full object-contain p-1"
      />
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="h-5 w-5 text-[hsl(30,55%,28%)]" aria-hidden="true" />
          <span className="sr-only">{`${name} — ${t("themes.locked") || "Locked"}`}</span>
        </div>
      )}
      {isActive && (
        <span className="absolute inset-x-0 bottom-0 bg-[hsl(45,80%,45%)] py-0.5 text-center font-heading text-[8px] font-bold uppercase tracking-wide text-[hsl(40,60%,12%)]">
          {t("themes.currentRoom") || "Current"}
        </span>
      )}
    </div>
  )
}

interface ManorFloorProps {
  label: string
  rooms: RoomTheme[]
  activeRoomId: string
  unlockedRoomIds: Set<string>
  t: (key: string) => string
}

function ManorFloor({ label, rooms, activeRoomId, unlockedRoomIds, t }: ManorFloorProps) {
  return (
    <section>
      <h2 className="manor-floor-label mb-2 font-heading text-xs font-bold uppercase tracking-[0.2em]">{label}</h2>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 lg:grid-cols-7 lg:gap-2">
        {rooms.map((room) => (
          <ManorTile
            key={room.id}
            room={room}
            isActive={activeRoomId === room.id}
            isUnlocked={unlockedRoomIds.has(room.id)}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}

interface ManorMapProps {
  activeRoomId: string
  profile?: ManorEntitlementProfile | null
}

export function ManorMap({ activeRoomId, profile }: ManorMapProps) {
  const t = useTranslations()
  const unlockedRoomIds = new Set(getManorUnlockedRoomIds(profile))
  const groundFloor = getRoomsByCategory("Ground Floor")
  const secondFloor = getRoomsByCategory("Second Floor")
  const basement = getRoomsByCategory("Basement")

  return (
    <div className="space-y-6">
      <ManorFloor
        label={t("themes.groundFloor")}
        rooms={groundFloor}
        activeRoomId={activeRoomId}
        unlockedRoomIds={unlockedRoomIds}
        t={t}
      />
      <ManorFloor
        label={t("themes.secondFloor")}
        rooms={secondFloor}
        activeRoomId={activeRoomId}
        unlockedRoomIds={unlockedRoomIds}
        t={t}
      />
      <ManorFloor
        label={t("themes.basement")}
        rooms={basement}
        activeRoomId={activeRoomId}
        unlockedRoomIds={unlockedRoomIds}
        t={t}
      />
    </div>
  )
}
