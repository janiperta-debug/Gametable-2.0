"use client"

import { Lock } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { getRoomsByCategory, type RoomTheme } from "@/lib/room-themes"

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
      className={`manor-tile group relative flex flex-col overflow-hidden rounded-md ${
        isActive ? "manor-tile-active" : ""
      } ${locked ? "manor-tile-locked" : ""}`}
    >
      {/* Sketch artwork — fused into the parchment via multiply blend */}
      <div className="relative aspect-square">
        <img
          src={`/themes/sketches/${room.id}.png`}
          alt={name}
          loading="lazy"
          className="manor-tile-sketch h-full w-full object-contain p-2"
        />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-6 w-6 text-[hsl(30,55%,28%)]" aria-hidden="true" />
            <span className="sr-only">{t("themes.locked") || "Locked"}</span>
          </div>
        )}
        {isActive && (
          <span className="absolute left-1 top-1 rounded-sm bg-[hsl(45,80%,45%)] px-1.5 py-0.5 font-heading text-[9px] font-bold uppercase tracking-wide text-[hsl(40,60%,12%)]">
            {t("themes.currentRoom") || "Current"}
          </span>
        )}
      </div>

      {/* Room name plate */}
      <div className="border-t border-[hsla(30,45%,40%,0.35)] px-1 py-1.5 text-center">
        <span className="font-heading text-[10px] font-semibold uppercase leading-tight tracking-tight text-[hsl(30,55%,25%)] sm:text-[11px] text-balance">
          {name}
        </span>
      </div>
    </div>
  )
}

interface ManorFloorProps {
  label: string
  rooms: RoomTheme[]
  activeRoomId: string
  unlockedRooms: string[]
  t: (key: string) => string
}

function ManorFloor({ label, rooms, activeRoomId, unlockedRooms, t }: ManorFloorProps) {
  return (
    <section className="space-y-3">
      <h2 className="manor-floor-label pb-1 font-heading text-lg font-bold uppercase tracking-wide">{label}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rooms.map((room) => (
          <ManorTile
            key={room.id}
            room={room}
            isActive={activeRoomId === room.id}
            isUnlocked={unlockedRooms.includes(room.id)}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}

interface ManorMapProps {
  activeRoomId: string
  unlockedRooms: string[]
}

export function ManorMap({ activeRoomId, unlockedRooms }: ManorMapProps) {
  const t = useTranslations()
  const secondFloor = getRoomsByCategory("Second Floor")
  const groundFloor = getRoomsByCategory("Ground Floor")
  const basement = getRoomsByCategory("Basement")

  return (
    <div className="manor-map space-y-8 rounded-lg p-4 sm:p-6">
      <ManorFloor
        label={t("themes.secondFloor")}
        rooms={secondFloor}
        activeRoomId={activeRoomId}
        unlockedRooms={unlockedRooms}
        t={t}
      />
      <ManorFloor
        label={t("themes.groundFloor")}
        rooms={groundFloor}
        activeRoomId={activeRoomId}
        unlockedRooms={unlockedRooms}
        t={t}
      />
      <ManorFloor
        label={t("themes.basement")}
        rooms={basement}
        activeRoomId={activeRoomId}
        unlockedRooms={unlockedRooms}
        t={t}
      />
    </div>
  )
}
