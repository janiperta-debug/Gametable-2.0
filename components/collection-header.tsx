"use client"

import {
  ArchiveButton,
  ArchiveIconButton,
  archiveField,
  archiveSelectContent,
  archiveSelectItem,
} from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Grid, List } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

type CategoryType = "all" | "board-games" | "rpgs" | "miniatures" | "trading-cards"
export type StatusFilter = "all" | "owned" | "wishlist"
export type SortOption = "name-asc" | "name-desc" | "rating-high" | "rating-low" | "year" | "playtime"
export type ViewMode = "grid" | "list"

interface CollectionHeaderProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: CategoryType
  setSelectedCategory: (category: CategoryType) => void
  statusFilter: StatusFilter
  setStatusFilter: (status: StatusFilter) => void
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
  statusCounts?: {
    all: number
    owned: number
    wishlist: number
  }
}

export function CollectionHeader({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  onAddGame,
  categoryCounts,
  statusCounts,
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
          <div className="flex flex-wrap gap-2 max-w-full">
            {/* Status filters */}
            <Badge
              variant={statusFilter === "all" ? "secondary" : "outline"}
              className="font-body cursor-pointer hover:bg-accent-gold/20 transition-colors border-accent-gold whitespace-nowrap"
              onClick={() => setStatusFilter("all")}
            >
              {t("collection.allItems")}: {statusCounts?.all ?? 0}
            </Badge>
            <Badge
              variant={statusFilter === "owned" ? "secondary" : "outline"}
              className="font-body cursor-pointer hover:bg-accent-gold/20 transition-colors border-accent-gold whitespace-nowrap"
              onClick={() => setStatusFilter("owned")}
            >
              {t("collection.owned")}: {statusCounts?.owned ?? 0}
            </Badge>
            <Badge
              variant={statusFilter === "wishlist" ? "secondary" : "outline"}
              className="font-body cursor-pointer hover:bg-accent-gold/20 transition-colors border-accent-gold whitespace-nowrap"
              onClick={() => setStatusFilter("wishlist")}
            >
              {t("collection.wishlist")}: {statusCounts?.wishlist ?? 0}
            </Badge>
            <span className="text-muted-foreground mx-1">|</span>
            {/* Category filters */}
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "secondary" : "outline"}
                className="font-body cursor-pointer hover:bg-accent-gold/20 transition-colors border-accent-gold whitespace-nowrap"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.id === "all" ? t("collection.allCategories") : t(category.labelKey)}: {category.count}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <ArchiveButton onClick={onAddGame}>{t("collection.addGame")}</ArchiveButton>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("collection.searchCollection")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("pl-10 font-body", archiveField)}
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ArchiveButton>{t(currentSort.labelKey)}</ArchiveButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={archiveSelectContent}>
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  className={cn("font-body cursor-pointer", archiveSelectItem)}
                  onClick={() => setSortBy(option.value)}
                >
                  {t(option.labelKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ArchiveIconButton
              icon={<Grid className="h-4 w-4" />}
              active={viewMode === "grid"}
              aria-pressed={viewMode === "grid"}
              aria-label={t("collection.gridView")}
              onClick={() => setViewMode("grid")}
            />
            <ArchiveIconButton
              icon={<List className="h-4 w-4" />}
              active={viewMode === "list"}
              aria-pressed={viewMode === "list"}
              aria-label={t("collection.listView")}
              onClick={() => setViewMode("list")}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
