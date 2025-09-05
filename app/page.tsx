"use client"

import Link from "next/link"
import { useAppTheme } from "@/components/app-theme-provider"

export default function HomePage() {
  const { currentAppTheme } = useAppTheme()

  const getCrestImage = (theme: string) => {
    const crestMap: { [key: string]: string } = {
      "main-hall": "/images/mainhall-crest-original.png",
      library: "/images/library-crest.png",
      bar: "/images/bar-crest.png",
      "fireside-lounge": "/images/fireside-lounge-crest.png",
      garden: "/images/garden-crest.png",
      conservatory: "/images/conservatory-crest.png",
      gallery: "/images/gallery-crest.png",
      balcony: "/images/balcony-crest.png",
      ballroom: "/images/ballroom-crest.png",
      "map-room": "/images/map-room-crest.png",
      observatory: "/images/observatory-crest.png",
      "theater-room": "/images/theater-room-crest.png",
      "clock-tower": "/images/clock-tower-crest.png",
      "war-room": "/images/war-room-crest.png",
    }
    return crestMap[theme] || crestMap["main-hall"]
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 room-environment">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Manor Crest */}
        <div className="mb-6">
          <img
            src={getCrestImage(currentAppTheme) || "/placeholder.svg"}
            alt="GameTable Manor Crest"
            className="w-24 h-24 md:w-32 md:h-32 mx-auto"
          />
        </div>

        {/* Main title */}
        <h1 className="text-6xl md:text-8xl font-charm ornate-text mb-4">GameTable</h1>

        {/* Decorative line with diamond */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="h-px w-32" style={{ backgroundColor: "hsl(var(--accent-gold))" }}></div>
          <div className="text-lg" style={{ color: "hsl(var(--accent-gold))" }}>
            ♦
          </div>
          <div className="h-px w-32" style={{ backgroundColor: "hsl(var(--accent-gold))" }}></div>
        </div>

        {/* Subtitle */}
        <h2 className="text-2xl md:text-3xl font-cinzel mb-8" style={{ color: "hsl(var(--accent-gold))" }}>
          Welcome to Your Exclusive Gaming Manor
        </h2>

        {/* Description */}
        <p className="text-lg md:text-xl font-merriweather text-foreground max-w-3xl mx-auto leading-relaxed mb-8">
          Step into an elegant sanctuary where tabletop enthusiasts gather to discover remarkable games, forge lasting
          friendships, and create unforgettable gaming experiences.
        </p>

        {/* Establishment line */}
        <div className="flex items-center justify-center space-x-2 mb-12">
          <span style={{ color: "hsl(var(--accent-gold))" }}>♦</span>
          <span className="font-cinzel uppercase tracking-wider text-sm" style={{ color: "hsl(var(--accent-gold))" }}>
            Est. for Distinguished Gaming Society
          </span>
          <span style={{ color: "hsl(var(--accent-gold))" }}>♦</span>
        </div>

        {/* Call to action */}
        <Link
          href="/profile"
          className="inline-block px-8 py-4 font-cinzel text-lg border-2 hover:text-background transition-all duration-300 rounded-lg"
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
          Enter the Manor
        </Link>

        {/* Bottom ornamental elements */}
        <div className="pt-12 space-y-4">
          <div className="text-xl" style={{ color: "hsl(var(--accent-gold))" }}>
            ❦
          </div>
        </div>
      </div>
    </div>
  )
}
