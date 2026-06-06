"use client"

import type React from "react"
import { useMemo, useRef } from "react"
import { useAppTheme } from "@/components/app-theme-provider"
import { getPageHeroCandidates } from "@/lib/theme-assets"

/**
 * ThemeHero — per-page, per-theme hero banner that REPLACES a page's old text
 * header block. Shows the page title once over a themed image, removing the
 * previous duplicated headings (e.g. collection's "Pelikokoelma" + "Kokoelmani").
 *
 * The image source is resolved from lib/theme-assets. Because a 404 can't be
 * detected at SSR time, we attach an onError handler that walks the remaining
 * candidate paths so a missing per-page hero gracefully degrades to the theme's
 * main hero, then to a known-good image.
 */

interface ThemeHeroProps {
  /** Page key used to resolve /images/heroes/{page}/{theme}.jpg */
  page: string
  title: string
  subtitle?: string
  /** Optional content rendered below the title inside the hero (e.g. a toggle). */
  children?: React.ReactNode
}

export function ThemeHero({ page, title, subtitle, children }: ThemeHeroProps) {
  const { currentAppTheme } = useAppTheme()
  const candidates = useMemo(() => getPageHeroCandidates(page, currentAppTheme), [page, currentAppTheme])
  const idxRef = useRef(0)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (idxRef.current < candidates.length - 1) {
      idxRef.current += 1
      img.src = candidates[idxRef.current]
    }
  }

  return (
    <section className="relative -mx-4 mb-8 overflow-hidden rounded-b-2xl border-b border-accent-gold/30 shadow-lg">
      {/* Hero image */}
      <img
        src={candidates[0] || "/placeholder.svg"}
        alt=""
        aria-hidden="true"
        onError={handleError}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Legibility scrim — darkens edges and bottom so gold text reads cleanly */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/30 to-background/85" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[200px] flex-col items-center justify-center px-4 py-10 text-center sm:min-h-[240px] md:min-h-[280px]">
        <h1 className="logo-text text-4xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:text-5xl text-balance">
          {title}
        </h1>
        {subtitle ? (
          <p className="font-body mt-3 max-w-2xl text-base text-foreground/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] sm:text-lg text-pretty">
            {subtitle}
          </p>
        ) : null}
        {children ? <div className="mt-6 w-full">{children}</div> : null}
      </div>
    </section>
  )
}
