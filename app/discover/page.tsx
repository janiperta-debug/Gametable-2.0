"use client"

import { useState } from "react"
import { DiscoverPlayersFixed } from "@/components/discover-players-fixed"
import { GroupDiscovery } from "@/components/group-discovery"
import { ThemeHero } from "@/components/theme-hero"
import { ArchiveToggle } from "@/components/archive-frame"
import { useTranslations } from "@/lib/i18n"

export default function CommunityPage() {
  const t = useTranslations()
  const [activeTab, setActiveTab] = useState<"search" | "groups">("search")

  return (
    <main className="container mx-auto px-4 py-8">
      <ThemeHero page="discover" mode="backdrop">
        <div className="text-center">
          <h1 className="logo-text text-5xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{t("community.title")}</h1>
          <p className="font-body text-foreground/90 text-xl max-w-3xl mx-auto mt-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {t("community.subtitle")}
          </p>
        </div>
      </ThemeHero>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-center">
          <ArchiveToggle
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: "search", label: t("community.tabSearch") },
              { value: "groups", label: t("community.tabGroups") },
            ]}
          />
        </div>
        {activeTab === "search" ? <DiscoverPlayersFixed /> : <GroupDiscovery />}
      </div>
    </main>
  )
}
