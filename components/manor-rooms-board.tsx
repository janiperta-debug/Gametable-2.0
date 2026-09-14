"use client"

import Link from "next/link"
import { ArchiveFrame } from "@/components/archive-frame"

// First-floor rooms followed by the second-floor preview rooms and the
// five basement preview slots. Basement rooms become linked when their
// dedicated preview pages are implemented.
const ROOM_SLOTS: { src: string; href?: string; label?: string }[] = [
  // First floor
  { src: "/themes/rooms/room-1.png", href: "/themes/gallery", label: "Gallery" },
  { src: "/themes/rooms/room-2.png", href: "/themes/spa", label: "Spa" },
  { src: "/themes/rooms/room-3.png", href: "/themes/bar", label: "Bar" },
  { src: "/themes/rooms/room-4.png", href: "/themes/conservatory", label: "Conservatory" },
  { src: "/themes/rooms/room-5.png", href: "/themes/fireside-lounge", label: "Fireside Lounge" },
  { src: "/themes/rooms/room-6.png", href: "/themes/library", label: "Library" },
  { src: "/themes/rooms/room-7.png", href: "/themes/main-hall", label: "Main Hall" },

  // Second floor — preview mode
  { src: "/themes/ballroom-preview.png", href: "/themes/ballroom", label: "Ballroom" },
  { src: "/themes/map-room-preview.png", href: "/themes/map-room", label: "Map Room" },
  { src: "/themes/observatory-preview.png", href: "/themes/observatory", label: "Observatory" },
  { src: "/themes/theater-preview.png", href: "/themes/theater-room", label: "Theater Room" },
  { src: "/themes/clock-tower-preview.png", href: "/themes/clock-tower", label: "Clock Tower" },
  { src: "/themes/war-room-preview.png", href: "/themes/war-room", label: "War Room" },
  { src: "/themes/art-room-preview.png", href: "/themes/artroom", label: "Art Room" },

  // Basement — preview tiles, awaiting dedicated room pages
  { src: "/themes/alchemist-laboratory-preview.png", label: "Alchemist Laboratory" },
  { src: "/themes/dungeon-preview.png", label: "Dungeon" },
  { src: "/themes/underground-temple-preview.png", label: "Underground Temple" },
  { src: "/themes/crystal-cave-preview.png", label: "Crystal Cave" },
  { src: "/themes/treasure-vault-preview.png", label: "Treasure Vault" },
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
              aria-label={slot.label ?? "Room"}
              className="block rounded-lg transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--archive-gold,#d9b65c)]"
            >
              {tile}
            </Link>
          )
        }

        return (
          <div key={i} aria-label={slot.label ?? "Room preview"}>
            {tile}
          </div>
        )
      })}
    </div>
  )
}
