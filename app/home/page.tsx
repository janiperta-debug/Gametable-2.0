"use client"

import Image from "next/image"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useAppTheme } from "@/components/app-theme-provider"
import { useTranslation } from "@/lib/i18n"
import { getRegisteredRoomThemePage, getRoomThemeAssets } from "@/lib/room-page-registry"
import { useState } from "react"
import { ArchiveFrame } from "@/components/archive-frame"

export default function HomePage() {
  const { currentAppTheme } = useAppTheme()
  const { t, locale } = useTranslation()
  const [descriptionOpen, setDescriptionOpen] = useState(true)

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
        >
          {descriptionOpen ? (
            <div className="relative">
              <div className="max-h-[42vh] overflow-y-auto px-5 py-4 pr-14 sm:px-6 sm:py-5 sm:pr-16">
                <div className="flex flex-col gap-3">
                  {welcomeParagraphs.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-base leading-relaxed text-foreground sm:text-lg md:text-xl"
                        >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDescriptionOpen(false)}
                aria-label={locale === "fi" ? "Piilota kuvaus" : "Hide description"}
                title={locale === "fi" ? "Piilota kuvaus" : "Hide description"}
                className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--archive-gold,#d9b65c)]/60 bg-black/35 text-[var(--archive-gold,#d9b65c)] backdrop-blur-sm transition-colors hover:bg-[var(--archive-gold,#d9b65c)]/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--archive-gold,#d9b65c)]"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDescriptionOpen(true)}
              aria-label={locale === "fi" ? "Näytä kuvaus" : "Show description"}
              title={locale === "fi" ? "Näytä kuvaus" : "Show description"}
              className="flex w-full items-center justify-center gap-2 px-4 py-2.5 font-cinzel text-xs font-bold uppercase tracking-[0.16em] text-[var(--archive-gold,#d9b65c)] transition-colors hover:bg-[var(--archive-gold,#d9b65c)]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--archive-gold,#d9b65c)]"
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              {locale === "fi" ? "Näytä kuvaus" : "Show description"}
            </button>
          )}
        </ArchiveFrame>
      </div>
    </div>
  )
}
