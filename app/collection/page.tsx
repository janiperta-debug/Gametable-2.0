"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CollectionHeader, type SortOption, type ViewMode, type StatusFilter } from "@/components/collection-header"
import { CollectionFilters } from "@/components/collection-filters"
import { GameGrid } from "@/components/game-grid"
import { GameList } from "@/components/game-list"
import { DiscoverGames } from "@/components/discover-games"
import { ImportSection } from "@/components/import-section"
import { ThemeHero } from "@/components/theme-hero"
import { ArchiveButton, ArchiveToggle } from "@/components/archive-frame"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/i18n"
import { useCollection } from "@/hooks/useCollection"
import { removeMiniatureFromWishlist } from "@/app/actions/miniature-wishlist"
import { removeCardFromCollection } from "@/app/actions/tcg"
import { getMyListings } from "@/app/actions/marketplace"
import { buildCollectionCardsFromEntries } from "@/lib/collection/card"
import {
  applyCollectionControls,
  getCategoryCounts,
  getStatusCounts,
  type CollectionCategoryFilter,
  filterCardsByTCGGame,
  getTCGGameOptions,
  DEFAULT_COLLECTION_SPECIFIC_FILTERS,
  filterCardsBySpecificFilters,
  type CollectionSpecificFilters,
} from "@/lib/collection/filters"
import type { CollectionDomain } from "@/lib/types/collection"

type CategoryType = CollectionCategoryFilter

export default function Collection() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"my-games" | "find-games">("my-games")
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()
  const { games: userGames, collectionEntries, loading, refetch } = useCollection()
  const [activeMarketplaceGameIds, setActiveMarketplaceGameIds] = useState<Set<string>>(new Set())

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("name-asc")
  const [selectedTCGGame, setSelectedTCGGame] = useState("")
  const [specificFilters, setSpecificFilters] = useState<CollectionSpecificFilters>(DEFAULT_COLLECTION_SPECIFIC_FILTERS)

  useEffect(() => {
    let cancelled = false

    async function loadMarketplaceStatus() {
      const result = await getMyListings()
      if (cancelled || result.error) return
      setActiveMarketplaceGameIds(
        new Set(
          result.data
            .filter((listing) => listing.status === "active" && listing.user_game_id)
            .map((listing) => listing.user_game_id as string),
        ),
      )
    }

    loadMarketplaceStatus()
    return () => {
      cancelled = true
    }
  }, [])

  const handleRemoveTCGCard = async (_collectionEntryId: string) => {
    await refetch()
    toast({
      title: t("common.updated"),
      description: "Kortti poistettu kokoelmasta.",
    })
  }

  const handleUpdateCollection = async () => {
    await refetch()
  }

  const handleToggleForTrade = (gameId: string) => {
    toast({
      title: t("common.updated"),
      description: t("collection.marketplaceUpdated"),
    })
  }

  const handleToggleWishlist = async (gameId: string, domain?: CollectionDomain) => {
    if (domain === "miniature") {
      const result = await removeMiniatureFromWishlist(gameId)
      if (!result.success) {
        toast({
          title: t("common.error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }

      await refetch()
    }

    toast({
      title: t("common.updated"),
      description: t("collection.wishlistUpdated"),
    })
  }

  const collectionCards = useMemo(
    () => buildCollectionCardsFromEntries(collectionEntries, userGames, activeMarketplaceGameIds),
    [collectionEntries, userGames, activeMarketplaceGameIds],
  )

  const tcgGameOptions = useMemo(() => getTCGGameOptions(collectionCards), [collectionCards])

  useEffect(() => {
    if (selectedCategory !== "trading-cards") setSelectedTCGGame("")
    else if (selectedTCGGame && !tcgGameOptions.some((game) => game.id === selectedTCGGame)) setSelectedTCGGame("")
  }, [selectedCategory, selectedTCGGame, tcgGameOptions])

  useEffect(() => {
    setSpecificFilters(DEFAULT_COLLECTION_SPECIFIC_FILTERS)
  }, [selectedCategory])

  const filteredAndSortedGames = useMemo(() => {
    const categoryFiltered = applyCollectionControls(collectionCards, {
      category: selectedCategory,
      status: statusFilter,
      searchQuery,
      sortBy,
    })
    const specificFiltered = filterCardsBySpecificFilters(categoryFiltered, selectedCategory, specificFilters)
    return selectedCategory === "trading-cards" && selectedTCGGame
      ? filterCardsByTCGGame(specificFiltered, selectedTCGGame)
      : specificFiltered
  }, [collectionCards, searchQuery, selectedCategory, selectedTCGGame, specificFilters, statusFilter, sortBy])

  const statusCounts = useMemo(() => getStatusCounts(collectionCards), [collectionCards])

  const categoryCounts = useMemo(() => getCategoryCounts(collectionCards), [collectionCards])

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <ThemeHero page="collection" mode="backdrop">
          <div className="text-center">
            <h1 className="logo-text text-5xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              {t("collection.title")}
            </h1>
            <p className="font-body text-foreground/90 text-xl max-w-3xl mx-auto mt-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {t("collection.subtitle")}
            </p>
          </div>
        </ThemeHero>

        <div className="mb-8 flex justify-center">
          <ArchiveToggle
            value={activeTab}
            onChange={(value) => setActiveTab(value)}
            options={[
              { value: "my-games", label: t("collection.myGames") },
              { value: "find-games", label: t("collection.findGames") },
            ]}
          />
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
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onAddGame={() => router.push("/collection/add")}
              onImport={() => {}}
              categoryCounts={categoryCounts}
              statusCounts={statusCounts}
            />

            {selectedCategory === "trading-cards" && tcgGameOptions.length > 0 && (
              <div className="mb-6 flex items-center justify-center gap-3">
                <span className="font-body text-sm text-muted-foreground">Korttipeli</span>
                <Select value={selectedTCGGame || "all"} onValueChange={(value) => setSelectedTCGGame(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Kaikki korttipelit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Kaikki korttipelit</SelectItem>
                    {tcgGameOptions.map((game) => (
                      <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCategory !== "all" && selectedCategory !== "trading-cards" && (
              <div className="mb-8">
                <ArchiveButton onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? t("collection.hideFilters") : t("collection.showFilters")}
                </ArchiveButton>
              </div>
            )}

            {selectedCategory !== "all" && (
              <ImportSection selectedCategory={selectedCategory as Exclude<CategoryType, "all">} />
            )}

            <div className="grid gap-6 lg:grid-cols-4">
              {showFilters && (
                <div className="lg:col-span-1">
                  <CollectionFilters
                    category={selectedCategory}
                    cards={collectionCards}
                    filters={specificFilters}
                    onFiltersChange={setSpecificFilters}
                  />
                </div>
              )}
              <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
                  </div>
                ) : viewMode === "grid" ? (
                  <GameGrid
                    cards={filteredAndSortedGames}
                    onToggleForTrade={handleToggleForTrade}
                    onToggleWishlist={handleToggleWishlist}
                    onRemoveTCGCard={handleRemoveTCGCard}
                    onUpdateCollection={handleUpdateCollection}
                    showMarketplaceButton={true}
                    showWishlistButton={true}
                  />
                ) : (
                  <GameList cards={filteredAndSortedGames} onRemoveTCGCard={handleRemoveTCGCard} onUpdateCollection={handleUpdateCollection} />
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