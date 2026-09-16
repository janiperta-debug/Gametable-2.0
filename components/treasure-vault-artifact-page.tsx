"use client"

import Link from "next/link"
import { ArrowLeft, BookOpen, DoorOpen, Gem, Home, Trophy, LockKeyhole } from "lucide-react"
import { ArchiveFrame } from "@/components/archive-frame"
import { useTranslation } from "@/lib/i18n"
import { ARTIFACT_SLOT_ORDER } from "@/lib/artifacts"
import { isManorRoomCurrentlyUsable } from "@/lib/manor-progression"
import type { Localized, RoomThemePage } from "@/lib/room-theme-pages"
import type { ArtifactPage } from "@/lib/artifact-pages"

const PREVIOUS_ARTIFACTS = ARTIFACT_SLOT_ORDER.filter((id) => id !== "treasure-vault")

export function TreasureVaultArtifactPage({ theme, page }: { theme: RoomThemePage; page: ArtifactPage }) {
  const { t, locale } = useTranslation()
  const L = (value: Localized) => value[locale] ?? value.en
  const complete = PREVIOUS_ARTIFACTS.every((roomId) => isManorRoomCurrentlyUsable(roomId))
  const goldText = "text-[var(--archive-gold,#d9b65c)]"
  const artifactName = complete
    ? { fi: "Palautettu holvin avain", en: "The Restored Vault Key" }
    : { fi: "Tyhjä vitriini", en: "The Empty Reliquary" }
  const artifactDescription = complete
    ? {
        fi: ["Jokainen oppitunti on opittu.", "Jokainen sirpale on löytänyt paikkansa.", "Holvin avain on palautettu."],
        en: ["Every lesson has been learned.", "Every fragment has found its place.", "The Vault Key is restored."],
      }
    : {
        fi: ["Lopullinen artefakti ei ole täällä.", "Se syntyy jokaisesta löydöstä, haasteesta ja totuudesta.", "Palaa, kun kaikki muut artefaktit on kerätty."],
        en: ["The final artifact is not here.", "It is forged through every discovery, challenge, and truth.", "Return when all other artifacts have been collected."],
      }

  return (
    <main className="artifact-cabinet min-h-screen px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/themes?tab=artifacts" className={`inline-flex min-h-11 items-center gap-2 font-cinzel text-sm uppercase tracking-wide ${goldText}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("themes.artifactPage.backToArtifacts")}
        </Link>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={theme.crest || "/placeholder.svg"} alt="Treasure Vault crest" className="h-16 w-auto sm:h-20" />
              <div>
                <h1 className="logo-text text-3xl font-bold sm:text-4xl">{L(theme.title)}</h1>
                <p className="font-body mt-1 text-sm uppercase tracking-wide text-foreground/70">{L(page.subtitle)}</p>
              </div>
            </div>
            <ArchiveFrame weight="thin" cornerSize="sm" className="overflow-hidden rounded-xl">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[0.4rem]">
                <img src={theme.hero || "/placeholder.svg"} alt="Treasure Vault interior" className="absolute inset-0 h-full w-full object-cover" />
                <p className="font-body absolute inset-x-0 bottom-0 bg-black/55 p-3 text-sm leading-relaxed text-foreground/90">{L(page.heroCaption)}</p>
              </div>
            </ArchiveFrame>
          </div>

          <ArchiveFrame className="rounded-xl">
            <div className="flex h-full flex-col items-center justify-center space-y-4 p-5 sm:p-6">
              <h2 className={`text-center font-cinzel text-sm font-bold uppercase tracking-[0.2em] ${goldText}`}>{t("themes.artifactPage.artefact")}</h2>
              <h3 className={`text-center font-cinzel text-2xl font-bold uppercase ${goldText}`}>{L(artifactName)}</h3>
              <img src={theme.artifact.image || "/placeholder.svg"} alt={L(artifactName)} className="h-44 w-auto object-contain" />
              <div className="space-y-1 text-center">
                {artifactDescription[locale === "fi" ? "fi" : "en"].map((line) => <p key={line} className="font-body leading-relaxed text-foreground/80">{line}</p>)}
              </div>
              <div className={`flex items-center gap-2 font-cinzel text-sm uppercase ${complete ? "text-emerald-300" : "text-foreground/60"}`}>
                {complete ? <Gem className="h-5 w-5" aria-hidden="true" /> : <LockKeyhole className="h-5 w-5" aria-hidden="true" />}
                {complete ? (locale === "fi" ? "Valmis" : "Complete") : (locale === "fi" ? "Kesken" : "Incomplete")}
              </div>
            </div>
          </ArchiveFrame>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ArchiveFrame className="rounded-xl"><div className="space-y-4 p-5 sm:p-6">
            <h2 className={`text-center font-cinzel text-sm font-bold uppercase tracking-[0.2em] ${goldText}`}>{t("themes.artifactPage.loreEntry")}</h2>
            <div className="flex items-center gap-2"><BookOpen className={`h-5 w-5 ${goldText}`} aria-hidden="true" /><h3 className={`font-cinzel text-lg font-bold uppercase ${goldText}`}>{L(page.lore.title)}</h3></div>
            {page.lore.text.map((line, i) => <p key={i} className="font-body leading-relaxed text-foreground/85">{L(line)}</p>)}
            <p className="font-body border-t border-[var(--archive-gold,#d9b65c)]/15 pt-3 text-sm text-foreground/60">{complete ? (locale === "fi" ? "Tämä merkintä on lisätty Lore-kokoelmaasi." : "This entry has been added to your Lore Collection.") : (locale === "fi" ? "Tämä merkintä täydentyy, kun lopullinen aarre paljastuu." : "This entry will be updated when the final treasure is revealed.")}</p>
          </div></ArchiveFrame>

          <ArchiveFrame className="rounded-xl"><div className="space-y-4 p-5 sm:p-6">
            <h2 className={`text-center font-cinzel text-sm font-bold uppercase tracking-[0.2em] ${goldText}`}>{t("themes.artifactPage.unlocks")}</h2>
            <ul className="space-y-3">
              {[{ icon: Home, label: "THEME", value: L(theme.title) }, { icon: DoorOpen, label: "ROOM ACCESS", value: L(theme.title) }, { icon: BookOpen, label: "LORE ENTRY", value: L(page.unlocks.lore) }, { icon: Gem, label: "ARTEFACT", value: L(artifactName) }, { icon: Trophy, label: "ACHIEVEMENT", value: complete ? "Vault Master" : "Vault Seeker" }].map(({ icon: Icon, label, value }) => <li key={label} className="flex items-center gap-3 border-b border-[var(--archive-gold,#d9b65c)]/15 pb-3 last:border-0"><Icon className={`h-5 w-5 flex-none ${goldText}`} aria-hidden="true" /><span className={`font-cinzel text-sm uppercase ${goldText}`}>{label}</span><span className="font-body ml-auto text-right text-sm text-foreground/85">{value}</span></li>)}
            </ul>
          </div></ArchiveFrame>
        </div>
      </div>
    </main>
  )
}
