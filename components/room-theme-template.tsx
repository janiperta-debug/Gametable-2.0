"use client"

import Link from "next/link"
import { ArrowLeft, Check, Lock } from "lucide-react"
import { ArchiveFrame } from "@/components/archive-frame"
import { useTranslation } from "@/lib/i18n"
import { useAppTheme, type AppThemeName } from "@/components/app-theme-provider"
import { getRoomTheme } from "@/lib/room-themes"
import type { Localized, RoomThemePage } from "@/lib/room-theme-pages"

/** Floor → roman level shown in the status badge (the floor gates progression). */
const FLOOR_LEVEL: Record<string, string> = {
  "Ground Floor": "I",
  "Second Floor": "II",
  Basement: "III",
}

/**
 * RoomThemeTemplate — the FIXED theme-page template, modeled on the Bar mockup
 * (the only mockup that includes an Artefact section). Every room reuses this
 * exact structure; only the data changes (see lib/room-theme-pages.ts).
 *
 * All room copy is bilingual ({ fi, en }) and resolved here via the active
 * locale; shared chrome ("Back to Map", "The Essence", …) comes from the i18n
 * JSON under `themes.roomPage`.
 *
 * Sections (top → bottom):
 *   Back to Map → crest + title + tagline + hero
 *   → story + The Essence | Your Journey in This Room (10 steps)
 *   → A Glimpse Inside (3 images)
 *   → Artefact + What Unlocks
 *   → footer band
 */
