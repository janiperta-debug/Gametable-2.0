"use client"

import { useState } from "react"
import { CollectionHeader } from "@/components/collection-header"
import { CollectionFilters } from "@/components/collection-filters"
import { GameGrid } from "@/components/game-grid"
import { DiscoverGames } from "@/components/discover-games"
import { BookOpen, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Collection() {
  const [activeTab, setActiveTab] = useState<"my-games" | "find-games">("my-games")
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Clean Header - Matching Themes Page Style */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Game Collection</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Manage your library and discover new games to add to your collection
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-accent-gold/20 p-1 room-furniture">
            <button
              onClick={() => setActiveTab("my-games")}
              className={`px-6 py-2 rounded-md font-cinzel transition-all ${
                activeTab === "my-games" ? "bg-accent-gold text-background" : "text-foreground hover:text-accent-gold"
              }`}
            >
              My Games
            </button>
            <button
              onClick={() => setActiveTab("find-games")}
              className={`px-6 py-2 rounded-md font-cinzel transition-all ${
                activeTab === "find-games" ? "bg-accent-gold text-background" : "text-foreground hover:text-accent-gold"
              }`}
            >
              Find Games
            </button>
          </div>
        </div>

        {activeTab === "my-games" ? (
          <>
            <CollectionHeader />
            <div className="grid gap-6 lg:grid-cols-4">
              {showFilters && (
                <div className="lg:col-span-1">
                  <CollectionFilters />
                </div>
              )}
              <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
                <div className="mb-4">
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    className="theme-accent-gold bg-transparent"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="font-cinzel">{showFilters ? "Hide Filters" : "Show Filters"}</span>
                  </Button>
                </div>
                <GameGrid />
              </div>
            </div>
          </>
        ) : (
          <DiscoverGames />
        )}
      </main>
    </div>
  )
}
