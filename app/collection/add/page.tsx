"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, Loader2, Plus, Star, Users, Clock, Dices, Swords, CreditCard, Puzzle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addGameToCollection } from "@/app/actions/games"
import { addCardToCollection } from "@/app/actions/tcg"
import { addMiniatureToCollection, type PaintStatus } from "@/app/actions/miniatures"
import { useTranslations } from "@/lib/i18n"
import type { BGGSearchResult, BGGGameDetails } from "@/lib/types/database"
import type { TCGSearchResult } from "@/app/api/tcg/search/route"
import type { MiniatureSearchResult } from "@/app/api/miniatures/search/route"

type GameCategory = "board_game" | "rpg" | "trading_card" | "miniature"

// Union type for search results from different APIs
type SearchResult = BGGSearchResult | TCGSearchResult | MiniatureSearchResult
type GameDetails = BGGGameDetails | TCGSearchResult | MiniatureSearchResult

interface CategoryConfig {
  id: GameCategory
  icon: React.ElementType
  searchEndpoint: string
  detailsEndpoint: string
}

const categories: CategoryConfig[] = [
  { id: "board_game", icon: Dices, searchEndpoint: "/api/bgg/search", detailsEndpoint: "/api/bgg/details" },
  { id: "rpg", icon: Swords, searchEndpoint: "/api/rpgg/search", detailsEndpoint: "/api/rpgg/details" },
  { id: "trading_card", icon: CreditCard, searchEndpoint: "/api/tcg/search", detailsEndpoint: "/api/tcg/details" },
  { id: "miniature", icon: Puzzle, searchEndpoint: "/api/miniatures/search", detailsEndpoint: "/api/miniatures/details" },
]

