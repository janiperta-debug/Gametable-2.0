"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, Heart, Plus, Loader2, Star, Users, Clock } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { addGameToCollection, type GameCategory } from "@/app/actions/games"
import { addCardToCollection } from "@/app/actions/tcg"
import { addMiniatureToCollection, type PaintStatus } from "@/app/actions/miniatures"
import { useToast } from "@/hooks/use-toast"
import type { BGGSearchResult, BGGGameDetails } from "@/lib/types/database"
import type { TCGSearchResult } from "@/app/api/tcg/search/route"
import type { MiniatureSearchResult } from "@/app/api/miniatures/search/route"

type SearchResult = BGGSearchResult | TCGSearchResult | MiniatureSearchResult
type GameDetails = BGGGameDetails | TCGSearchResult | MiniatureSearchResult

interface CategoryConfig {
  id: GameCategory
  labelKey: string
  searchEndpoint: string
  detailsEndpoint: string
  sourceName: string
  sourceUrl: string
}

const categories: CategoryConfig[] = [
  { 
    id: "board_game", 
    labelKey: "boardGames", 
    searchEndpoint: "/api/bgg/search", 
    detailsEndpoint: "/api/bgg/details",
    sourceName: "BoardGameGeek",
    sourceUrl: "https://boardgamegeek.com"
  },
  { 
    id: "rpg", 
    labelKey: "rpgs", 
    searchEndpoint: "/api/rpgg/search", 
    detailsEndpoint: "/api/rpgg/details",
    sourceName: "RPGGeek",
    sourceUrl: "https://rpggeek.com"
  },
  { 
    id: "miniature", 
    labelKey: "miniatures", 
    searchEndpoint: "/api/miniatures/search", 
    detailsEndpoint: "/api/miniatures/details",
    sourceName: "Miniatures DB",
    sourceUrl: "#"
  },
  { 
    id: "trading_card", 
    labelKey: "tradingCards", 
    searchEndpoint: "/api/tcg/search", 
    detailsEndpoint: "/api/tcg/details",
    sourceName: "TCG Database",
    sourceUrl: "#"
  },
]

