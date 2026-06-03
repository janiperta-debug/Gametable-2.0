"use client"

import Image from "next/image"
import { useAppTheme } from "@/components/app-theme-provider"
import { useTranslations } from "@/lib/i18n"

export default function HomePage() {
  const { currentAppTheme } = useAppTheme()
  const t = useTranslations()

  // Get hero image for current theme (default to main-hall)
  const getHeroImage = (theme: string) => {
    const heroMap: { [key: string]: string } = {
      "main-hall": "/images/themes/main-hall-hero.jpg",
      "library": "/images/heroes/library-hero.jpg",
      // Add more theme heroes here as they become available
    }
    return heroMap[theme] || "/images/themes/main-hall-hero.jpg"
  }

  // Get crest/logo for current theme
  const getCrestImage = (theme: string) => {
    const crestMap: { [key: string]: string } = {
      "main-hall": "/images/gametable-crest-logo.png",
      "library": "/images/crests/library-crest.png",
      // Add more theme crests here as they become available
    }
    return crestMap[theme] || "/images/gametable-crest-logo.png"
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

      {/* Content - aligned to the left, starting from top */}
      <div className="relative z-10 max-w-lg lg:max-w-xl">
        {/* GameTable crest logo - larger and at top */}
        <div className="mb-4 md:mb-6">
          <img
            src={getCrestImage(currentAppTheme)}
            alt="GameTable"
            className="w-56 md:w-72 lg:w-80 xl:w-96 h-auto"
          />
        </div>

        {/* Welcome title - white with shadow for visibility */}
        <h2 
          className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 text-white drop-shadow-lg"
          style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)" }}
        >
          {t("home.welcome")}
        </h2>

        {/* Description - with shadow for visibility */}
        <p 
          className="text-base sm:text-lg md:text-xl text-foreground leading-relaxed drop-shadow-lg"
          style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)" }}
        >
          {t("home.description")}
        </p>
      </div>
    </div>
  )
}
