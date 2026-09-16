"use client"

import Image from "next/image"
import { useAppTheme } from "@/components/app-theme-provider"
import { useTranslation } from "@/lib/i18n"
import { getRegisteredRoomThemePage, getRoomThemeAssets } from "@/lib/room-page-registry"

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

        {/* Full description - all paragraphs from the active theme's room page */}
        <div className="flex flex-col gap-4">
          {welcomeParagraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-base sm:text-lg md:text-xl text-foreground leading-relaxed drop-shadow-lg"
              style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)" }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