export function RoomThemeTemplate({ data }: { data: RoomThemePage }) {
  const { t, locale } = useTranslation()
  const { currentAppTheme, setAppTheme } = useAppTheme()
  const L = (value: Localized) => value[locale] ?? value.en
  const goldText = "text-[var(--archive-gold,#d9b65c)]"

  const title = L(data.title)

  // The 3 "Glimpse Inside" images are always the room's Collection / Events /
  // Community heroes, so their labels are FIXED section names (not per-room
  // data) to match the rest of the app's navigation.
  const glimpseLabels = [
    t("themes.roomPage.glimpseCollection"),
    t("themes.roomPage.glimpseEvents"),
    t("themes.roomPage.glimpseCommunity"),
  ]

  // Theme status for this room: active (in use) / unlocked (available) / locked.
  const roomTheme = getRoomTheme(data.id)
  const isActive = currentAppTheme === data.id
  const isUnlocked = roomTheme?.isUnlocked ?? false
  const level = roomTheme ? FLOOR_LEVEL[roomTheme.category] ?? "I" : "I"

  return (
    // data-theme scopes the ArchiveFrame palette to a live PREVIEW of this
    // room's theme (metal + wood tones) without changing the global app theme.
    <main
      data-theme={data.id as AppThemeName}
      className="artifact-cabinet min-h-screen px-3 py-5 sm:px-6 sm:py-8"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back to Map */}
        <Link
          href="/themes"
          className="inline-flex min-h-11 items-center gap-2 font-cinzel text-sm uppercase tracking-wide text-[var(--archive-gold-bright,#d9b65c)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition-opacity hover:opacity-80"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("themes.roomPage.backToMap")}
        </Link>

        {/* Hero (no frame) with crest + title + tagline overlaid */}
        <header className="relative overflow-hidden rounded-xl">
          <div className="relative aspect-[16/10] w-full sm:aspect-[16/7]">
            <img
              src={data.hero || "/placeholder.svg"}
              alt={`${title} interior`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Legibility gradient under the overlaid crest/title/tagline */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent"
              aria-hidden="true"
            />
            {/* crest + title + tagline, grouped and centered within the hero's
                left third (both axes). */}
            <div className="absolute inset-y-0 left-0 flex w-2/5 flex-col items-center justify-center gap-2 p-3 text-center sm:w-1/3 sm:p-5">
              <img
                src={data.crest || "/placeholder.svg"}
                alt={`${title} crest`}
                className="h-16 w-fit max-w-full object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)] sm:h-24"
              />
              <h1 className="logo-text text-center text-2xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] sm:text-4xl">
                {title}
              </h1>
              <p className="font-body text-center text-sm text-pretty italic text-foreground/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] sm:text-base">
                {L(data.tagline)}
              </p>
            </div>
          </div>
        </header>

        {/* Theme status band — active / unlocked / locked + floor level badge */}
        <ArchiveFrame weight="thin" cornerSize="sm" className="rounded-xl">
          <div className="flex flex-wrap items-center gap-3 p-4 sm:gap-4">
            <span
              className={`flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[var(--archive-gold,#d9b65c)]/50 ${goldText}`}
              aria-hidden="true"
            >
              {isActive ? <Check className="h-5 w-5" /> : isUnlocked ? <Check className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-cinzel text-sm font-bold uppercase tracking-wide ${goldText}`}>
                {isActive
                  ? t("themes.roomPage.themeActive")
                  : isUnlocked
                    ? t("themes.roomPage.themeUnlocked")
                    : t("themes.roomPage.themeLocked")}
              </p>
              <p className="font-body text-sm leading-snug text-[var(--archive-ink-soft)] text-pretty">
                {isActive
                  ? t("themes.roomPage.themeActiveDesc")
                  : isUnlocked
                    ? t("themes.roomPage.themeUnlockedDesc")
                    : t("themes.roomPage.themeLockedDesc")}
              </p>
            </div>
            <span
              className={`flex-none rounded-md border border-[var(--archive-gold,#d9b65c)]/40 px-2.5 py-1 font-cinzel text-xs font-bold uppercase tracking-wide ${goldText}`}
            >
              {`${t("themes.roomPage.levelLabel")} ${level}`}
            </span>
            {isActive ? (
              <span
                className={`flex-none inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--archive-gold,#d9b65c)]/50 bg-[var(--archive-gold,#d9b65c)]/15 px-3 font-cinzel text-xs font-bold uppercase tracking-wide ${goldText}`}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {t("themes.roomPage.inUse")}
              </span>
            ) : isUnlocked ? (
              <button
                type="button"
                onClick={() => setAppTheme(data.id as AppThemeName)}
                className={`flex-none inline-flex min-h-9 items-center rounded-md border border-[var(--archive-gold,#d9b65c)]/60 px-3 font-cinzel text-xs font-bold uppercase tracking-wide ${goldText} transition-colors hover:bg-[var(--archive-gold,#d9b65c)]/15`}
              >
                {t("themes.roomPage.useTheme")}
              </button>
            ) : null}
          </div>
        </ArchiveFrame>

        {/* Story + Essence | Journey */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Story column */}
          <ArchiveFrame className="rounded-xl">
            <div className="space-y-5 p-5 sm:p-6">
              <h2 className={`font-cinzel text-xl font-bold uppercase tracking-wide ${goldText}`}>
                {L(data.storyTitle)}
              </h2>
              <div className="space-y-4">
                {data.storyParagraphs.map((p, i) => (
                  <p key={i} className="font-body leading-relaxed text-[var(--archive-ink-strong)] text-pretty">
                    {L(p)}
                  </p>
                ))}
              </div>
              {/* The Essence */}
              <div className="rounded-lg border border-[var(--archive-gold,#d9b65c)]/30 bg-[var(--archive-inset-bg)] p-4">
                <h3 className={`font-cinzel text-sm font-bold uppercase tracking-wide ${goldText}`}>
                  {t("themes.roomPage.essence")}
                </h3>
                <p className={`font-body mt-1 italic ${goldText}/90`}>{L(data.essenceTagline)}</p>
                <div className="mt-2 space-y-1">
                  {data.essenceText.map((line, i) => (
                    <p key={i} className="font-body leading-relaxed text-[var(--archive-ink-soft)] text-pretty">
                      {L(line)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </ArchiveFrame>

          {/* Journey column */}
          <ArchiveFrame className="rounded-xl">
            <div className="space-y-4 p-5 sm:p-6">
              <h2 className={`font-cinzel text-xl font-bold uppercase tracking-wide ${goldText}`}>
                {t("themes.roomPage.journey")}
              </h2>
              <ol className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                {data.journey.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border border-[var(--archive-gold,#d9b65c)]/50 font-cinzel text-sm font-bold ${goldText}`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className={`font-cinzel text-sm font-semibold ${goldText}`}>{L(step.title)}</p>
                      <p className="font-body text-sm leading-snug text-[var(--archive-ink-soft)] text-pretty">
                        {L(step.description)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </ArchiveFrame>
        </div>

        {/* A Glimpse Inside */}
        <ArchiveFrame className="rounded-xl">
          <div className="space-y-4 p-5 sm:p-6">
            <h2 className={`text-center font-cinzel text-xl font-bold uppercase tracking-wide ${goldText}`}>
              {t("themes.roomPage.glimpse")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {data.glimpses.map((g, i) => (
                <figure key={i} className="space-y-2">
                  <div className="overflow-hidden rounded-lg border border-[var(--archive-gold,#d9b65c)]/30">
                    <div className="relative aspect-[4/3] w-full">
                      <img
                        src={g.image || "/placeholder.svg"}
                        alt={glimpseLabels[i] ?? L(g.caption)}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <figcaption className={`text-center font-cinzel text-xs uppercase tracking-wide ${goldText}`}>
                    {glimpseLabels[i] ?? L(g.caption)}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </ArchiveFrame>

        {/* Artefact (+ footer band beneath) | What Unlocks.
            Left column stacks the artefact card and the footer band so together
            they match the height of the taller "What Unlocks" card. */}
        <div className="grid items-stretch gap-5 lg:grid-cols-2">
          {/* Left column: artefact card + footer band */}
          <div className="flex flex-col gap-5">
            {/* Artefact — name + image only; full presentation lives on the artifact's own page */}
            <ArchiveFrame className="rounded-xl">
              <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center sm:p-6">
                <h2 className={`font-cinzel text-sm font-bold uppercase tracking-[0.2em] ${goldText}/80`}>
                  {t("themes.roomPage.artefact")}
                </h2>
                <h3 className={`font-cinzel text-2xl font-bold uppercase ${goldText} text-balance`}>
                  {L(data.artifact.name)}
                </h3>
                <img
                  src={data.artifact.image || "/placeholder.svg"}
                  alt={L(data.artifact.name)}
                  className="h-32 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] sm:h-36"
                />
              </div>
            </ArchiveFrame>

            {/* Footer band */}
            <ArchiveFrame weight="thin" cornerSize="sm" className="rounded-xl">
              <div className="px-5 py-4 text-center">
                <p className={`font-cinzel text-sm uppercase tracking-wide ${goldText} text-pretty`}>
                  {L(data.footerLine)}
                </p>
                <p className="font-body mt-1 text-xs text-[var(--archive-ink-faint)]">{t("themes.roomPage.progressSaved")}</p>
              </div>
            </ArchiveFrame>
          </div>

          {/* What Unlocks */}
          <ArchiveFrame className="rounded-xl">
            <div className="space-y-4 p-5 sm:p-6">
              <h2 className={`font-cinzel text-xl font-bold uppercase tracking-wide ${goldText}`}>
                {t("themes.roomPage.whatUnlocks")}
              </h2>
              <ul className="space-y-3">
                {data.unlocks.map((u, i) => (
                  <li key={i} className="border-b border-[var(--archive-gold,#d9b65c)]/15 pb-3 last:border-0 last:pb-0">
                    <p className={`font-cinzel text-sm font-semibold uppercase tracking-wide ${goldText}`}>
                      {L(u.label)}
                    </p>
                    <p className="font-body text-sm leading-snug text-[var(--archive-ink-soft)] text-pretty">{L(u.description)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </ArchiveFrame>
        </div>
      </div>
    </main>
  )
}
