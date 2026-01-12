"use client"

import { useState, useMemo } from "react"
import { CollectionHeader, type SortOption, type ViewMode } from "@/components/collection-header"
import { CollectionFilters } from "@/components/collection-filters"
import { GameGrid } from "@/components/game-grid"
import { GameList } from "@/components/game-list"
import { DiscoverGames } from "@/components/discover-games"
import { ImportSection } from "@/components/import-section"
import { BookOpen, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

type CategoryType = "all" | "board-games" | "rpgs" | "miniatures" | "trading-cards"

export default function Collection() {
  const [activeTab, setActiveTab] = useState<"my-games" | "find-games">("my-games")
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all")
  const [sortBy, setSortBy] = useState<SortOption>("name-asc")

  const handleToggleForTrade = (gameId: string) => {
    toast({
      title: "Updated",
      description: "Game status updated in the marketplace",
    })
  }

  const handleToggleWishlist = (gameId: string) => {
    toast({
      title: "Updated",
      description: "Game wishlist status updated",
    })
  }

  const filteredAndSortedGames = useMemo(() => {
    let filtered: any[] = []

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((game) => game.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Sort games
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.title.localeCompare(b.title)
        case "name-desc":
          return b.title.localeCompare(a.title)
        case "rating-high":
          return b.rating - a.rating
        case "rating-low":
          return a.rating - b.rating
        case "year":
          return b.yearPublished - a.yearPublished
        case "playtime":
          return a.minPlayTime - b.minPlayTime
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, sortBy])

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="logo-text text-5xl font-bold">Game Collection</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Manage your library and discover new games to add to your collection
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "my-games" | "find-games")}>
            <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 max-w-md mx-auto">
              <TabsTrigger value="my-games" className="font-cinzel text-xs sm:text-sm">
                My Games
              </TabsTrigger>
              <TabsTrigger value="find-games" className="font-cinzel text-xs sm:text-sm">
                Find Games
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === "my-games" ? (
          <>
            <CollectionHeader
              viewMode={viewMode}
              setViewMode={setViewMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onAddGame={() => {}}
              onImport={() => {}}
            />

            {selectedCategory !== "all" && (
              <ImportSection selectedCategory={selectedCategory as Exclude<CategoryType, "all">} />
            )}

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
                {viewMode === "grid" ? (
                  <GameGrid
                    games={filteredAndSortedGames}
                    onToggleForTrade={handleToggleForTrade}
                    showMarketplaceButton={true}
                  />
                ) : (
                  <GameList games={filteredAndSortedGames} />
                )}
              </div>
            </div>
          </>
        ) : (
          <DiscoverGames onToggleWishlist={handleToggleWishlist} />
        )}
      </main>
    </div>
  )
}
