"use client"

import type React from "react"
import { useMemo, useRef } from "react"
import { useAppTheme } from "@/components/app-theme-provider"
import { getPageHeroCandidates } from "@/lib/theme-assets"

/**
 * ThemeHero — per-page, per-theme hero IMAGE that replaces a page's old text
 * header block.
 *
 * Modes:
 *  - "banner"   : centered title/subtitle over the image (default; for pages
 *                 that still want a headline rendered on the hero).
 *  - "backdrop" : the image is purely a background spanning ALL children, with
 *                 no overlaid title. Used by the collection page so the hero
 *                 reaches from the top down past the page controls. The page's
 *                 own headings (e.g. "Kokoelmani") render normally on top.
 *
 * The image source is resolved from lib/theme-assets. Because a 404 can't be
 * detected at SSR time, an onError handler walks the remaining candidate paths
 * so a missing per-page hero degrades to the theme's main hero, then to a
 * known-good image.
 */

interface ThemeHeroProps {
  /** Page key used to resolve /images/heroes/{page}/{theme}.jpg */
  page: string
  mode?: "banner" | "backdrop"
  title?: string
  subtitle?: string
  /** Content rendered inside the hero (a toggle in banner mode, the whole header block in backdrop mode). */
  children?: React.ReactNode
  className?: string
}

export function ThemeHero({ page, mode = "banner", title, subtitle, children, className }: ThemeHeroProps) {
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

  // Backdrop mode: the hero image is a FIXED layer pinned to the top of the
  // viewport, scaled to the FULL page WIDTH at its natural aspect ratio (no
  // crop). Below the image, the layer is transparent so the page's background
  // color/gradient continues. The image stays stationary while page content
  // scrolls over it. No scrim/overlay — shown as-is. It sits at -z-10 (in front
  // of the page gradient, behind all in-flow content).
  if (mode === "backdrop") {
    return (
      <>
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 -z-10">
          <img
            src={candidates[0] || "/placeholder.svg"}
            alt=""
            onError={handleError}
            className="block h-auto w-full"
          />
        </div>
        <div className={"relative z-10 mb-8 px-1 py-8 sm:px-2 " + (className ?? "")}>{children}</div>
      </>
    )
  }

  return (
    <section
      className={
        "relative -mx-4 mb-8 overflow-hidden rounded-b-2xl border-b border-accent-gold/30 shadow-lg " + (className ?? "")
      }
    >
      {/* Hero image */}
      <img
        src={candidates[0] || "/placeholder.svg"}
        alt=""
        aria-hidden="true"
        onError={handleError}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Legibility scrim — darkens so gold text/controls read cleanly over the image */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/45 to-background/90" />

      <div className="relative z-10 flex min-h-[200px] flex-col items-center justify-center px-4 py-10 text-center sm:min-h-[240px] md:min-h-[280px]">
        {title ? (
          <h1 className="logo-text text-4xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:text-5xl text-balance">
            {title}
          </h1>
        ) : null}
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
