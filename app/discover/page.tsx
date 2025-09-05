"use client"

import { useState } from "react"
import { DiscoverHeader } from "@/components/discover-header"
import { DiscoverToggle } from "@/components/discover-toggle"
import { DiscoverGames } from "@/components/discover-games"
import { DiscoverPlayers } from "@/components/discover-players"

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<"games" | "players">("games")

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <DiscoverHeader />

        <div className="max-w-6xl mx-auto space-y-8">
          <DiscoverToggle activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "games" ? <DiscoverGames /> : <DiscoverPlayers />}
        </div>
      </main>
    </div>
  )
}
