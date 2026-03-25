"use client"

import { useState, useMemo } from "react"
import { CollectionHeader, type SortOption, type ViewMode } from "@/components/collection-header"
import { CollectionFilters } from "@/components/collection-filters"
import { GameGrid } from "@/components/game-grid"
import { GameList } from "@/components/game-list"
import { DiscoverGames } from "@/components/discover-games"
import { ImportSection } from "@/components/import-section"
import { AddGameDialog } from "@/components/add-game-dialog"
import { BookOpen, Filter, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/i18n"
import { useCollection } from "@/hooks/useCollection"
import type { Game } from "@/lib/mock-games"

type CategoryType = "all" | "board-games" | "rpgs" | "miniatures" | "trading-cards"

export default function Collection() {
  const [activeTab, setActiveTab] = useState<"my-games" | "find-games">("my-games")
  const [showFilters, setShowFilters] = useState(false)
  const [addGameOpen, setAddGameOpen] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()
  const { games: userGames, loading, refetch } = useCollection()

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all")
  const [sortBy, setSortBy] = useState<SortOption>("name-asc")

  const handleToggleForTrade = (gameId: string) => {
    toast({
      title: t("common.updated"),
      description: t("collection.marketplaceUpdated"),
    })
  }

  const handleToggleWishlist = (gameId: string) => {
    toast({
      title: t("common.updated"),
      description: t("collection.wishlistUpdated"),
    })
  }

  // Transform database games to the format expected by GameGrid
  const transformedGames: Game[] = useMemo(() => {
    return userGames.map((ug) => ({
      id: parseInt(ug.game.bgg_id?.toString() || "0", 10) || Math.random(),
      title: ug.game.name,
      image: ug.game.image_url || ug.game.thumbnail_url || "/placeholder.svg",
      rating: ug.personal_rating || ug.game.bgg_rating || 0,
      playerCount: ug.game.min_players && ug.game.max_players 
        ? `${ug.game.min_players}-${ug.game.max_players}` 
        : "?",
      minPlayers: ug.game.min_players || 1,
      maxPlayers: ug.game.max_players || 4,
      playTime: ug.game.min_playtime && ug.game.max_playtime
        ? `${ug.game.min_playtime}-${ug.game.max_playtime}`
        : "?",
      minPlayTime: ug.game.min_playtime || 30,
      maxPlayTime: ug.game.max_playtime || 60,
      category: ug.game.category || "Board Game",
      mechanics: [],
      yearPublished: ug.game.year || 0,
      owned: ug.status === "owned",
      wishlist: ug.status === "wishlist",
      forTrade: false, // TODO: Connect to marketplace
      // Store the user_game id for actions
      userGameId: ug.id,
    }))
  }, [userGames])

  const filteredAndSortedGames = useMemo(() => {
    let filtered = [...transformedGames]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((game) => 
        game.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((game) => 
        game.category?.toLowerCase().includes(selectedCategory.replace("-", " "))
      )
    }

    // Sort games
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.title.localeCompare(b.title)
        case "name-desc":
          return b.title.localeCompare(a.title)
        case "rating-high":
          return (b.rating || 0) - (a.rating || 0)
        case "rating-low":
          return (a.rating || 0) - (b.rating || 0)
        case "year":
          return (b.yearPublished || 0) - (a.yearPublished || 0)
        case "playtime":
          return (a.minPlayTime || 0) - (b.minPlayTime || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [transformedGames, searchQuery, selectedCategory, sortBy])

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: transformedGames.length,
      "board-games": 0,
      rpgs: 0,
      miniatures: 0,
      "trading-cards": 0,
    }
    transformedGames.forEach((game) => {
      const cat = game.category?.toLowerCase() || ""
      if (cat.includes("rpg") || cat.includes("role")) counts.rpgs++
      else if (cat.includes("miniature") || cat.includes("wargame")) counts.miniatures++
      else if (cat.includes("trading") || cat.includes("tcg") || cat.includes("card game")) counts["trading-cards"]++
      else counts["board-games"]++
    })
    return counts
  }, [transformedGames])

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="logo-text text-5xl font-bold">{t("collection.title")}</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            {t("collection.subtitle")}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "my-games" | "find-games")}>
            <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 max-w-md mx-auto">
              <TabsTrigger value="my-games" className="font-cinzel text-xs sm:text-sm">
                {t("collection.myGames")}
              </TabsTrigger>
              <TabsTrigger value="find-games" className="font-cinzel text-xs sm:text-sm">
                {t("collection.findGames")}
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
              onAddGame={() => setAddGameOpen(true)}
              onImport={() => {}}
              categoryCounts={categoryCounts}
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
                    <span className="font-cinzel">{showFilters ? t("collection.hideFilters") : t("collection.showFilters")}</span>
                  </Button>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
                  </div>
                ) : viewMode === "grid" ? (
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

            <AddGameDialog 
              open={addGameOpen} 
              onOpenChange={setAddGameOpen} 
              onGameAdded={refetch}
            />
          </>
        ) : (
          <DiscoverGames onToggleWishlist={handleToggleWishlist} />
        )}
      </main>
    </div>
  )
}
