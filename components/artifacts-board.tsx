"use client"

import Link from "next/link"
import { ArchiveFrame } from "@/components/archive-frame"
import { useTranslations } from "@/lib/i18n"
import { getArtifactSlots } from "@/lib/artifacts"
import { ARTIFACT_PAGES } from "@/lib/artifact-pages"

const camelId = (id: string) => id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())

interface ArtifactsBoardProps {
  /** Room ids whose artifacts have been earned (their room is unlocked). */
  unlockedRooms: string[]
}

export function ArtifactsBoard({ unlockedRooms }: ArtifactsBoardProps) {
  const t = useTranslations()
  const slots = getArtifactSlots()

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 lg:gap-5">
      {slots.map((slot) => {
        const earned = unlockedRooms.includes(slot.roomId)
        const name = t(`rooms.${camelId(slot.roomId)}.name`) || slot.roomName
        // Earned artifacts whose detail page exists are clickable.
        const href = earned && ARTIFACT_PAGES[slot.roomId] ? `/themes/artifacts/${slot.roomId}` : undefined

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
