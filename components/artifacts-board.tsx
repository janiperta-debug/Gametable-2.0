"use client"

import { ArchiveFrame } from "@/components/archive-frame"
import { useTranslations } from "@/lib/i18n"
import { getArtifactSlots } from "@/lib/artifacts"

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

        return (
          <ArchiveFrame key={slot.roomId} weight="thin" cornerSize="sm" className="rounded-lg">
            <div className="relative flex aspect-square items-center justify-center p-2">
              {earned ? (
                <img
                  src={slot.image || "/placeholder.svg"}
                  alt={name}
                  loading="lazy"
                  className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
                  title={name}
                />
              ) : (
                <span className="sr-only">{`${name} — ${t("themes.locked") || "Locked"}`}</span>
              )}
            </div>
          </ArchiveFrame>
        )
      })}
    </div>
  )
}
