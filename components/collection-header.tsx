"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, SortAsc, Grid, List } from "lucide-react"
import Link from "next/link"

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
}: CollectionHeaderProps) {
  const categories = [
    { id: "all" as CategoryType, label: "247 Games", count: 247, importSource: "BGG" },
    { id: "board-games" as CategoryType, label: "Board Games", count: 189, importSource: "BGG" },
    { id: "rpgs" as CategoryType, label: "RPGs", count: 34, importSource: "RPGG" },
    { id: "miniatures" as CategoryType, label: "Miniatures", count: 24, importSource: "Miniature Market" },
    { id: "trading-cards" as CategoryType, label: "Trading Cards", count: 12, importSource: "TCGPlayer" },
  ]

  const sortOptions = [
    { value: "name-asc" as SortOption, label: "Name (A-Z)" },
    { value: "name-desc" as SortOption, label: "Name (Z-A)" },
    { value: "rating-high" as SortOption, label: "Rating (High to Low)" },
    { value: "rating-low" as SortOption, label: "Rating (Low to High)" },
    { value: "year" as SortOption, label: "Year Published" },
    { value: "playtime" as SortOption, label: "Play Time" },
  ]

  const currentSort = sortOptions.find((opt) => opt.value === sortBy) || sortOptions[0]

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="ornate-text font-heading text-3xl font-bold mb-2">My Collection</h2>
          <div className="flex flex-wrap gap-2 mt-2 max-w-full">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "secondary" : "outline"}
                className="font-body cursor-pointer hover:bg-accent-gold/20 transition-colors border-accent-gold whitespace-nowrap"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.id === "all" ? category.label : `${category.label}: ${category.count}`}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Link href="/game/new">
            <Button className="theme-accent-gold w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="font-body">Add Game</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your collection..."
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
                <span className="font-body truncate">{currentSort.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem key={option.value} className="font-body" onClick={() => setSortBy(option.value)}>
                  {option.label}
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
