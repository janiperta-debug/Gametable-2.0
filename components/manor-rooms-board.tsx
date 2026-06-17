"use client"

import Link from "next/link"
import { ArchiveFrame } from "@/components/archive-frame"

// First 7 grid slots show room images; every other slot shows a lock.
// Slots with an `href` are clickable and open that room's theme page.
const ROOM_SLOTS: { src: string; href?: string }[] = [
  { src: "/themes/rooms/room-1.png" },
  { src: "/themes/rooms/room-2.png" },
  { src: "/themes/rooms/room-3.png" },
  { src: "/themes/rooms/room-4.png" },
  { src: "/themes/rooms/room-5.png" },
  { src: "/themes/rooms/room-6.png" },
  // Main Hall staircase — opens the Main Hall theme page.
  { src: "/themes/rooms/room-7.png", href: "/themes/main-hall" },
]

// Total number of grid slots (matches the artifacts board layout).
const TOTAL_SLOTS = 19

export function ManorRoomsBoard() {
  const slots = Array.from(
    { length: TOTAL_SLOTS },
    (_, i) => ROOM_SLOTS[i] ?? { src: "/themes/rooms/lock.png" },
  )

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 lg:gap-5">
      {slots.map((slot, i) => {
        const tile = (
          <ArchiveFrame weight="thin" cornerSize="sm" className="rounded-lg">
            <div className="relative flex aspect-square items-center justify-center p-2">
              <img
                src={slot.src || "/placeholder.svg"}
                alt=""
                loading="lazy"
                className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
              />
            </div>
          </ArchiveFrame>
        )

        if (slot.href) {
          return (
            <Link
              key={i}
              href={slot.href}
              aria-label="Main Hall"
              className="block rounded-lg transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--archive-gold,#d9b65c)]"
            >
              {tile}
            </Link>
          )
        }

        return <div key={i}>{tile}</div>
      })}
    </div>
  )
}
