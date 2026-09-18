"use client"

import Link from "next/link"
import { ArrowLeft, Check, Lock } from "lucide-react"
import { ArchiveFrame } from "@/components/archive-frame"
import { useTranslation } from "@/lib/i18n"
import { useState } from "react"
import { useAppTheme, type AppThemeName } from "@/components/app-theme-provider"
import { getRoomTheme } from "@/lib/room-themes"
import { getRoomThemeAssets, getRegisteredArtifactPage } from "@/lib/room-page-registry"
import { getArtifactAssetPath } from "@/lib/artifacts"
import { canUnlockManorRoom, isManorRoomUnlocked, THEME_ACCESS_TEST_MODE } from "@/lib/manor-progression"
import { useUser } from "@/hooks/useUser"
import { unlockManorRoom, updateActiveRoom } from "@/app/actions/xp"
import type { Localized, RoomThemePage } from "@/lib/room-theme-pages"
import conservatoryStyles from "@/app/themes/conservatory-materials.module.css"
import spaContrastStyles from "@/app/themes/spa-contrast.module.css"

const FLOOR_LEVEL: Record<string, string> = {
  "Ground Floor": "I",
  "Second Floor": "II",
  Basement: "III",
}

export function RoomThemeTemplate({ data }: { data: RoomThemePage }) {
  const { t, locale } = useTranslation()
  const { currentAppTheme, setAppTheme } = useAppTheme()
  const { user, profile, refetch } = useUser()
  const [savingTheme, setSavingTheme] = useState(false)
  const L = (value: Localized) => value[locale] ?? value.en
  const goldText = "text-[var(--archive-gold,#d9b65c)]"
  const title = L(data.title)
  const glimpseLabels = [
    t("themes.roomPage.glimpseCollection"),
    t("themes.roomPage.glimpseEvents"),
    t("themes.roomPage.glimpseCommunity"),
  ]
  const roomTheme = getRoomTheme(data.id)
  const assets = getRoomThemeAssets(data.id)
  const artifactPage = getRegisteredArtifactPage(data.id)
  const artifactName = L(artifactPage?.unlocks.artefact ?? data.artifact.name)
  const artifactImage = data.id === "treasure-vault" ? getArtifactAssetPath(data.id) : data.artifact.image
  const isActive = currentAppTheme === data.id
  const isUnlocked = THEME_ACCESS_TEST_MODE || isManorRoomUnlocked(data.id, profile)
  const canUnlock = !THEME_ACCESS_TEST_MODE && canUnlockManorRoom(data.id, profile)
  const showArtefact = data.id === "main-hall" || isUnlocked
  const level = roomTheme ? FLOOR_LEVEL[roomTheme.category] ?? "I" : "I"

  return (
    <main data-theme={data.id as AppThemeName} className={`artifact-cabinet min-h-screen px-3 py-5 sm:px-6 sm:py-8 ${data.id === "conservatory" ? conservatoryStyles.conservatoryMaterials : ""} ${data.id === "spa" ? spaContrastStyles.spaContrast : ""}`} style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="mx-auto max-w-5xl space-y-4">
        <Link href="/themes" className="inline-flex min-h-11 items-center gap-2 font-cinzel text-sm uppercase tracking-wide text-[var(--archive-gold-bright,#d9b65c)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] transition-opacity hover:opacity-80"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t("themes.roomPage.backToMap")}</Link>
        <header className="flex items-center gap-4 px-1 sm:gap-5 sm:px-2">
          <img src={assets.crest} alt={`${title} crest`} className="h-20 w-20 flex-none object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)] sm:h-28 sm:w-28" />
          <div className="min-w-0"><h1 className="logo-text text-3xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] sm:text-5xl">{title}</h1><p className="font-body mt-1 text-sm uppercase tracking-wide text-foreground/75 text-pretty sm:text-base">{L(data.tagline)}</p></div>
        </header>
        <ArchiveFrame weight="thin" cornerSize="sm" className="overflow-hidden rounded-xl"><div className="relative aspect-[16/10] w-full overflow-hidden rounded-[0.4rem] sm:aspect-[16/7]"><img src={assets.hero} alt={`${title} interior`} className="absolute inset-0 h-full w-full object-cover" /></div></ArchiveFrame>
        <ArchiveFrame weight="thin" cornerSize="sm" className="rounded-md"><div className="flex flex-wrap items-center gap-3 p-4 sm:gap-4"><span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[var(--archive-gold,#d9b65c)]/50 ${goldText}`} aria-hidden="true">{isActive ? <Check className="h-5 w-5" /> : isUnlocked ? <Check className="h-5 w-5" /> : <Lock className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><p className={`font-cinzel text-sm font-bold uppercase tracking-wide ${goldText}`}>{isActive ? t("themes.roomPage.themeActive") : isUnlocked ? t("themes.roomPage.themeUnlocked") : t("themes.roomPage.themeLocked")}</p><p className="font-body text-sm leading-snug text-[var(--archive-ink-soft)] text-pretty">{isActive ? t("themes.roomPage.themeActiveDesc") : isUnlocked ? t("themes.roomPage.themeUnlockedDesc") : t("themes.roomPage.themeLockedDesc")}</p></div><span className={`flex-none rounded-md border border-[var(--archive-gold,#d9b65c)]/40 px-2.5 py-1 font-cinzel text-xs font-bold uppercase tracking-wide ${goldText}`}>{`${t("themes.roomPage.levelLabel")} ${level}`}</span>{isActive ? <span className={`inline-flex min-h-9 flex-none items-center gap-1.5 rounded-md border border-[var(--archive-gold,#d9b65c)]/50 bg-[var(--archive-gold,#d9b65c)]/15 px-3 font-cinzel text-xs font-bold uppercase tracking-wide ${goldText}`}><Check className="h-4 w-4" aria-hidden="true" />{t("themes.roomPage.inUse")}</span> : isUnlocked ? <button type="button" disabled={savingTheme} onClick={async () => { setSavingTheme(true); try { await setAppTheme(data.id as AppThemeName); await updateActiveRoom(data.id) } finally { setSavingTheme(false) } }} className={`inline-flex min-h-9 flex-none items-center rounded-md border border-[var(--archive-gold,#d9b65c)]/60 px-3 font-cinzel text-xs font-bold uppercase tracking-wide ${goldText} transition-colors hover:bg-[var(--archive-gold,#d9b65c)]/15`}>{t("themes.roomPage.useTheme")}</button> : canUnlock ? <button type="button" disabled={savingTheme} onClick={async () => { if (!user) return; setSavingTheme(true); try { const result = await unlockManorRoom(data.id); if (result.success) await refetch() } finally { setSavingTheme(false) } }} className={`inline-flex min-h-9 flex-none items-center rounded-md border border-[var(--archive-gold,#d9b65c)]/60 px-3 font-cinzel text-xs font-bold uppercase tracking-wide ${goldText} transition-colors hover:bg-[var(--archive-gold,#d9b65c)]/15`}>{t("themes.roomPage.useTheme")}</button> : null}</div></ArchiveFrame>
        <div className="grid gap-4 lg:grid-cols-2"><ArchiveFrame className="rounded-md"><div className="space-y-5 p-5 sm:p-6"><h2 className={`font-cinzel text-xl font-bold uppercase tracking-wide ${goldText}`}>{L(data.storyTitle)}</h2><div className="space-y-4">{data.storyParagraphs.map((p, i) => <p key={i} className="font-body leading-relaxed text-[var(--archive-ink-strong)] text-pretty">{L(p)}</p>)}</div><div data-archive-essence="true" className="rounded-md border border-[var(--archive-gold,#d9b65c)]/30 bg-[var(--archive-inset-bg)] p-4"><h3 className={`font-cinzel text-sm font-bold uppercase tracking-wide ${goldText}`}>{t("themes.roomPage.essence")}</h3><p className={`font-body mt-1 italic ${goldText}/90`}>{L(data.essenceTagline)}</p><div className="mt-2 space-y-1">{data.essenceText.map((line, i) => <p key={i} className="font-body leading-relaxed text-[var(--archive-ink-soft)] text-pretty">{L(line)}</p>)}</div></div></div></ArchiveFrame><ArchiveFrame className="rounded-md"><div className="space-y-4 p-5 sm:p-6"><h2 className={`font-cinzel text-xl font-bold uppercase tracking-wide ${goldText}`}>{t("themes.roomPage.journey")}</h2><ol className="grid gap-x-5 gap-y-3 sm:grid-cols-2">{data.journey.map((step, i) => <li key={i} className="flex gap-3"><span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border border-[var(--archive-gold,#d9b65c)]/50 font-cinzel text-sm font-bold ${goldText}`}>{i + 1}</span><div><p className={`font-cinzel text-sm font-semibold ${goldText}`}>{L(step.title)}</p><p className="font-body text-sm leading-snug text-[var(--archive-ink-soft)] text-pretty">{L(step.description)}</p></div></li>)}</ol></div></ArchiveFrame></div>
        <ArchiveFrame className="rounded-md"><div className="space-y-4 p-5 sm:p-6"><h2 className="text-center font-cinzel text-xl font-bold uppercase tracking-wide">{t("themes.roomPage.glimpse")}</h2><div className="grid gap-4 sm:grid-cols-3">{data.glimpses.map((g, i) => <figure key={i} className="space-y-2"><div className="overflow-hidden rounded-md border border-[var(--archive-gold,#d9b65c)]/30"><div className="relative aspect-[4/3] w-full"><img src={g.image || "/placeholder.svg"} alt={glimpseLabels[i] ?? L(g.caption)} className="absolute inset-0 h-full w-full object-cover" /></div></div><figcaption className={`text-center font-cinzel text-xs uppercase tracking-wide ${goldText}`}>{glimpseLabels[i] ?? L(g.caption)}</figcaption></figure>)}</div></div></ArchiveFrame>
        <div className="grid items-stretch gap-4 lg:grid-cols-2">{showArtefact ? <div className="flex flex-col gap-5"><ArchiveFrame className="rounded-md"><div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center sm:p-6"><h2 className={`font-cinzel text-sm font-bold uppercase tracking-[0.2em] ${goldText}/80`}>{t("themes.roomPage.artefact")}</h2><h3 className={`font-cinzel text-2xl font-bold uppercase ${goldText} text-balance`}>{artifactName}</h3><img src={artifactImage || "/placeholder.svg"} alt={artifactName} className="h-32 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] sm:h-36" /></div></ArchiveFrame><ArchiveFrame weight="thin" cornerSize="sm" className="rounded-md"><div className="px-5 py-4 text-center"><p className={`font-cinzel text-sm uppercase tracking-wide ${goldText} text-pretty`}>{L(data.footerLine)}</p><p className="font-body mt-1 text-xs text-[var(--archive-ink-faint)]">{t("themes.roomPage.progressSaved")}</p></div></ArchiveFrame></div> : <ArchiveFrame weight="thin" cornerSize="sm" className="rounded-md"><div className="px-5 py-4 text-center"><p className={`font-cinzel text-sm uppercase tracking-wide ${goldText} text-pretty`}>{L(data.footerLine)}</p><p className="font-body mt-1 text-xs text-[var(--archive-ink-faint)]">{t("themes.roomPage.progressSaved")}</p></div></ArchiveFrame>}<ArchiveFrame className="rounded-md"><div className="space-y-4 p-5 sm:p-6"><h2 className={`font-cinzel text-xl font-bold uppercase tracking-wide ${goldText}`}>{t("themes.roomPage.whatUnlocks")}</h2><ul className="space-y-3">{data.unlocks.map((u, i) => <li key={i} className="border-b border-[var(--archive-gold,#d9b65c)]/15 pb-3 last:border-0 last:pb-0"><p className={`font-cinzel text-sm font-semibold uppercase tracking-wide ${goldText}`}>{L(u.label)}</p><p className="font-body text-sm leading-snug text-[var(--archive-ink-soft)] text-pretty">{L(u.description)}</p></li>)}</ul></div></ArchiveFrame></div>
      </div>
    </main>
  )
}
