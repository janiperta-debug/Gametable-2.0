"use client"

import Link from "next/link"
import { ArchiveFrame } from "@/components/archive-frame"
import { useUser } from "@/hooks/useUser"
import {
  canUnlockManorRoom,
  isManorRoomUnlocked,
} from "@/lib/manor-progression"
import { THEME_ACCESS_TEST_MODE } from "@/lib/manor-progression"

// The board is the visual 19-room Manor map. Entitlement state comes from the
// canonical Manor progression helpers; the QA switch intentionally keeps every
// room usable while visual verification is in progress.
const ROOM_SLOTS: {
  src: string
  href: string
  roomId: string
  label: string
}[] = [
  // First floor
  { src: "/themes/rooms/room-1.png", href: "/themes/gallery", roomId: "gallery", label: "Gallery" },
  { src: "/themes/rooms/room-2.png", href: "/themes/spa", roomId: "spa", label: "Spa" },
  { src: "/themes/rooms/room-3.png", href: "/themes/bar", roomId: "bar", label: "Bar" },
  { src: "/themes/rooms/room-4.png", href: "/themes/conservatory", roomId: "conservatory", label: "Conservatory" },
  { src: "/themes/rooms/room-5.png", href: "/themes/fireside-lounge", roomId: "fireside-lounge", label: "Fireside Lounge" },
  { src: "/themes/rooms/room-6.png", href: "/themes/library", roomId: "library", label: "Library" },
  { src: "/themes/rooms/room-7.png", href: "/themes/main-hall", roomId: "main-hall", label: "Main Hall" },

  // Second floor
  { src: "/themes/rooms/room-8.png", href: "/themes/ballroom", roomId: "ballroom", label: "Ballroom" },
  { src: "/themes/rooms/room-9.png", href: "/themes/map-room", roomId: "map-room", label: "Map Room" },
  { src: "/themes/rooms/room-10.png", href: "/themes/observatory", roomId: "observatory", label: "Observatory" },
  { src: "/themes/rooms/room-11.png", href: "/themes/theater-room", roomId: "theater-room", label: "Theater Room" },
  { src: "/themes/rooms/room-12.png", href: "/themes/clock-tower", roomId: "clock-tower", label: "Clock Tower" },
  { src: "/themes/rooms/room-13.png", href: "/themes/war-room", roomId: "war-room", label: "War Room" },
  { src: "/themes/rooms/room-14.png", href: "/themes/artroom", roomId: "artroom", label: "Art Room" },

  // Basement
  { src: "/themes/rooms/room-15.png", href: "/themes/alchemist-laboratory", roomId: "alchemist-laboratory", label: "Alchemist Laboratory" },
  { src: "/themes/rooms/room-16.png", href: "/themes/dungeon", roomId: "dungeon", label: "Dungeon" },
  { src: "/themes/rooms/room-17.png", href: "/themes/underground-temple", roomId: "underground-temple", label: "Underground Temple" },
  { src: "/themes/rooms/room-18.png", href: "/themes/crystal-cavern", roomId: "crystal-cavern", label: "Crystal Cavern" },
  { src: "/themes/rooms/room-19.png", href: "/themes/treasure-vault", roomId: "treasure-vault", label: "Treasure Vault" },
]

export function ManorRoomsBoard() {
  const { profile } = useUser()

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 lg:gap-5">
      {ROOM_SLOTS.map((slot) => {
        const isUnlocked =
          THEME_ACCESS_TEST_MODE ||
          isManorRoomUnlocked(slot.roomId, profile)

        const canUnlock =
          !THEME_ACCESS_TEST_MODE &&
          canUnlockManorRoom(slot.roomId, profile)

        const isAccessible = isUnlocked || canUnlock

        const tile = (
          <ArchiveFrame weight="thin" cornerSize="sm" className="rounded-lg">
            <div
              className={`relative flex aspect-square items-center justify-center p-2 ${
                isAccessible
                  ? ""
                  : "opacity-60 grayscale-[0.35]"
              }`}
            >
              <img
                src={slot.src}
                alt=""
                loading="lazy"
                className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
              />

              {!isAccessible && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/35"
                >
                  <span className="text-xl drop-shadow-md" aria-hidden="true">
                    🔒
                  </span>
                </div>
              )}

              {canUnlock && (
                <div
                  aria-hidden="true"
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-[var(--archive-gold,#d9b65c)] bg-black/75 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--archive-gold,#d9b65c)]"
                >
                  Unlock
                </div>
              )}
            </div>
          </ArchiveFrame>
        )

        if (isAccessible) {
          return (
            <Link
              key={slot.roomId}
              href={slot.href}
              aria-label={
                canUnlock
                  ? `${slot.label} — unlock`
                  : slot.label
              }
              className="block rounded-lg transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--archive-gold,#d9b65c)]"
            >
              {tile}
            </Link>
          )
        }

        return (
          <div
            key={slot.roomId}
            aria-label={`${slot.label} — locked`}
            aria-disabled="true"
            className="block rounded-lg"
          >
            {tile}
          </div>
        )
      })}
    </div>
  )
}