export default function AddGamePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"search" | "manual" | "bulk">("search")
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("board_game")
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [addingGameId, setAddingGameId] = useState<number | string | null>(null)
  const [selectedGame, setSelectedGame] = useState<GameDetails | null>(null)
  const [tcgQuantity, setTcgQuantity] = useState(1)
  const [miniQuantity, setMiniQuantity] = useState(1)
  const [miniPaintStatus, setMiniPaintStatus] = useState<PaintStatus>("unpainted")
  const [loadingDetails, setLoadingDetails] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    name: "",
    year: "",
    minPlayers: "",
    maxPlayers: "",
    minPlaytime: "",
    maxPlaytime: "",
    description: "",
  })
  const [savingManual, setSavingManual] = useState(false)
  
  // Bulk import state
  const [bulkText, setBulkText] = useState("")
  const [parsedItems, setParsedItems] = useState<Array<{ name: string; quantity: number; setCode?: string }>>([])
  const [importingBulk, setImportingBulk] = useState(false)

  const categoryConfig = categories.find(c => c.id === selectedCategory)!

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchResults([])
    setSelectedGame(null)

    try {
      // TCG API uses 'q' parameter, BGG/RPGG use 'query'
      const queryParam = selectedCategory === "trading_card" ? "q" : "query"
      const response = await fetch(`${categoryConfig.searchEndpoint}?${queryParam}=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setSearchResults(data.results || [])
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: t("common.error"),
        description: t("collection.searchFailed"),
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  const handleSelectGame = async (gameId: number | string) => {
    setLoadingDetails(true)
    setTcgQuantity(1) // Reset quantity for new selection
    setMiniQuantity(1)
    setMiniPaintStatus("unpainted")
    try {
      // For TCG, also pass game type
      const gameParam = selectedCategory === "trading_card" ? `&game=mtg` : ""
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
      setLoadingDetails(false)
    }
  }

  const handleAddGame = async () => {
    if (!selectedGame) return
    
    setAddingGameId(selectedGame.id)

    try {
      let result: { error?: string }

      if (selectedCategory === "trading_card") {
        // Use TCG-specific action
        const tcgResult = await addCardToCollection(selectedGame as TCGSearchResult, tcgQuantity, "owned")
        result = tcgResult.success ? {} : { error: tcgResult.error }
      } else if (selectedCategory === "miniature") {
        // Use miniatures-specific action
        const miniResult = await addMiniatureToCollection(selectedGame as MiniatureSearchResult, miniQuantity, miniPaintStatus, "owned")
        result = miniResult.success ? {} : { error: miniResult.error }
      } else {
        // Use general game action
        result = await addGameToCollection(selectedGame as BGGGameDetails, "owned", selectedCategory)
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
          description: `${selectedGame.name} ${t("collection.addedToCollection")}`,
        })
        router.push("/collection")
      }
    } catch (error) {
      console.error("Add game error:", error)
      toast({
        title: t("common.error"),
        description: t("collection.addFailed"),
        variant: "destructive",
      })
    } finally {
      setAddingGameId(null)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualForm.name.trim()) {
      toast({
        title: t("common.error"),
        description: t("collection.nameRequired"),
        variant: "destructive",
      })
      return
    }

    setSavingManual(true)

    try {
      const gameDetails: BGGGameDetails = {
        id: Date.now(), // Temporary ID for manual entries
        name: manualForm.name.trim(),
        yearPublished: manualForm.year ? parseInt(manualForm.year, 10) : null,
        minPlayers: manualForm.minPlayers ? parseInt(manualForm.minPlayers, 10) : null,
        maxPlayers: manualForm.maxPlayers ? parseInt(manualForm.maxPlayers, 10) : null,
        minPlaytime: manualForm.minPlaytime ? parseInt(manualForm.minPlaytime, 10) : null,
        maxPlaytime: manualForm.maxPlaytime ? parseInt(manualForm.maxPlaytime, 10) : null,
        description: manualForm.description || null,
        rating: null,
        image: null,
        thumbnail: null,
      }

      const result = await addGameToCollection(gameDetails, "owned", selectedCategory, true)

      if (result.error) {
        toast({
          title: t("common.error"),
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: t("common.success"),
          description: `${manualForm.name} ${t("collection.addedToCollection")}`,
        })
        router.push("/collection")
      }
    } catch (error) {
      console.error("Manual add error:", error)
      toast({
        title: t("common.error"),
        description: t("collection.addFailed"),
        variant: "destructive",
      })
    } finally {
      setSavingManual(false)
    }
  }

  const handleCategoryChange = (category: GameCategory) => {
    setSelectedCategory(category)
    setSearchResults([])
    setSelectedGame(null)
    setSearchQuery("")
    setParsedItems([])
    setBulkText("")
  }

  const handleParseBulk = () => {
    const lines = bulkText.split("\n").filter((line) => line.trim())
    const parsed: Array<{ name: string; quantity: number; setCode?: string }> = []

    for (const line of lines) {
      // Skip comments and section headers
      if (line.startsWith("//") || line.startsWith("#") || line.endsWith(":")) continue

      // Match patterns like "4 Lightning Bolt", "4x Lightning Bolt", "4 Lightning Bolt (M20) 160"
      const match = line.match(/^(\d+)x?\s+(.+?)(?:\s+\(([A-Z0-9]+)\))?(?:\s+\d+)?$/i)

      if (match) {
        parsed.push({
          quantity: parseInt(match[1], 10),
          name: match[2].trim(),
          setCode: match[3] || undefined,
        })
      }
    }

    setParsedItems(parsed)
    
    if (parsed.length === 0 && bulkText.trim()) {
      toast({
        title: t("common.error"),
        description: t("collection.noParsedItems"),
        variant: "destructive",
      })
    }
  }

  const handleBulkImport = async () => {
    if (parsedItems.length === 0) return
    
    setImportingBulk(true)
    let successCount = 0
    let errorCount = 0

    for (const item of parsedItems) {
      try {
        // For TCG, search for the card and add it
        if (selectedCategory === "trading_card") {
          const response = await fetch(`/api/tcg/search?q=${encodeURIComponent(item.name)}&game=mtg`)
          const data = await response.json()
          
          if (data.results && data.results.length > 0) {
            const card = data.results[0] as TCGSearchResult
            const result = await addCardToCollection(card, item.quantity, "owned")
            if (result.success) successCount++
            else errorCount++
          } else {
            errorCount++
          }
        } else if (selectedCategory === "miniature") {
          // For miniatures, search and add
          const response = await fetch(`/api/miniatures/search?query=${encodeURIComponent(item.name)}`)
          const data = await response.json()
          
          if (data.results && data.results.length > 0) {
            const mini = data.results[0] as MiniatureSearchResult
            const result = await addMiniatureToCollection(mini, item.quantity, "unpainted", "owned")
            if (result.success) successCount++
            else errorCount++
          } else {
            errorCount++
          }
        }
      } catch {
        errorCount++
      }
    }

    setImportingBulk(false)
    
    toast({
      title: t("common.success"),
      description: `Imported ${successCount} items${errorCount > 0 ? `, ${errorCount} failed` : ""}`,
    })

    if (successCount > 0) {
      router.push("/collection")
    }
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("collection.back")}
            </Button>
            <h1 className="ornate-text font-heading text-3xl font-bold">{t("collection.addGame")}</h1>
          </div>

          {/* Category Selector */}
          <Card className="room-furniture mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-accent-gold">{t("collection.selectCategory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleCategoryChange(id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                      selectedCategory === id
                        ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                        : "border-border bg-transparent hover:border-accent-gold/50"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-body text-center">{t(`collection.${id === "board_game" ? "boardGames" : id === "rpg" ? "rpgs" : id === "trading_card" ? "tradingCards" : "miniatures"}`)}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search/Manual Tabs */}
          <Card className="room-furniture">
            <CardContent className="pt-6">
              <Tabs defaultValue="search" value={activeTab} onValueChange={(v) => setActiveTab(v as "search" | "manual" | "bulk")}>
                <TabsList className={`grid w-full mb-6 ${selectedCategory === "trading_card" || selectedCategory === "miniature" ? "grid-cols-3" : "grid-cols-2"}`}>
                  <TabsTrigger value="search" className="font-body">{t("collection.searchDatabase")}</TabsTrigger>
                  <TabsTrigger value="manual" className="font-body">{t("collection.manualEntry")}</TabsTrigger>
                  {(selectedCategory === "trading_card" || selectedCategory === "miniature") && (
                    <TabsTrigger value="bulk" className="font-body">{t("collection.bulkImport")}</TabsTrigger>
                  )}
                </TabsList>

                {/* Search Tab */}
                <TabsContent value="search" className="space-y-6">
                  <div>
                    <p className="font-body text-muted-foreground text-sm mb-4">
                      {t(`collection.search${selectedCategory === "board_game" ? "BGG" : selectedCategory === "rpg" ? "RPGG" : selectedCategory === "trading_card" ? "TCG" : "Mini"}Description`)}
                    </p>
                    
                    {/* Search Input */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t("collection.searchPlaceholder")}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="pl-10 font-body"
                        />
                      </div>
                      <Button
                        onClick={handleSearch}
                        disabled={searching || !searchQuery.trim()}
                        className="theme-accent-gold"
                      >
                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Selected Game Preview */}
                  {selectedGame && (
                    <div className="p-4 rounded-lg border border-accent-gold/30 bg-accent-gold/5">
                      <div className="flex gap-4">
                        {(selectedGame as BGGGameDetails).thumbnail || (selectedGame as TCGSearchResult).thumbnailUrl ? (
                          <img
                            src={(selectedGame as BGGGameDetails).thumbnail || (selectedGame as TCGSearchResult).thumbnailUrl || ""}
                            alt={selectedGame.name}
                            className="w-24 h-24 object-cover rounded"
                          />
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold text-xl text-accent-gold">{selectedGame.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {/* Board game / RPG specific badges */}
                            {selectedCategory !== "trading_card" && (selectedGame as BGGGameDetails).yearPublished && (
                              <Badge variant="outline" className="text-xs border-accent-gold/30">
                                {(selectedGame as BGGGameDetails).yearPublished}
                              </Badge>
                            )}
                            {selectedCategory !== "trading_card" && (selectedGame as BGGGameDetails).rating && (
                              <Badge variant="outline" className="text-xs border-accent-gold/30">
                                <Star className="h-3 w-3 mr-1 fill-accent-gold text-accent-gold" />
                                {(selectedGame as BGGGameDetails).rating}
                              </Badge>
                            )}
                            {selectedCategory !== "trading_card" && (selectedGame as BGGGameDetails).minPlayers && (selectedGame as BGGGameDetails).maxPlayers && (
                              <Badge variant="outline" className="text-xs border-accent-gold/30">
                                <Users className="h-3 w-3 mr-1" />
                                {(selectedGame as BGGGameDetails).minPlayers}-{(selectedGame as BGGGameDetails).maxPlayers}
                              </Badge>
                            )}
                            {selectedCategory !== "trading_card" && (selectedGame as BGGGameDetails).minPlaytime && (
                              <Badge variant="outline" className="text-xs border-accent-gold/30">
                                <Clock className="h-3 w-3 mr-1" />
                                {(selectedGame as BGGGameDetails).minPlaytime}-{(selectedGame as BGGGameDetails).maxPlaytime || (selectedGame as BGGGameDetails).minPlaytime}m
                              </Badge>
                            )}
                            {/* TCG specific badges */}
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
                            {selectedCategory === "trading_card" && (selectedGame as TCGSearchResult).type && (
                              <Badge variant="outline" className="text-xs border-accent-gold/30">
                                {(selectedGame as TCGSearchResult).type}
                              </Badge>
                            )}
                            {selectedCategory === "trading_card" && (selectedGame as TCGSearchResult).price && (
                              <Badge variant="outline" className="text-xs border-accent-gold/30 text-green-500">
                                ${(selectedGame as TCGSearchResult).price?.toFixed(2)}
                              </Badge>
                            )}
                            {/* Miniature specific badges */}
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
                            {selectedCategory === "miniature" && (selectedGame as MiniatureSearchResult).models && (
                              <Badge variant="outline" className="text-xs border-accent-gold/30">
                                {(selectedGame as MiniatureSearchResult).models} models
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
                      {/* Quantity selector for TCG */}
                      {selectedCategory === "trading_card" && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-accent-gold/20">
                          <Label className="text-accent-gold font-cinzel text-sm">{t("collection.quantity") || "Quantity"}:</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setTcgQuantity(Math.max(1, tcgQuantity - 1))}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={tcgQuantity}
                              onChange={(e) => setTcgQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 h-8 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setTcgQuantity(tcgQuantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      )}
                      {/* Miniature quantity and paint status */}
                      {selectedCategory === "miniature" && (
                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-accent-gold/20">
                          <div className="flex items-center gap-2">
                            <Label className="text-accent-gold font-cinzel text-sm">{t("collection.quantity") || "Quantity"}:</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setMiniQuantity(Math.max(1, miniQuantity - 1))}
                                className="h-8 w-8 p-0"
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={miniQuantity}
                                onChange={(e) => setMiniQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 h-8 text-center"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setMiniQuantity(miniQuantity + 1)}
                                className="h-8 w-8 p-0"
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-accent-gold font-cinzel text-sm">{t("collection.paintStatus") || "Paint Status"}:</Label>
                            <select
                              value={miniPaintStatus}
                              onChange={(e) => setMiniPaintStatus(e.target.value as PaintStatus)}
                              className="h-8 rounded-md border border-input bg-background px-2 text-sm font-body"
                            >
                              <option value="unpainted">{t("collection.unpainted") || "Unpainted"}</option>
                              <option value="primed">{t("collection.primed") || "Primed"}</option>
                              <option value="in_progress">{t("collection.inProgress") || "In Progress"}</option>
                              <option value="painted">{t("collection.painted") || "Painted"}</option>
                              <option value="based">{t("collection.based") || "Based"}</option>
                            </select>
                          </div>
                        </div>
                      )}
                      <div className={`flex justify-end gap-3 mt-4 ${selectedCategory !== "trading_card" && selectedCategory !== "miniature" ? "pt-4 border-t border-accent-gold/20" : ""}`}>
                        <Button variant="outline" onClick={() => setSelectedGame(null)} className="font-body bg-transparent">
                          {t("common.cancel")}
                        </Button>
                        <Button
                          onClick={handleAddGame}
                          disabled={addingGameId === selectedGame.id}
                          className="theme-accent-gold font-body"
                        >
                          {addingGameId === selectedGame.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          {t("collection.addToCollection")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {!selectedGame && (
                    <div className="space-y-2">
                      {searching || loadingDetails ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground font-body">
                          {searchQuery ? t("collection.noResults") : t("collection.searchPrompt")}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {searchResults.map((game) => (
                            <button
                              key={game.id}
                              onClick={() => handleSelectGame(game.id)}
                              className="w-full flex items-center justify-between p-4 rounded-lg border border-accent-gold/20 hover:bg-accent-gold/10 hover:border-accent-gold/40 transition-colors text-left"
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-heading font-medium text-lg">{game.name}</h4>
                                {game.yearPublished && (
                                  <Badge variant="outline" className="mt-1 text-xs border-accent-gold/30 text-accent-gold">
                                    {game.yearPublished}
                                  </Badge>
                                )}
                              </div>
                              <Plus className="h-5 w-5 text-accent-gold ml-4 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Manual Entry Tab */}
                <TabsContent value="manual" className="space-y-6">
                  <p className="font-body text-muted-foreground text-sm">
                    {t("collection.manualEntryDescription")}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-accent-gold font-cinzel text-sm uppercase tracking-wider">
                        {t("collection.gameName")} *
                      </Label>
                      <Input
                        id="name"
                        value={manualForm.name}
                        onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                        placeholder={t("collection.gameNamePlaceholder")}
                        className="mt-1 font-body"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="year" className="text-accent-gold font-cinzel text-sm uppercase tracking-wider">
                          {t("collection.yearPublished")}
                        </Label>
                        <Input
                          id="year"
                          type="number"
                          value={manualForm.year}
                          onChange={(e) => setManualForm({ ...manualForm, year: e.target.value })}
                          placeholder="2024"
                          className="mt-1 font-body"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="minPlayers" className="text-accent-gold font-cinzel text-sm uppercase tracking-wider">
                            {t("collection.minPlayers")}
                          </Label>
                          <Input
                            id="minPlayers"
                            type="number"
                            min="1"
                            value={manualForm.minPlayers}
                            onChange={(e) => setManualForm({ ...manualForm, minPlayers: e.target.value })}
                            placeholder="1"
                            className="mt-1 font-body"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxPlayers" className="text-accent-gold font-cinzel text-sm uppercase tracking-wider">
                            {t("collection.maxPlayers")}
                          </Label>
                          <Input
                            id="maxPlayers"
                            type="number"
                            min="1"
                            value={manualForm.maxPlayers}
                            onChange={(e) => setManualForm({ ...manualForm, maxPlayers: e.target.value })}
                            placeholder="4"
                            className="mt-1 font-body"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minPlaytime" className="text-accent-gold font-cinzel text-sm uppercase tracking-wider">
                          {t("collection.minPlaytime")}
                        </Label>
                        <Input
                          id="minPlaytime"
                          type="number"
                          min="1"
                          value={manualForm.minPlaytime}
                          onChange={(e) => setManualForm({ ...manualForm, minPlaytime: e.target.value })}
                          placeholder="30"
                          className="mt-1 font-body"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxPlaytime" className="text-accent-gold font-cinzel text-sm uppercase tracking-wider">
                          {t("collection.maxPlaytime")}
                        </Label>
                        <Input
                          id="maxPlaytime"
                          type="number"
                          min="1"
                          value={manualForm.maxPlaytime}
                          onChange={(e) => setManualForm({ ...manualForm, maxPlaytime: e.target.value })}
                          placeholder="60"
                          className="mt-1 font-body"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-accent-gold font-cinzel text-sm uppercase tracking-wider">
                        {t("collection.description")}
                      </Label>
                      <textarea
                        id="description"
                        value={manualForm.description}
                        onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                        placeholder={t("collection.descriptionPlaceholder")}
                        className="mt-1 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-body placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleManualSubmit}
                        disabled={savingManual || !manualForm.name.trim()}
                        className="theme-accent-gold font-body"
                      >
                        {savingManual ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {t("collection.addToCollection")}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Bulk Import Tab (only for TCG and Miniatures) */}
                {(selectedCategory === "trading_card" || selectedCategory === "miniature") && (
                  <TabsContent value="bulk" className="space-y-6">
                    <p className="font-body text-muted-foreground text-sm">
                      {t("collection.bulkImportDescription")}
                    </p>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bulkText" className="text-accent-gold font-cinzel text-sm uppercase tracking-wider">
                          {selectedCategory === "trading_card" ? "Deck List" : "Army List"}
                        </Label>
                        <textarea
                          id="bulkText"
                          value={bulkText}
                          onChange={(e) => setBulkText(e.target.value)}
                          placeholder={selectedCategory === "trading_card" 
                            ? "4 Lightning Bolt\n2x Dark Ritual\n1 Black Lotus (LEA)"
                            : "10 Intercessors\n5x Hellblasters\n1 Captain in Gravis Armour"
                          }
                          className="mt-1 w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm font-body placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                        />
                      </div>

                      <Button
                        onClick={handleParseBulk}
                        variant="outline"
                        className="w-full"
                      >
                        {t("collection.parseList")}
                      </Button>

                      {parsedItems.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-heading text-accent-gold">{t("collection.parsedItems")} ({parsedItems.length})</h4>
                          <div className="max-h-48 overflow-y-auto space-y-2 border border-accent-gold/20 rounded-lg p-3">
                            {parsedItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm font-body">
                                <span>{item.name}</span>
                                <Badge variant="outline" className="border-accent-gold/30">
                                  x{item.quantity}
                                </Badge>
                              </div>
                            ))}
                          </div>

                          <Button
                            onClick={handleBulkImport}
                            disabled={importingBulk}
                            className="w-full theme-accent-gold font-body"
                          >
                            {importingBulk ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                {t("collection.importAll")} ({parsedItems.length})
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
