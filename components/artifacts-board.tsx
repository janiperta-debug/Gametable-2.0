"use client"

import Link from "next/link"
import { ArchiveFrame } from "@/components/archive-frame"
import { useTranslations } from "@/lib/i18n"
import { getArtifactSlots } from "@/lib/artifacts"
import { getArtifactPage } from "@/lib/artifact-pages"
import { WAR_ROOM_ARTIFACT_PAGE } from "@/lib/war-room-artifact-page"
import { CLOCK_TOWER_ARTIFACT_PAGE } from "@/lib/clock-tower-artifact-page"
import { ALCHEMIST_LABORATORY_ARTIFACT_PAGE } from "@/lib/alchemist-laboratory-artifact-page"
import { isManorRoomCurrentlyUsable } from "@/lib/manor-progression"

const camelId = (id: string) => id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())

export function ArtifactsBoard() {
  const t = useTranslations()
  const slots = getArtifactSlots()

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 lg:gap-5">
      {slots.map((slot) => {
        const earned = isManorRoomCurrentlyUsable(slot.roomId)
        const name = t(`rooms.${camelId(slot.roomId)}.name`) || slot.roomName
        // Earned artifacts whose detail page exists are clickable.
        const page =
          slot.roomId === "war-room"
            ? WAR_ROOM_ARTIFACT_PAGE
            : slot.roomId === "clock-tower"
              ? CLOCK_TOWER_ARTIFACT_PAGE
              : slot.roomId === "alchemist-laboratory"
                ? ALCHEMIST_LABORATORY_ARTIFACT_PAGE
                : getArtifactPage(slot.roomId)
        const href = earned && page ? `/themes/artifacts/${slot.roomId}` : undefined

        const artwork = earned ? (
          <img
            src={slot.image || "/placeholder.svg"}
            alt={name}
            loading="lazy"
            className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
            title={name}
          />
        ) : (
          <span className="sr-only">{`${name} — ${t("themes.locked") || "Locked"}`}</span>
        )

        return (
          <ArchiveFrame key={slot.roomId} weight="thin" cornerSize="sm" className="rounded-lg">
            {href ? (
              <Link
                href={href}
                aria-label={name}
                className="relative flex aspect-square items-center justify-center p-2 transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--archive-gold,#d9b65c)]"
              >
                {artwork}
              </Link>
            ) : (
              <div className="relative flex aspect-square items-center justify-center p-2">{artwork}</div>
            )}
          </ArchiveFrame>
        )
      })}
    </div>
  )
}
