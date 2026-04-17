"use client"

import Link from "next/link"
import Image from "next/image"
import { useAppTheme } from "@/components/app-theme-provider"
import { useTranslations } from "@/lib/i18n"
import { getRoomTheme } from "@/lib/room-themes"

export default function HomePage() {
  const { currentAppTheme } = useAppTheme()
  const t = useTranslations()

  const getHomeCrestImage = (theme: string) => {
    // Larger decorative crests for homepage hero
    const homeCrestMap: { [key: string]: string } = {
      "main-hall": "/crests/main-hall-home.png",
      library: "/images/library-crest.png",
      bar: "/images/bar-crest.png",
      "fireside-lounge": "/images/fireside-lounge-crest.png",
      spa: "/crests/spa-crest.png",
      conservatory: "/images/conservatory-crest.png",
      gallery: "/images/gallery-crest.png",
      artroom: "/crests/artroom-crest.png",
      ballroom: "/images/ballroom-crest.png",
      "map-room": "/images/map-room-crest.png",
      observatory: "/images/observatory-crest.png",
      "theater-room": "/images/theater-room-crest.png",
      "clock-tower": "/images/clock-tower-crest.png",
      "war-room": "/images/war-room-crest.png",
      "alchemist-laboratory": "/crests/alchemist-crest.png",
      dungeon: "/crests/dungeon-crest.png",
      "underground-temple": "/crests/temple-crest.png",
      "crystal-cavern": "/crests/crystal-crest.png",
      "treasure-vault": "/crests/treasure-crest.png",
    }
    // For now, only main-hall has a dedicated home crest, others fall back to nav crest
    return homeCrestMap[theme] || "/crests/main-hall-home.png"
  }

  // Get theme background image
  const themeData = getRoomTheme(currentAppTheme)
  const backgroundImage = themeData?.image || "/themes/main-hall-preview.png"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-8 relative overflow-hidden">
      {/* Theme background image - extends behind navigation */}
      <div className="fixed inset-0 z-0">
        <Image
          src={backgroundImage}
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay gradient for text readability */}
        <div 
          className="absolute inset-0" 
          style={{ 
            background: "linear-gradient(180deg, rgba(61,21,21,0.6) 0%, rgba(42,15,15,0.75) 50%, rgba(26,8,8,0.9) 100%)" 
          }} 
        />
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8 relative z-10">
        {/* Manor Crest - Full decorative crest with GameTable text included */}
        <div className="mb-6 md:mb-8">
          <img
            src={getHomeCrestImage(currentAppTheme) || "/placeholder.svg"}
            alt="GameTable Manor Crest"
            className="w-64 h-auto md:w-80 lg:w-96 mx-auto"
          />
        </div>

        {/* Decorative line with diamond */}
        <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-4 md:mb-6">
          <div className="h-px w-16 md:w-32" style={{ backgroundColor: "hsl(var(--accent-gold))" }}></div>
          <div className="text-base md:text-lg" style={{ color: "hsl(var(--accent-gold))" }}>
            &#9670;
          </div>
          <div className="h-px w-16 md:w-32" style={{ backgroundColor: "hsl(var(--accent-gold))" }}></div>
        </div>

        {/* Subtitle */}
        <h2 className="text-xl sm:text-2xl md:text-3xl mb-6 md:mb-8 px-4" style={{ color: "hsl(var(--accent-gold))" }}>
          {t("home.welcome")}
        </h2>

        {/* Description */}
        <p className="text-base sm:text-lg md:text-xl text-foreground max-w-3xl mx-auto leading-relaxed mb-6 md:mb-8 px-4">
          {t("home.description")}
        </p>

        {/* Establishment line */}
        <div className="flex items-center justify-center space-x-2 mb-8 md:mb-12 px-4">
          <span style={{ color: "hsl(var(--accent-gold))" }}>&#9670;</span>
          <span
            className="uppercase tracking-wider text-xs sm:text-sm text-center"
            style={{ color: "hsl(var(--accent-gold))" }}
          >
            {t("home.established")}
          </span>
          <span style={{ color: "hsl(var(--accent-gold))" }}>&#9670;</span>
        </div>

        {/* Call to action */}
        <Link
          href="/profile"
          className="inline-block px-6 py-3 md:px-8 md:py-4 text-base md:text-lg border-2 hover:text-background transition-all duration-300 rounded-lg"
          style={{
            color: "hsl(var(--accent-gold))",
            borderColor: "hsl(var(--accent-gold))",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--accent-gold))"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          {t("home.enterManor")}
        </Link>

        {/* Bottom ornamental elements */}
        <div className="pt-8 md:pt-12 space-y-4">
          <div className="text-lg md:text-xl" style={{ color: "hsl(var(--accent-gold))" }}>
            &#10086;
          </div>
        </div>
      </div>
    </div>
  )
}
