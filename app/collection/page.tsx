"use client"

import { useState, useMemo } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/i18n"
import { useCollection } from "@/hooks/useCollection"
import { buildBoardRPGCardsFromEntries } from "@/lib/collection/card"
import {
  applyCollectionControls,
  getCategoryCounts,
  getStatusCounts,
  type CollectionCategoryFilter,
} from "@/lib/collection/filters"

type CategoryType = CollectionCategoryFilter

export default function Collection() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"my-games" | "find-games">("my-games")
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()
  const { games: userGames, collectionEntries, loading } = useCollection()

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
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

  const boardGameCards = useMemo(
    () => buildBoardRPGCardsFromEntries(collectionEntries, userGames),
    [collectionEntries, userGames],
  )

  const filteredAndSortedGames = useMemo(
    () =>
      applyCollectionControls(boardGameCards, {
        category: selectedCategory,
        status: statusFilter,
        searchQuery,
        sortBy,
      }),
    [boardGameCards, searchQuery, selectedCategory, statusFilter, sortBy],
  )

  const statusCounts = useMemo(() => getStatusCounts(boardGameCards), [boardGameCards])

  const categoryCounts = useMemo(() => getCategoryCounts(boardGameCards), [boardGameCards])

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

            <div className="mb-8">
              <ArchiveButton onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? t("collection.hideFilters") : t("collection.showFilters")}
              </ArchiveButton>
            </div>

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
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
                  </div>
                ) : viewMode === "grid" ? (
                  <GameGrid
                    cards={filteredAndSortedGames}
                    onToggleForTrade={handleToggleForTrade}
                    showMarketplaceButton={true}
                  />
                ) : (
                  <GameList cards={filteredAndSortedGames} />
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
