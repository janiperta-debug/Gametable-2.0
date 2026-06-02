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
    <div className="min-h-screen flex items-center px-4 md:px-8 lg:px-16 relative overflow-hidden">
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

      {/* Content - aligned to the left */}
      <div className="relative z-10 max-w-md lg:max-w-lg">
        {/* New GameTable crest logo */}
        <div className="mb-4 md:mb-6">
          <img
            src="/images/gametable-crest-logo.png"
            alt="GameTable"
            className="w-48 md:w-64 lg:w-72 h-auto"
          />
        </div>

        {/* Welcome title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl mb-3 md:mb-4" style={{ color: "hsl(var(--accent-gold))" }}>
          {t("home.welcome")}
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base md:text-lg text-foreground leading-relaxed">
          {t("home.description")}
        </p>
      </div>
    </div>
  )
}
