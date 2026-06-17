"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ArchiveFrame } from "@/components/archive-frame"
import type { RoomThemePage } from "@/lib/room-theme-pages"

/**
 * RoomThemeTemplate — the FIXED theme-page template, modeled on the Bar mockup
 * (the only mockup that includes an Artefact section). Every room reuses this
 * exact structure; only the data changes (see lib/room-theme-pages.ts).
 *
 * Sections (top → bottom):
 *   Back to Map → crest + title + tagline + hero
 *   → story + The Essence | Your Journey in This Room (10 steps)
 *   → A Glimpse Inside (3 images)
 *   → Artefact + What Unlocks
 *   → footer band
 */
export function RoomThemeTemplate({ data }: { data: RoomThemePage }) {
  const goldText = "text-[var(--archive-gold,#d9b65c)]"
  return (
    <main className="artifact-cabinet min-h-screen px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back to Map */}
        <Link
          href="/themes"
          className={`inline-flex items-center gap-2 font-cinzel text-sm uppercase tracking-wide ${goldText} drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition-opacity hover:opacity-80`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Map
        </Link>

        {/* Crest + title + tagline + hero */}
        <header className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-4 sm:flex-col sm:items-start">
            <img
              src={data.crest || "/placeholder.svg"}
              alt={`${data.title} crest`}
              className="h-24 w-auto drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)] sm:h-32"
            />
            <div>
              <h1 className="logo-text text-3xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:text-4xl">
                {data.title}
              </h1>
              <p className="font-body mt-1 text-pretty italic text-foreground/80">{data.tagline}</p>
            </div>
          </div>
          <ArchiveFrame weight="thin" cornerSize="sm" className="overflow-hidden rounded-xl">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[0.4rem]">
              <img
                src={data.hero || "/placeholder.svg"}
                alt={`${data.title} interior`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </ArchiveFrame>
        </header>

        {/* Story + Essence | Journey */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Story column */}
          <ArchiveFrame className="rounded-xl">
            <div className="space-y-5 p-5 sm:p-6">
              <h2 className={`font-cinzel text-xl font-bold uppercase tracking-wide ${goldText}`}>
                {data.storyTitle}
              </h2>
              <div className="space-y-4">
                {data.storyParagraphs.map((p, i) => (
                  <p key={i} className="font-body leading-relaxed text-foreground/85 text-pretty">
                    {p}
                  </p>
                ))}
              </div>
              {/* The Essence */}
              <div className="rounded-lg border border-[var(--archive-gold,#d9b65c)]/30 bg-black/30 p-4">
                <h3 className={`font-cinzel text-sm font-bold uppercase tracking-wide ${goldText}`}>The Essence</h3>
                <p className={`font-body mt-1 italic ${goldText}/90`}>{data.essenceTagline}</p>
                <div className="mt-2 space-y-1">
                  {data.essenceText.map((line, i) => (
                    <p key={i} className="font-body leading-relaxed text-foreground/80 text-pretty">
                      {line}
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
                Your Journey in This Room
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
                      <p className={`font-cinzel text-sm font-semibold ${goldText}`}>{step.title}</p>
                      <p className="font-body text-sm leading-snug text-foreground/75 text-pretty">
                        {step.description}
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
              A Glimpse Inside
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {data.glimpses.map((g, i) => (
                <figure key={i} className="space-y-2">
                  <div className="overflow-hidden rounded-lg border border-[var(--archive-gold,#d9b65c)]/30">
                    <div className="relative aspect-[4/3] w-full">
                      <img
                        src={g.image || "/placeholder.svg"}
                        alt={g.caption}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <figcaption className={`text-center font-cinzel text-xs uppercase tracking-wide ${goldText}`}>
                    {g.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </ArchiveFrame>

        {/* Artefact + What Unlocks */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Artefact */}
          <ArchiveFrame className="rounded-xl">
            <div className="space-y-4 p-5 sm:p-6">
              <h2 className={`text-center font-cinzel text-sm font-bold uppercase tracking-[0.2em] ${goldText}/80`}>
                Artefact
              </h2>
              <h3 className={`text-center font-cinzel text-2xl font-bold uppercase ${goldText}`}>
                {data.artifact.name}
              </h3>
              <div className="flex justify-center">
                <img
                  src={data.artifact.image || "/placeholder.svg"}
                  alt={data.artifact.name}
                  className="h-40 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
                />
              </div>
              <div className="space-y-1 text-center">
                {data.artifact.description.map((line, i) => (
                  <p key={i} className="font-body leading-relaxed text-foreground/80 text-pretty">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </ArchiveFrame>

          {/* What Unlocks */}
          <ArchiveFrame className="rounded-xl">
            <div className="space-y-4 p-5 sm:p-6">
              <h2 className={`font-cinzel text-xl font-bold uppercase tracking-wide ${goldText}`}>What Unlocks</h2>
              <ul className="space-y-3">
                {data.unlocks.map((u, i) => (
                  <li key={i} className="border-b border-[var(--archive-gold,#d9b65c)]/15 pb-3 last:border-0 last:pb-0">
                    <p className={`font-cinzel text-sm font-semibold uppercase tracking-wide ${goldText}`}>{u.label}</p>
                    <p className="font-body text-sm leading-snug text-foreground/75 text-pretty">{u.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </ArchiveFrame>
        </div>

        {/* Footer band */}
        <ArchiveFrame weight="thin" cornerSize="sm" className="rounded-xl">
          <div className="px-5 py-4 text-center">
            <p className={`font-cinzel text-sm uppercase tracking-wide ${goldText} text-pretty`}>{data.footerLine}</p>
            <p className="font-body mt-1 text-xs text-foreground/60">Your progress will always be saved.</p>
          </div>
        </ArchiveFrame>
      </div>
    </main>
  )
}
