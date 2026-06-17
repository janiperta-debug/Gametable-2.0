"use client"

import Link from "next/link"
import { ArrowLeft, BookOpen, Home, DoorOpen, Gem, Trophy } from "lucide-react"
import { ArchiveFrame } from "@/components/archive-frame"
import { useTranslation } from "@/lib/i18n"
import type { Localized, RoomThemePage } from "@/lib/room-theme-pages"
import type { ArtifactPage } from "@/lib/artifact-pages"

/**
 * ArtifactPageTemplate — the FIXED artifact-detail template, modeled on the Main
 * Hall artifact mockup. The two crossed-out mockup sections ("In Your Collection"
 * and "The Vault Key Restored") are intentionally omitted.
 *
 * Shared assets (crest, hero, title, artefact name/image/description) are reused
 * from the room's theme page; only artifact-page-unique copy comes from `page`.
 * All copy is bilingual; shared chrome lives in i18n under `themes.artifactPage`.
 *
 * Sections:
 *   Back to Artifacts
 *   → [crest + title + subtitle + hero w/ caption] | [Artefact: name, image, desc]
 *   → [Lore Entry: title, text, note]             | [Unlocks: 5 rows]
 */
export function ArtifactPageTemplate({ theme, page }: { theme: RoomThemePage; page: ArtifactPage }) {
  const { t, locale } = useTranslation()
  const L = (value: Localized) => value[locale] ?? value.en
  const goldText = "text-[var(--archive-gold,#d9b65c)]"

  const title = L(theme.title)

  const unlockRows: { icon: typeof Home; label: string; value: string; muted?: boolean }[] = [
    { icon: Home, label: t("themes.artifactPage.rowTheme"), value: L(page.unlocks.theme) },
    { icon: DoorOpen, label: t("themes.artifactPage.rowRoomAccess"), value: L(page.unlocks.roomAccess) },
    { icon: BookOpen, label: t("themes.artifactPage.rowLore"), value: L(page.unlocks.lore) },
    { icon: Gem, label: t("themes.artifactPage.rowArtefact"), value: L(page.unlocks.artefact) },
    { icon: Trophy, label: t("themes.artifactPage.rowAchievement"), value: L(page.unlocks.achievement), muted: true },
  ]

  return (
    <main className="artifact-cabinet min-h-screen px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back to Artifacts */}
        <Link
          href="/themes?tab=artifacts"
          className={`inline-flex min-h-11 items-center gap-2 font-cinzel text-sm uppercase tracking-wide ${goldText} drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition-opacity hover:opacity-80`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("themes.artifactPage.backToArtifacts")}
        </Link>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left: crest + title + subtitle + hero */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={theme.crest || "/placeholder.svg"}
                alt={`${title} crest`}
                className="h-16 w-auto drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)] sm:h-20"
              />
              <div>
                <h1 className="logo-text text-3xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:text-4xl">
                  {title}
                </h1>
                <p className="font-body mt-1 text-sm uppercase tracking-wide text-foreground/70 text-pretty">
                  {L(page.subtitle)}
                </p>
              </div>
            </div>
            <ArchiveFrame weight="thin" cornerSize="sm" className="overflow-hidden rounded-xl">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[0.4rem]">
                <img
                  src={theme.hero || "/placeholder.svg"}
                  alt={`${title} interior`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <p className="font-body absolute inset-x-0 bottom-0 bg-black/55 p-3 text-sm leading-relaxed text-foreground/90 text-pretty">
                  {L(page.heroCaption)}
                </p>
              </div>
            </ArchiveFrame>
          </div>

          {/* Right: Artefact */}
          <ArchiveFrame className="rounded-xl">
            <div className="flex h-full flex-col items-center justify-center space-y-4 p-5 sm:p-6">
              <h2 className={`text-center font-cinzel text-sm font-bold uppercase tracking-[0.2em] ${goldText}/80`}>
                {t("themes.artifactPage.artefact")}
              </h2>
              <h3 className={`text-center font-cinzel text-2xl font-bold uppercase ${goldText}`}>
                {L(theme.artifact.name)}
              </h3>
              <div className="flex justify-center py-2">
                <img
                  src={theme.artifact.image || "/placeholder.svg"}
                  alt={L(theme.artifact.name)}
                  className="h-44 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
                />
              </div>
              <div className="space-y-1 text-center">
                {theme.artifact.description.map((line, i) => (
                  <p key={i} className="font-body leading-relaxed text-foreground/80 text-pretty">
                    {L(line)}
                  </p>
                ))}
              </div>
            </div>
          </ArchiveFrame>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Lore Entry */}
          <ArchiveFrame className="rounded-xl">
            <div className="space-y-4 p-5 sm:p-6">
              <h2 className={`text-center font-cinzel text-sm font-bold uppercase tracking-[0.2em] ${goldText}/80`}>
                {t("themes.artifactPage.loreEntry")}
              </h2>
              <div className="flex items-center gap-2">
                <BookOpen className={`h-5 w-5 ${goldText}`} aria-hidden="true" />
                <h3 className={`font-cinzel text-lg font-bold uppercase tracking-wide ${goldText}`}>
                  {L(page.lore.title)}
                </h3>
              </div>
              <div className="space-y-2">
                {page.lore.text.map((line, i) => (
                  <p key={i} className="font-body leading-relaxed text-foreground/85 text-pretty">
                    {L(line)}
                  </p>
                ))}
              </div>
              <p className="font-body border-t border-[var(--archive-gold,#d9b65c)]/15 pt-3 text-sm leading-relaxed text-foreground/60 text-pretty">
                {t("themes.artifactPage.loreNote")}
              </p>
            </div>
          </ArchiveFrame>

          {/* Unlocks */}
          <ArchiveFrame className="rounded-xl">
            <div className="space-y-4 p-5 sm:p-6">
              <h2 className={`text-center font-cinzel text-sm font-bold uppercase tracking-[0.2em] ${goldText}/80`}>
                {t("themes.artifactPage.unlocks")}
              </h2>
              <ul className="space-y-3">
                {unlockRows.map((row, i) => {
                  const Icon = row.icon
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-3 border-b border-[var(--archive-gold,#d9b65c)]/15 pb-3 last:border-0 last:pb-0"
                    >
                      <Icon className={`h-5 w-5 flex-none ${goldText}`} aria-hidden="true" />
                      <span className={`font-cinzel text-sm uppercase tracking-wide ${goldText}`}>{row.label}</span>
                      <span
                        className={`font-body ml-auto text-right text-sm ${row.muted ? "text-foreground/45" : "text-foreground/85"}`}
                      >
                        {row.value}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </ArchiveFrame>
        </div>
      </div>
    </main>
  )
}
