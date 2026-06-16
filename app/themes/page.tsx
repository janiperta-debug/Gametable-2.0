"use client"

import { useMemo, useState } from "react"
import { Castle, Gem } from "lucide-react"
import { ManorMap } from "@/components/manor-map"
import { ArtifactsBoard } from "@/components/artifacts-board"
import { ArchiveToggle } from "@/components/archive-frame"
import { useTranslations } from "@/lib/i18n"

type ThemesTab = "manor" | "artifacts"

export default function ThemesPage() {
  const t = useTranslations()
  const [tab, setTab] = useState<ThemesTab>("manor")

  // TEMPORARY: every theme is locked except Main Hall while room work is in progress.
  const unlockedRooms = useMemo(() => ["main-hall"], [])
  const activeRoom = "main-hall"

  const tabs = (
    <div className="flex justify-center">
      <ArchiveToggle
        value={tab}
        onChange={(v) => setTab(v as ThemesTab)}
        options={[
          { value: "manor", label: t("themes.tabManor"), icon: <Castle className="h-4 w-4" /> },
          { value: "artifacts", label: t("themes.tabArtifacts"), icon: <Gem className="h-4 w-4" /> },
        ]}
      />
    </div>
  )

  // Manor tab: the page IS the map — full-bleed sepia parchment.
  if (tab === "manor") {
    return (
      <main className="manor-map min-h-screen px-3 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          {tabs}
          <ManorMap activeRoomId={activeRoom} unlockedRooms={unlockedRooms} />
        </div>
      </main>
    )
  }

  // Artifacts tab: dark manor cabinet of earned artifacts.
  return (
    <main className="artifact-cabinet min-h-screen px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {tabs}
        <header className="text-center">
          <h1 className="logo-text text-3xl font-bold sm:text-4xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            {t("themes.artifactsTitle")}
          </h1>
          <p className="font-body text-foreground/80 mt-2 text-pretty">{t("themes.artifactsSubtitle")}</p>
        </header>
        <ArtifactsBoard unlockedRooms={unlockedRooms} />
      </div>
    </main>
  )
}
