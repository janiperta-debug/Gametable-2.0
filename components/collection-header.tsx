"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, SortAsc, Grid, List } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

type CategoryType = "all" | "board-games" | "rpgs" | "miniatures" | "trading-cards"
export type SortOption = "name-asc" | "name-desc" | "rating-high" | "rating-low" | "year" | "playtime"
export type ViewMode = "grid" | "list"

interface CollectionHeaderProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: CategoryType
  setSelectedCategory: (category: CategoryType) => void
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
  onAddGame: () => void
  onImport: () => void
  categoryCounts?: {
    all: number
    "board-games": number
    rpgs: number
    miniatures: number
    "trading-cards": number
  }
}

export function CollectionHeader({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  onAddGame,
  categoryCounts,
}: CollectionHeaderProps) {
  const t = useTranslations()
  
  const categories = [
    { id: "all" as CategoryType, labelKey: "collection.allGames", count: categoryCounts?.all ?? 0, importSource: "BGG" },
    { id: "board-games" as CategoryType, labelKey: "collection.boardGames", count: categoryCounts?.["board-games"] ?? 0, importSource: "BGG" },
    { id: "rpgs" as CategoryType, labelKey: "collection.rpgs", count: categoryCounts?.rpgs ?? 0, importSource: "RPGG" },
    { id: "miniatures" as CategoryType, labelKey: "collection.miniatures", count: categoryCounts?.miniatures ?? 0, importSource: "Miniature Market" },
    { id: "trading-cards" as CategoryType, labelKey: "collection.tradingCards", count: categoryCounts?.["trading-cards"] ?? 0, importSource: "TCGPlayer" },
  ]

  const sortOptions = [
    { value: "name-asc" as SortOption, labelKey: "collection.sortNameAZ" },
    { value: "name-desc" as SortOption, labelKey: "collection.sortNameZA" },
    { value: "rating-high" as SortOption, labelKey: "collection.sortRatingHigh" },
    { value: "rating-low" as SortOption, labelKey: "collection.sortRatingLow" },
    { value: "year" as SortOption, labelKey: "collection.sortYear" },
    { value: "playtime" as SortOption, labelKey: "collection.sortPlaytime" },
  ]

  const currentSort = sortOptions.find((opt) => opt.value === sortBy) || sortOptions[0]

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="ornate-text font-heading text-3xl font-bold mb-2">{t("collection.myCollection")}</h2>
          <div className="flex flex-wrap gap-2 mt-2 max-w-full">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "secondary" : "outline"}
                className="font-body cursor-pointer hover:bg-accent-gold/20 transition-colors border-accent-gold whitespace-nowrap"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.id === "all" ? `${category.count} ${t("collection.games")}` : `${t(category.labelKey)}: ${category.count}`}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button onClick={onAddGame} className="theme-accent-gold w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="font-body">{t("collection.addGame")}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("collection.searchCollection")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-body"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-none bg-transparent min-w-0 flex-shrink">
                <SortAsc className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="font-body truncate">{t(currentSort.labelKey)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem key={option.value} className="font-body" onClick={() => setSortBy(option.value)}>
                  {t(option.labelKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center border rounded-md flex-shrink-0">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`rounded-r-none ${viewMode === "grid" ? "theme-accent-gold" : ""}`}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={`rounded-l-none ${viewMode === "list" ? "theme-accent-gold" : ""}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