export function DiscoverGames() {
  const t = useTranslations()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("board_game")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedGame, setSelectedGame] = useState<GameDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState<number | string | null>(null)
  const [addingGame, setAddingGame] = useState<{ id: number | string; type: 'collection' | 'wishlist' } | null>(null)
  const [tcgQuantity, setTcgQuantity] = useState(1)
  const [miniQuantity, setMiniQuantity] = useState(1)
  const [miniPaintStatus, setMiniPaintStatus] = useState<PaintStatus>("unpainted")

  const categoryConfig = categories.find(c => c.id === selectedCategory)!

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])
    setSelectedGame(null)

    try {
      // TCG API uses 'q' parameter, others use 'query'
      const queryParam = selectedCategory === "trading_card" ? "q" : "query"
      const url = `${categoryConfig.searchEndpoint}?${queryParam}=${encodeURIComponent(searchQuery)}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()

      // Handle API-level errors (like BGG registration required)
      if (data.error) {
        toast({
          title: t("common.error"),
          description: data.error,
          variant: "destructive",
        })
        setSearchResults([])
        return
      }

      const results = data.results || []
      setSearchResults(results)
      
      if (results.length === 0 && !data.note) {
        toast({
          title: t("common.info") || "Info",
          description: t("collection.noResults") || "No results found. Try manual entry.",
        })
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: t("common.error"),
        description: t("collection.searchFailed") || "Search failed. Please try manual entry.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectGame = async (gameId: number | string) => {
    setLoadingDetails(gameId)
    setTcgQuantity(1)
    setMiniQuantity(1)
    setMiniPaintStatus("unpainted")
    try {
      // For TCG, also pass game type
      const gameParam = selectedCategory === "trading_card" ? "&game=mtg" : ""
      const response = await fetch(`${categoryConfig.detailsEndpoint}?id=${gameId}${gameParam}`)
      const details = await response.json()
      
      if (details && (details.id !== undefined || details.name)) {
        setSelectedGame(details)
      }
    } catch (error) {
      console.error("Details error:", error)
      toast({
        title: t("common.error"),
        description: t("collection.detailsFailed"),
        variant: "destructive",
      })
    } finally {
      setLoadingDetails(null)
    }
  }

  const handleAddGame = async (status: 'owned' | 'wishlist') => {
    if (!selectedGame) return
    
    setAddingGame({ id: selectedGame.id, type: status === 'owned' ? 'collection' : 'wishlist' })

    try {
      let result: { error?: string }

      if (selectedCategory === "trading_card") {
        const tcgResult = await addCardToCollection(selectedGame as TCGSearchResult, tcgQuantity, status)
        result = tcgResult.success ? {} : { error: tcgResult.error }
      } else if (selectedCategory === "miniature") {
        const miniResult = await addMiniatureToCollection(selectedGame as MiniatureSearchResult, miniQuantity, miniPaintStatus, status)
        result = miniResult.success ? {} : { error: miniResult.error }
      } else {
        result = await addGameToCollection(selectedGame as BGGGameDetails, status, selectedCategory)
      }

      if (result.error) {
        toast({
          title: t("common.error"),
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: t("common.success"),
          description: status === 'owned' 
            ? `${selectedGame.name} ${t("collection.addedToCollection")}`
            : `${selectedGame.name} ${t("discover.addedToWishlist")}`,
        })
        setSelectedGame(null)
      }
    } catch (error) {
      console.error("Add game error:", error)
      toast({
        title: t("common.error"),
        description: t("collection.addFailed"),
        variant: "destructive",
      })
    } finally {
      setAddingGame(null)
    }
  }

  const handleCategoryChange = (category: GameCategory) => {
    setSelectedCategory(category)
    setSearchResults([])
    setSelectedGame(null)
    setSearchQuery("")
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <Card className="room-furniture">
        <CardHeader>
          <CardTitle className="text-2xl font-heading text-accent-gold">{t("discover.title")}</CardTitle>
          <p className="font-body text-muted-foreground">
            {t("discover.subtitle")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${t("discover.searchIn")} ${categoryConfig.sourceName}...`}
                className="pl-10 font-body"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="font-body theme-accent-gold"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              {isSearching ? t("common.searching") : t("common.search")}
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={cat.id === selectedCategory ? "default" : "outline"}
                size="sm"
                className={`font-body transition-all ${cat.id === selectedCategory ? "theme-accent-gold" : "bg-transparent hover:border-accent-gold/50"}`}
                onClick={() => handleCategoryChange(cat.id)}
              >
                {t(`collection.${cat.labelKey}`)}
              </Button>
            ))}
          </div>

          <div className="text-sm text-muted-foreground font-body">
            {t("discover.searchingIn")}: <span className="text-accent-gold font-medium">{categoryConfig.sourceName}</span>
          </div>
        </CardContent>
      </Card>

      {/* Selected Game Detail */}
      {selectedGame && (
        <Card className="room-furniture">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              {((selectedGame as BGGGameDetails).thumbnail || (selectedGame as TCGSearchResult).thumbnailUrl) && (
                <img
                  src={(selectedGame as BGGGameDetails).thumbnail || (selectedGame as TCGSearchResult).thumbnailUrl || ""}
                  alt={selectedGame.name}
                  className="w-32 h-32 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-2xl text-accent-gold">{selectedGame.name}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* Board game / RPG badges */}
                  {(selectedCategory === "board_game" || selectedCategory === "rpg") && (selectedGame as BGGGameDetails).yearPublished && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      {(selectedGame as BGGGameDetails).yearPublished}
                    </Badge>
                  )}
                  {(selectedCategory === "board_game" || selectedCategory === "rpg") && (selectedGame as BGGGameDetails).rating && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      <Star className="h-3 w-3 mr-1 fill-accent-gold text-accent-gold" />
                      {(selectedGame as BGGGameDetails).rating}
                    </Badge>
                  )}
                  {(selectedCategory === "board_game" || selectedCategory === "rpg") && (selectedGame as BGGGameDetails).minPlayers && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      <Users className="h-3 w-3 mr-1" />
                      {(selectedGame as BGGGameDetails).minPlayers}-{(selectedGame as BGGGameDetails).maxPlayers}
                    </Badge>
                  )}
                  {(selectedCategory === "board_game" || selectedCategory === "rpg") && (selectedGame as BGGGameDetails).minPlaytime && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      <Clock className="h-3 w-3 mr-1" />
                      {(selectedGame as BGGGameDetails).minPlaytime}-{(selectedGame as BGGGameDetails).maxPlaytime || (selectedGame as BGGGameDetails).minPlaytime}m
                    </Badge>
                  )}
                  {/* TCG badges */}
                  {selectedCategory === "trading_card" && (selectedGame as TCGSearchResult).set && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      {(selectedGame as TCGSearchResult).set}
                    </Badge>
                  )}
                  {selectedCategory === "trading_card" && (selectedGame as TCGSearchResult).rarity && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      {(selectedGame as TCGSearchResult).rarity}
                    </Badge>
                  )}
                  {selectedCategory === "trading_card" && (selectedGame as TCGSearchResult).price && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30 text-green-500">
                      ${(selectedGame as TCGSearchResult).price?.toFixed(2)}
                    </Badge>
                  )}
                  {/* Miniature badges */}
                  {selectedCategory === "miniature" && (selectedGame as MiniatureSearchResult).faction && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      {(selectedGame as MiniatureSearchResult).faction}
                    </Badge>
                  )}
                  {selectedCategory === "miniature" && (selectedGame as MiniatureSearchResult).systemName && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      {(selectedGame as MiniatureSearchResult).systemName}
                    </Badge>
                  )}
                  {selectedCategory === "miniature" && (selectedGame as MiniatureSearchResult).points && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      {(selectedGame as MiniatureSearchResult).points} pts
                    </Badge>
                  )}
                </div>
                {selectedGame.description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3 font-body">
                    {selectedGame.description.replace(/<[^>]*>/g, '')}
                  </p>
                )}
              </div>
            </div>
            
            {/* TCG quantity selector */}
            {selectedCategory === "trading_card" && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-accent-gold/20">
                <span className="text-accent-gold font-cinzel text-sm">{t("collection.quantity") || "Quantity"}:</span>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setTcgQuantity(Math.max(1, tcgQuantity - 1))} className="h-8 w-8 p-0">-</Button>
                  <Input type="number" min="1" value={tcgQuantity} onChange={(e) => setTcgQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 h-8 text-center" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setTcgQuantity(tcgQuantity + 1)} className="h-8 w-8 p-0">+</Button>
                </div>
              </div>
            )}
            
            {/* Miniature quantity and paint status */}
            {selectedCategory === "miniature" && (
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-accent-gold/20">
                <div className="flex items-center gap-2">
                  <span className="text-accent-gold font-cinzel text-sm">{t("collection.quantity") || "Quantity"}:</span>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setMiniQuantity(Math.max(1, miniQuantity - 1))} className="h-8 w-8 p-0">-</Button>
                    <Input type="number" min="1" value={miniQuantity} onChange={(e) => setMiniQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 h-8 text-center" />
                    <Button type="button" variant="outline" size="sm" onClick={() => setMiniQuantity(miniQuantity + 1)} className="h-8 w-8 p-0">+</Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent-gold font-cinzel text-sm">{t("collection.paintStatus") || "Paint Status"}:</span>
                  <select value={miniPaintStatus} onChange={(e) => setMiniPaintStatus(e.target.value as PaintStatus)} className="h-8 rounded-md border border-input bg-background px-2 text-sm font-body">
                    <option value="unpainted">{t("collection.unpainted") || "Unpainted"}</option>
                    <option value="primed">{t("collection.primed") || "Primed"}</option>
                    <option value="in_progress">{t("collection.inProgress") || "In Progress"}</option>
                    <option value="painted">{t("collection.painted") || "Painted"}</option>
                    <option value="based">{t("collection.based") || "Based"}</option>
                  </select>
                </div>
              </div>
            )}
            
            <div className={`flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 ${selectedCategory !== "trading_card" && selectedCategory !== "miniature" ? "pt-4 border-t border-accent-gold/20" : ""}`}>
              <Button variant="outline" onClick={() => setSelectedGame(null)} className="font-body bg-transparent w-full sm:w-auto">
                {t("common.cancel")}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAddGame('wishlist')}
                disabled={addingGame !== null}
                className="font-body bg-transparent border-accent-gold/30 hover:bg-accent-gold/10 w-full sm:w-auto"
              >
                {addingGame?.type === 'wishlist' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Heart className="h-4 w-4 mr-2" />
                )}
                {t("collection.addToWishlist")}
              </Button>
              <Button
                onClick={() => handleAddGame('owned')}
                disabled={addingGame !== null}
                className="theme-accent-gold font-body w-full sm:w-auto"
              >
                {addingGame?.type === 'collection' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t("collection.addToCollection")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {!selectedGame && (
        <div className="space-y-2">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-body">
              {searchQuery ? t("collection.noResults") : t("discover.searchToStart")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((game) => (
                <Card key={game.id} className="room-furniture overflow-hidden hover:border-accent-gold/50 transition-colors cursor-pointer" onClick={() => handleSelectGame(game.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-medium text-lg truncate">{game.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(game as BGGSearchResult).yearPublished && (
                            <Badge variant="outline" className="text-xs border-accent-gold/30 text-accent-gold">
                              {(game as BGGSearchResult).yearPublished}
                            </Badge>
                          )}
                          {(game as TCGSearchResult).set && (
                            <Badge variant="outline" className="text-xs border-accent-gold/30 text-accent-gold">
                              {(game as TCGSearchResult).set}
                            </Badge>
                          )}
                          {(game as MiniatureSearchResult).faction && (
                            <Badge variant="outline" className="text-xs border-accent-gold/30 text-accent-gold">
                              {(game as MiniatureSearchResult).faction}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {loadingDetails === game.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-accent-gold ml-4 flex-shrink-0" />
                      ) : (
                        <Plus className="h-5 w-5 text-accent-gold ml-4 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
