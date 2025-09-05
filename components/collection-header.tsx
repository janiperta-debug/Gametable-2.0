"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Download, Search, SortAsc, Grid, List } from "lucide-react"

type CategoryType = "all" | "board-games" | "rpgs" | "miniatures" | "trading-cards"

export function CollectionHeader() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all")

  const categories = [
    { id: "all" as CategoryType, label: "247 Games", count: 247, importSource: "BGG" },
    { id: "board-games" as CategoryType, label: "Board Games", count: 189, importSource: "BGG" },
    { id: "rpgs" as CategoryType, label: "RPGs", count: 34, importSource: "RPGG" },
    { id: "miniatures" as CategoryType, label: "Miniatures", count: 24, importSource: "Miniature Market" },
    { id: "trading-cards" as CategoryType, label: "Trading Cards", count: 12, importSource: "TCGPlayer" },
  ]

  const currentCategory = categories.find((cat) => cat.id === selectedCategory) || categories[0]

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="ornate-text font-heading text-3xl font-bold mb-2">My Collection</h2>
          <div className="flex items-center space-x-4 mt-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "secondary" : "outline"}
                className="font-body cursor-pointer hover:bg-accent-gold/20 transition-colors border-accent-gold"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.id === "all" ? category.label : `${category.label}: ${category.count}`}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="theme-accent-gold">
            <Plus className="h-4 w-4 mr-2" />
            <span className="font-body">Add Game</span>
          </Button>
          <Button variant="outline" className="theme-accent-gold bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            <span className="font-body">Import from {currentCategory.importSource}</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-body"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <SortAsc className="h-4 w-4 mr-2" />
              <span className="font-body">Sort</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="font-body">Name (A-Z)</DropdownMenuItem>
            <DropdownMenuItem className="font-body">Name (Z-A)</DropdownMenuItem>
            <DropdownMenuItem className="font-body">Rating (High to Low)</DropdownMenuItem>
            <DropdownMenuItem className="font-body">Rating (Low to High)</DropdownMenuItem>
            <DropdownMenuItem className="font-body">Year Published</DropdownMenuItem>
            <DropdownMenuItem className="font-body">Play Time</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center border rounded-md">
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
  )
}
