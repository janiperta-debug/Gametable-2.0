"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Castle, Gem } from "lucide-react"
import { ManorRoomsBoard } from "@/components/manor-rooms-board"
import { ArtifactsBoard } from "@/components/artifacts-board"
import { ArchiveFrame, ArchiveToggle } from "@/components/archive-frame"
import { ArchiveDivider } from "@/components/archive-divider"
import { useTranslations } from "@/lib/i18n"
import { useAppTheme } from "@/components/app-theme-provider"

type ThemesTab = "manor" | "artifacts"

function ThemesPageContent() {
  const t = useTranslations()
  const { currentAppTheme } = useAppTheme()
  const searchParams = useSearchParams()
  const initialTab: ThemesTab = searchParams.get("tab") === "artifacts" ? "artifacts" : "manor"
  const [tab, setTab] = useState<ThemesTab>(initialTab)

  const tabs = (
    <div className="flex justify-center">
      <ArchiveToggle
        framed={false}
        value={tab}
        onChange={(v) => setTab(v as ThemesTab)}
        options={[
          { value: "manor", label: t("themes.tabManor"), icon: <Castle className="h-4 w-4" /> },
          { value: "artifacts", label: t("themes.tabArtifacts"), icon: <Gem className="h-4 w-4" /> },
        ]}
      />
    </div>
  )

  if (tab === "manor") {
    return (
      <main
        data-theme={currentAppTheme}
        className="artifact-cabinet min-h-screen bg-transparent px-3 pb-6 pt-14 sm:px-6 sm:pb-10 sm:pt-16"
        style={{ backgroundColor: "transparent", backgroundImage: "none" }}
      >
        <div className="mx-auto max-w-5xl space-y-8">
          <ArchiveFrame weight="thin" cornerSize="sm" className="rounded-xl">
            {tabs}
            <ArchiveDivider />
            <header className="px-4 py-4 text-center sm:px-6 sm:py-5">
              <h1 className="logo-text text-3xl font-bold sm:text-4xl">{t("themes.manorTitle")}</h1>
              <p className="font-body mt-2 text-pretty text-foreground/80">{t("themes.manorSubtitle")}</p>
            </header>
          </ArchiveFrame>
          <ManorRoomsBoard />
        </div>
      </main>
    )
  }

  return (
    <main
      data-theme={currentAppTheme}
      className="artifact-cabinet min-h-screen bg-transparent px-3 pb-6 pt-14 sm:px-6 sm:pb-10 sm:pt-16"
      style={{ backgroundColor: "transparent", backgroundImage: "none" }}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <ArchiveFrame weight="thin" cornerSize="sm" className="rounded-xl">
          {tabs}
          <ArchiveDivider />
          <header className="px-4 py-4 text-center sm:px-6 sm:py-5">
            <h1 className="logo-text text-3xl font-bold sm:text-4xl">{t("themes.artifactsTitle")}</h1>
            <p className="font-body mt-2 text-pretty text-foreground/80">{t("themes.artifactsSubtitle")}</p>
          </header>
        </ArchiveFrame>
        <ArtifactsBoard />
      </div>
    </main>
  )
}

export default function ThemesPage() {
  return (
    <Suspense fallback={null}>
      <ThemesPageContent />
    </Suspense>
  )
}
