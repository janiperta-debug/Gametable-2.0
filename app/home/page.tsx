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
      // Add more theme heroes here as they become available
    }
    return heroMap[theme] || "/images/themes/main-hall-hero.jpg"
  }

  return (
    <div className="min-h-screen flex flex-col px-4 md:px-8 lg:px-16 pt-4 md:pt-6 pb-32 md:pb-36 relative overflow-hidden">
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
            src="/images/gametable-crest-logo.png"
            alt="GameTable"
            className="w-56 md:w-72 lg:w-80 xl:w-96 h-auto"
          />
        </div>

        {/* Welcome title */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4" style={{ color: "hsl(var(--accent-gold))" }}>
          {t("home.welcome")}
        </h2>

        {/* Description */}
        <p className="text-base sm:text-lg md:text-xl text-foreground leading-relaxed">
          {t("home.description")}
        </p>
      </div>
    </div>
  )
}
