"use client"

import { ArchiveFrame } from "@/components/archive-frame"

// First 7 grid slots show room images; every other slot shows a lock.
const ROOM_IMAGES = [
  "/themes/rooms/room-1.png",
  "/themes/rooms/room-2.png",
  "/themes/rooms/room-3.png",
  "/themes/rooms/room-4.png",
  "/themes/rooms/room-5.png",
  "/themes/rooms/room-6.png",
  "/themes/rooms/room-7.png",
]

// Total number of grid slots (matches the artifacts board layout).
const TOTAL_SLOTS = 19

export function ManorRoomsBoard() {
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => ROOM_IMAGES[i] ?? "/themes/rooms/lock.png")

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 lg:gap-5">
      {slots.map((src, i) => (
        <ArchiveFrame key={i} weight="thin" cornerSize="sm" className="rounded-lg">
          <div className="relative flex aspect-square items-center justify-center p-2">
            <img
              src={src || "/placeholder.svg"}
              alt=""
              loading="lazy"
              className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
            />
          </div>
        </ArchiveFrame>
      ))}
    </div>
  )
}
