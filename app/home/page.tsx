"use client"

import Image from "next/image"
import { useAppTheme } from "@/components/app-theme-provider"
import { useTranslation } from "@/lib/i18n"
import { getRoomThemePage } from "@/lib/room-theme-pages"

export default function HomePage() {
  const { currentAppTheme } = useAppTheme()
  const { t, locale } = useTranslation()

  // Pull the welcome heading + description from the ACTIVE theme's room page so
  // the home screen always reflects the current room. Falls back to the generic
  // i18n copy for themes that don't have a filled theme page yet.
  const themePage = getRoomThemePage(currentAppTheme)
  const welcomeTitle = themePage ? themePage.title[locale] : t("home.welcome")
  const welcomeDescription =
    themePage?.storyParagraphs[0]?.[locale] ?? t("home.description")

  // Get hero image for current theme (default to main-hall)
  const getHeroImage = (theme: string) => {
    const heroMap: { [key: string]: string } = {
      "main-hall": "/images/themes/main-hall-hero.jpg",
      "library": "/images/heroes/library-hero.jpg",
      "conservatory": "/images/heroes/conservatory-hero.jpg",
      "fireside-lounge": "/images/heroes/fireside-lounge-hero.jpg",
      "spa": "/images/heroes/spa-hero.jpg",
      "bar": "/images/heroes/bar-hero.jpg",
      "gallery": "/images/heroes/gallery-hero.jpg",
      // Add more theme heroes here as they become available
    }
    return heroMap[theme] || "/images/themes/main-hall-hero.jpg"
  }

  return (
    <div className="h-screen flex flex-col px-4 md:px-8 lg:px-16 pt-4 md:pt-6 pb-28 md:pb-32 relative overflow-hidden">
      {/* Full hero background image - no overlay, displayed in full glory */}
      <div className="fixed inset-0 z-0">
        <Image
          src={getHeroImage(currentAppTheme)}
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

        {/* Welcome title - white with shadow for visibility */}
        <h2 
          className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 text-white drop-shadow-lg"
          style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)" }}
        >
          {welcomeTitle}
        </h2>

        {/* Description - pulled from the active theme's room page */}
        <p 
          className="text-base sm:text-lg md:text-xl text-foreground leading-relaxed drop-shadow-lg"
          style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)" }}
        >
          {welcomeDescription}
        </p>
      </div>
    </div>
  )
}
