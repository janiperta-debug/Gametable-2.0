"use client"

import Image from "next/image"
import type React from "react"
import { useAppTheme } from "@/components/app-theme-provider"
import { useTranslation } from "@/lib/i18n"
import { getRegisteredRoomThemePage, getRoomThemeAssets } from "@/lib/room-page-registry"
import { ArchiveFrame } from "@/components/archive-frame"

export default function HomePage() {
  const { currentAppTheme } = useAppTheme()
  const { t, locale } = useTranslation()

  // Pull the full description and hero image from the ACTIVE theme's room page
  // so the home screen always reflects the current room. Falls back to the
  // generic i18n copy and the centralized placeholder asset for incomplete data.
  const themePage = getRegisteredRoomThemePage(currentAppTheme)
  const welcomeParagraphs =
    themePage?.storyParagraphs.map((p) => p[locale]) ?? [t("home.description")]
  const heroImage = getRoomThemeAssets(currentAppTheme).hero

  return (
    <div className="h-screen flex flex-col px-4 md:px-8 lg:px-16 pt-[62px] md:pt-6 pb-28 md:pb-32 relative overflow-hidden">
      {/* Full hero background image - no overlay, displayed in full glory */}
      <div className="fixed inset-0 z-0">
        <Image
          src={heroImage}
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content - centered on mobile, left-aligned on tablet/desktop */}
      <div className="relative z-10 max-w-lg lg:max-w-xl mx-auto md:mx-0 text-center md:text-left">
        {/* GameTable universal text logo */}
        <div className="mb-4 md:mb-6 flex justify-center md:justify-start">
          <img
            src="/images/gametable-text-logo.png"
            alt="GameTable"
            className="w-80 md:w-[28rem] lg:w-[30rem] xl:w-[36rem] h-auto"
          />
        </div>

        {/* Full description - framed over the active theme hero for stable contrast */}
        <ArchiveFrame
          weight="thin"
          cornerSize="sm"
          className="max-w-full rounded-xl"
          style={{
            "--archive-wood-base": "rgba(24, 12, 7, 0.68)",
            "--archive-wood-top": "rgba(18, 9, 5, 0.58)",
            "--archive-wood-mid": "rgba(52, 29, 15, 0.52)",
            "--archive-wood-bottom": "rgba(16, 8, 4, 0.62)",
            "--archive-surface-sheen": "rgba(255, 225, 180, 0.06)",
            "--archive-surface-shade": "rgba(0, 0, 0, 0.24)",
          } as React.CSSProperties}
        >
          <div className="max-h-[42vh] overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3">
              {welcomeParagraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-base leading-relaxed text-foreground sm:text-lg md:text-xl"
                  style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.55)" }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </ArchiveFrame>
      </div>
    </div>
  )
}
