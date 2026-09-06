"use client"

import { useState } from "react"
import {
  ArchiveCard,
  ArchiveCardContent,
  ArchiveCardHeader,
  ArchiveCardTitle,
  ArchiveCardButton,
  ArchiveIconButton,
  archiveField,
} from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, Heart, Plus, Loader2, Star, Users, Clock, Dices, Swords, BookOpen } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { addGameToCollection, type GameCategory } from "@/app/actions/games"
import { addCardToCollection } from "@/app/actions/tcg"
import { addMiniatureToCollection, createMiniatureArmy, getUserMiniatureArmies, type MiniatureArmyContext, type PaintStatus } from "@/app/actions/miniatures"
import { resolveMiniatureArmy } from "@/lib/miniatures/army-resolver"
import { useToast } from "@/hooks/use-toast"
import type { BGGSearchResult, BGGGameDetails } from "@/lib/types/database"
import type { TCGSearchResult } from "@/app/api/tcg/search/route"
import type { MiniatureSearchResult } from "@/app/api/miniatures/search/route"
import { getSearchResultId } from "@/lib/search-result-id"

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

// A base game with its expansions nested underneath. `synthetic` means the base
// game itself was not in the search results (inferred from an expansion's
// baseGame link) — still shown as a host so expansions never stand alone.
type BoardHost = {
  base: BGGSearchResult
  synthetic: boolean
  expansions: BGGSearchResult[]
}

function groupBoardResults(results: BGGSearchResult[]): BoardHost[] {
  const hostsById = new Map<number, BoardHost>()
  const order: number[] = []

  const ensureHost = (base: BGGSearchResult, synthetic: boolean): BoardHost => {
    const existing = hostsById.get(base.id)
    if (existing) {
      if (!synthetic && existing.synthetic) {
        existing.base = base
        existing.synthetic = false
      }
      return existing
    }
    const host: BoardHost = { base, synthetic, expansions: [] }
    hostsById.set(base.id, host)
    order.push(base.id)
    return host
  }

  // First pass: real base games become hosts.
  for (const r of results) {
    if (r.type !== "expansion") ensureHost(r, false)
  }
  // Second pass: nest expansions under their base (synthesizing a host if the
  // base game wasn't among the results).
  for (const r of results) {
    if (r.type !== "expansion") continue
    if (r.baseGame) {
      const hadBase = hostsById.has(r.baseGame.bggId)
      const base: BGGSearchResult = hostsById.get(r.baseGame.bggId)?.base ?? {
        id: r.baseGame.bggId,
        name: r.baseGame.name,
        yearPublished: null,
        thumbnail: null,
        type: "base",
        baseGame: null,
      }
      ensureHost(base, !hadBase).expansions.push(r)
    } else {
      ensureHost(r, false)
    }
  }

  return order.map((id) => hostsById.get(id)!)
}

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
  const [tcgGame, setTcgGame] = useState<"magic" | "pokemon" | "yugioh" | "lorcana" | "flesh-and-blood" | "one-piece">("magic")
  const [miniQuantity, setMiniQuantity] = useState(1)
  const [miniPaintStatus, setMiniPaintStatus] = useState<PaintStatus>("unpainted")
  const [miniatureArmies, setMiniatureArmies] = useState<MiniatureArmyContext[]>([])
  const [selectedArmy, setSelectedArmy] = useState<MiniatureArmyContext | null>(null)
  const [armyMode, setArmyMode] = useState<"idle" | "select" | "create">("idle")
  const [armyName, setArmyName] = useState("")
  const [armyLoading, setArmyLoading] = useState(false)

  const categoryConfig = categories.find(c => c.id === selectedCategory)!

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])
    setSelectedGame(null)

    try {
      // TCG API uses 'q' parameter and needs 'game', others use 'query'
      let url = ""
      if (selectedCategory === "trading_card") {
        url = `${categoryConfig.searchEndpoint}?q=${encodeURIComponent(searchQuery)}&game=${tcgGame}`
      } else {
        url = `${categoryConfig.searchEndpoint}?query=${encodeURIComponent(searchQuery)}`
      }
      
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
    setMiniatureArmies([])
    setSelectedArmy(null)
    setArmyMode("idle")
    
    try {
      // For TCG and miniatures, use the search result directly (already has all data)
      if (selectedCategory === "trading_card" || selectedCategory === "miniature") {
        const searchResult = searchResults.find(r => getSearchResultId(r) === gameId)
        if (searchResult) {
          // Ensure the game field is set for TCG cards
          if (selectedCategory === "trading_card") {
            (searchResult as TCGSearchResult).game = tcgGame
          }
          setSelectedGame(searchResult as GameDetails)
        }
        setLoadingDetails(null)
        return
      }
      
      // For board games and RPGs, fetch details from API
      const response = await fetch(`${categoryConfig.detailsEndpoint}?id=${gameId}`)
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
    
    console.log("[v0] handleAddGame called with:", { selectedGame, status, selectedCategory })
    setAddingGame({ id: getSearchResultId(selectedGame), type: status === 'owned' ? 'collection' : 'wishlist' })

    try {
      let result: { error?: string }

      if (selectedCategory === "trading_card") {
        console.log("[v0] Adding TCG card:", selectedGame)
        const tcgResult = await addCardToCollection(selectedGame as TCGSearchResult, tcgQuantity, status)
        console.log("[v0] TCG result:", tcgResult)
        result = tcgResult.success ? {} : { error: tcgResult.error }
      } else if (selectedCategory === "miniature") {
        console.log("[v0] Adding miniature:", selectedGame)
        if (status === "wishlist") {
          result = { error: "Miniature Wishlist is not supported." }
        } else {
          const miniature = selectedGame as MiniatureSearchResult
          if (!selectedArmy) {
            setArmyLoading(true)
            const armiesResult = await getUserMiniatureArmies()
            if (!armiesResult.success) throw new Error(armiesResult.error)
            const resolution = resolveMiniatureArmy(miniature.factionId, armiesResult.data)
            setMiniatureArmies(resolution.candidates)
            if (resolution.kind === "create") {
              setArmyMode("create")
              setArmyLoading(false)
              result = { error: "Create an Army context before adding this Miniature." }
              return
            }
            if (resolution.kind === "select") {
              setArmyMode("select")
              setArmyLoading(false)
              result = { error: "Select an Army context before adding this Miniature." }
              return
            }
            setSelectedArmy(resolution.army)
            setArmyMode("idle")
            setArmyLoading(false)
            const miniResult = await addMiniatureToCollection(miniature, miniQuantity, miniPaintStatus, "owned", false, resolution.army)
            console.log("[v0] Miniature result:", miniResult)
            result = miniResult.success ? {} : { error: miniResult.error }
          } else {
            const miniResult = await addMiniatureToCollection(miniature, miniQuantity, miniPaintStatus, "owned", false, selectedArmy)
            console.log("[v0] Miniature result:", miniResult)
            result = miniResult.success ? {} : { error: miniResult.error }
          }
        }
      } else {
        console.log("[v0] Adding board game/RPG:", selectedGame)
        result = await addGameToCollection(selectedGame as BGGGameDetails, status, selectedCategory)
        console.log("[v0] Board game/RPG result:", result)
      }

      const handleCreateMiniatureArmy = async () => {
        const miniature = selectedGame as MiniatureSearchResult | null
        if (!miniature?.factionId || !armyName.trim()) return
        setArmyLoading(true)
        try {
          const result = await createMiniatureArmy(armyName, miniature.factionId)
          if (!result.success || !result.data) throw new Error(result.error)
          setSelectedArmy(result.data)
          setArmyMode("idle")
          setArmyName("")
          toast({ title: t("common.success"), description: `Army "${result.data.name}" selected.` })
        } catch (error) {
          toast({ title: t("common.error"), description: error instanceof Error ? error.message : "Unable to create Army.", variant: "destructive" })
        } finally {
          setArmyLoading(false)
        }
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

  const handleTcgGameChange = (game: typeof tcgGame) => {
    setTcgGame(game)
    setSearchResults([])
    setSelectedGame(null)
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <ArchiveCard>
        <ArchiveCardHeader>
          <ArchiveCardTitle className="text-2xl normal-case">{t("discover.title")}</ArchiveCardTitle>
          <p className="font-body text-muted-foreground mt-1">
            {t("discover.subtitle")}
          </p>
        </ArchiveCardHeader>
        <ArchiveCardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${t("discover.searchIn")} ${categoryConfig.sourceName}...`}
                className={cn("pl-10 font-body", archiveField)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <ArchiveCardButton
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              active
              icon={isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            >
              {isSearching ? t("common.searching") : t("common.search")}
            </ArchiveCardButton>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <ArchiveCardButton
                key={cat.id}
                active={cat.id === selectedCategory}
                onClick={() => handleCategoryChange(cat.id)}
              >
                {t(`collection.${cat.labelKey}`)}
              </ArchiveCardButton>
            ))}
          </div>

          {/* TCG Game Selector */}
          {selectedCategory === "trading_card" && (
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { id: "magic", label: "Magic: The Gathering" },
                { id: "pokemon", label: "Pokemon" },
                { id: "yugioh", label: "Yu-Gi-Oh!" },
                { id: "lorcana", label: "Lorcana" },
                { id: "flesh-and-blood", label: "Flesh & Blood" },
                { id: "one-piece", label: "One Piece" },
              ].map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleTcgGameChange(game.id as typeof tcgGame)}
                  className={`px-3 py-1.5 rounded-full text-sm font-body transition-colors ${
                    tcgGame === game.id
                      ? "bg-accent-gold text-background"
                      : "bg-surface/50 text-foreground hover:bg-accent-gold/20"
                  }`}
                >
                  {game.label}
                </button>
              ))}
            </div>
          )}

          <div className="text-sm text-muted-foreground font-body">
            {t("discover.searchingIn")}: <span className="text-accent-gold font-medium">{categoryConfig.sourceName}</span>
          </div>
        </ArchiveCardContent>
      </ArchiveCard>

      {/* Selected Game Detail */}
      {selectedGame && (
        <ArchiveCard>
          <ArchiveCardContent className="pt-6">
            <div className="flex gap-4">
              {((selectedGame as BGGGameDetails).thumbnail || (selectedGame as TCGSearchResult).imageUrl || (selectedGame as TCGSearchResult).thumbnailUrl) && (
                <img
                  src={(selectedGame as BGGGameDetails).thumbnail || (selectedGame as TCGSearchResult).imageUrl || (selectedGame as TCGSearchResult).thumbnailUrl || ""}
                  alt={selectedGame.name}
                  className="w-32 h-32 object-contain rounded"
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
                  {selectedCategory === "miniature" && (selectedGame as MiniatureSearchResult).factionName && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      {(selectedGame as MiniatureSearchResult).factionName}
                    </Badge>
                  )}
                  {selectedCategory === "miniature" && (selectedGame as MiniatureSearchResult).systemName && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      {(selectedGame as MiniatureSearchResult).systemName}
                    </Badge>
                  )}
                  {selectedCategory === "miniature" && (selectedGame as MiniatureSearchResult).basePoints && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30">
                      {(selectedGame as MiniatureSearchResult).basePoints} pts
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
                  <ArchiveIconButton type="button" icon={<span className="text-base leading-none">-</span>} onClick={() => setTcgQuantity(Math.max(1, tcgQuantity - 1))} aria-label="Vähennä" />
                  <Input type="number" min="1" value={tcgQuantity} onChange={(e) => setTcgQuantity(Math.max(1, parseInt(e.target.value) || 1))} className={cn("w-16 h-9 text-center", archiveField)} />
                  <ArchiveIconButton type="button" icon={<span className="text-base leading-none">+</span>} onClick={() => setTcgQuantity(tcgQuantity + 1)} aria-label="Lisää" />
                </div>
              </div>
            )}
            
            {/* Miniature quantity and paint status */}
            {selectedCategory === "miniature" && (
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-accent-gold/20">
                <div className="flex items-center gap-2">
                  <span className="text-accent-gold font-cinzel text-sm">{t("collection.quantity") || "Quantity"}:</span>
                  <div className="flex items-center gap-1">
                    <ArchiveIconButton type="button" icon={<span className="text-base leading-none">-</span>} onClick={() => setMiniQuantity(Math.max(1, miniQuantity - 1))} aria-label="Vähennä" />
                    <Input type="number" min="1" value={miniQuantity} onChange={(e) => setMiniQuantity(Math.max(1, parseInt(e.target.value) || 1))} className={cn("w-16 h-9 text-center", archiveField)} />
                    <ArchiveIconButton type="button" icon={<span className="text-base leading-none">+</span>} onClick={() => setMiniQuantity(miniQuantity + 1)} aria-label="Lisää" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent-gold font-cinzel text-sm">{t("collection.paintStatus") || "Paint Status"}:</span>
                  <select value={miniPaintStatus} onChange={(e) => setMiniPaintStatus(e.target.value as PaintStatus)} className={cn("h-9 rounded-md px-2 text-sm font-body", archiveField)}>
                    <option value="unpainted">{t("collection.unpainted") || "Unpainted"}</option>
                    <option value="primed">{t("collection.primed") || "Primed"}</option>
                    <option value="in_progress">{t("collection.inProgress") || "In Progress"}</option>
                    <option value="painted">{t("collection.painted") || "Painted"}</option>
                    <option value="based">{t("collection.based") || "Based"}</option>
                  </select>
                </div>
              </div>
            )}
            {selectedCategory === "miniature" && armyMode !== "idle" && (
              <div className="mt-4 rounded border border-accent-gold/20 p-3 space-y-2">
                {armyMode === "select" ? (
                  <>
                    <span className="text-accent-gold font-cinzel text-sm">Army context</span>
                    <select
                      value={selectedArmy?.id ?? ""}
                      onChange={(event) => setSelectedArmy(miniatureArmies.find((army) => army.id === event.target.value) ?? null)}
                      className={cn("h-9 w-full rounded-md px-2 text-sm", archiveField)}
                    >
                      <option value="">Select an Army</option>
                      {miniatureArmies.map((army) => <option key={army.id} value={army.id}>{army.name}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <span className="text-accent-gold font-cinzel text-sm">Create Army context</span>
                    <div className="flex gap-2">
                      <Input value={armyName} onChange={(event) => setArmyName(event.target.value)} placeholder="Army name" className={archiveField} />
                      <ArchiveCardButton type="button" onClick={handleCreateMiniatureArmy} disabled={armyLoading || !armyName.trim()}>
                        {armyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                      </ArchiveCardButton>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div className={`flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 ${selectedCategory !== "trading_card" && selectedCategory !== "miniature" ? "pt-4 border-t border-accent-gold/20" : ""}`}>
              <ArchiveCardButton onClick={() => setSelectedGame(null)} className="w-full sm:w-auto">
                {t("common.cancel")}
              </ArchiveCardButton>
              {selectedCategory !== "miniature" && (
                <ArchiveCardButton
                  onClick={() => handleAddGame('wishlist')}
                  disabled={addingGame !== null}
                  className="w-full sm:w-auto"
                  icon={addingGame?.type === 'wishlist' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                >
                  {t("collection.addToWishlist")}
                </ArchiveCardButton>
              )}
              <ArchiveCardButton
                onClick={() => handleAddGame('owned')}
                disabled={addingGame !== null || (selectedCategory === "miniature" && armyMode !== "idle" && !selectedArmy)}
                active
                className="w-full sm:w-auto"
                icon={addingGame?.type === 'collection' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              >
                {t("collection.addToCollection")}
              </ArchiveCardButton>
            </div>
          </ArchiveCardContent>
        </ArchiveCard>
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
) : selectedCategory === "board_game" ? (
  // Board games: group results so each base game is a HOST with its
  // expansions nested underneath (expansions never stand alone).
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {groupBoardResults(searchResults as BGGSearchResult[]).map((host) => (
      <ArchiveCard key={host.base.id} scrim={false} corners={false} centerOrnaments={false} className="overflow-hidden">
        {/* Base game (host) */}
        <button
          type="button"
          onClick={() => handleSelectGame(host.base.id)}
          className="w-full text-left cursor-pointer group"
        >
          <div className="flex">
            <div className="w-24 h-24 flex-shrink-0 bg-surface/30 flex items-center justify-center border-r border-accent-gold/10 overflow-hidden">
              {loadingDetails === host.base.id ? (
                <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
              ) : host.base.thumbnail ? (
                <img src={host.base.thumbnail} alt={host.base.name} className="w-full h-full object-cover" />
              ) : (
                <Dices className="h-10 w-10 text-accent-gold/40 group-hover:text-accent-gold/60 transition-colors" />
              )}
            </div>
            <div className="flex-1 p-4 flex items-center justify-between min-w-0">
              <div className="flex-1 min-w-0">
                <h4 className="font-heading font-medium text-lg truncate">{host.base.name}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {host.base.yearPublished && (
                    <Badge variant="outline" className="text-xs border-accent-gold/30 text-accent-gold">
                      {host.base.yearPublished}
                    </Badge>
                  )}
                  {host.expansions.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                      <Plus className="h-3 w-3" />
                      {t("game.expansionsOwnedShort", { count: host.expansions.length })}
                    </span>
                  )}
                </div>
              </div>
              <Plus className="h-5 w-5 text-accent-gold ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </button>

        {/* Nested expansions */}
        {host.expansions.length > 0 && (
          <ul className="border-t border-accent-gold/15 bg-surface/20">
            {host.expansions.map((exp) => (
              <li key={exp.id}>
                <button
                  type="button"
                  onClick={() => handleSelectGame(exp.id)}
                  className="w-full flex items-center gap-3 py-2 pl-4 pr-3 hover:bg-accent-gold/10 transition-colors text-left border-l-2 border-accent-gold/20 cursor-pointer group"
                >
                  <div className="w-10 h-10 flex-shrink-0 bg-surface/40 rounded overflow-hidden flex items-center justify-center">
                    {loadingDetails === exp.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-accent-gold" />
                    ) : exp.thumbnail ? (
                      <img src={exp.thumbnail} alt={exp.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dices className="h-5 w-5 text-accent-gold/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-body text-sm text-foreground/90 line-clamp-1">{exp.name}</span>
                    {exp.yearPublished && (
                      <span className="ml-1 text-xs text-muted-foreground">{exp.yearPublished}</span>
                    )}
                  </div>
                  <Plus className="h-4 w-4 text-accent-gold flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </ArchiveCard>
    ))}
  </div>
) : (
  <div className={`grid gap-4 ${selectedCategory === "trading_card" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
    {searchResults.map((game) => (
      selectedCategory === "trading_card" ? (
        // TCG Card display with image
        <ArchiveCard key={getSearchResultId(game)} scrim={false} corners={false} centerOrnaments={false} className="overflow-hidden cursor-pointer group" onClick={() => handleSelectGame(getSearchResultId(game))}>
          <div className="relative aspect-[2.5/3.5] bg-surface/50">
            {(game as TCGSearchResult).imageUrl ? (
              <img 
                src={(game as TCGSearchResult).imageUrl} 
                alt={game.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span className="text-xs text-center p-2">{t("common.noImage")}</span>
              </div>
            )}
            {loadingDetails === game.id && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-accent-gold" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus className="absolute bottom-2 right-2 h-6 w-6 text-accent-gold opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="p-2">
            <h4 className="font-body font-medium text-sm truncate">{game.name}</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {(game as TCGSearchResult).set && (
                <Badge variant="outline" className="text-[10px] border-accent-gold/30 text-accent-gold px-1 py-0">
                  {(game as TCGSearchResult).set}
                </Badge>
              )}
              {(game as TCGSearchResult).rarity && (
                <Badge variant="outline" className="text-[10px] border-accent-gold/30 text-accent-gold px-1 py-0">
                  {(game as TCGSearchResult).rarity}
                </Badge>
              )}
            </div>
            {(game as TCGSearchResult).price && (
              <p className="text-xs text-green-500 mt-1 font-body">${(game as TCGSearchResult).price?.toFixed(2)}</p>
            )}
          </div>
        </ArchiveCard>
      ) : (
        // Board game, RPG, Miniature display - with thumbnail or placeholder icon
        <ArchiveCard key={getSearchResultId(game)} scrim={false} corners={false} centerOrnaments={false} className="overflow-hidden cursor-pointer group" onClick={() => handleSelectGame(getSearchResultId(game))}>
          <div className="p-0">
            <div className="flex">
              {/* Thumbnail or category icon placeholder */}
              <div className="w-24 h-24 flex-shrink-0 bg-surface/30 flex items-center justify-center border-r border-accent-gold/10 overflow-hidden">
                {loadingDetails === getSearchResultId(game) ? (
                  <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
                ) : (game as BGGSearchResult).thumbnail ? (
                  <img 
                    src={(game as BGGSearchResult).thumbnail} 
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                ) : selectedCategory === "rpg" ? (
                  <BookOpen className="h-10 w-10 text-accent-gold/40 group-hover:text-accent-gold/60 transition-colors" />
                ) : selectedCategory === "miniature" ? (
                  <Swords className="h-10 w-10 text-accent-gold/40 group-hover:text-accent-gold/60 transition-colors" />
                ) : (
                  <Dices className="h-10 w-10 text-accent-gold/40 group-hover:text-accent-gold/60 transition-colors" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 p-4 flex items-center justify-between min-w-0">
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-medium text-lg truncate">{game.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(game as BGGSearchResult).yearPublished && (
                      <Badge variant="outline" className="text-xs border-accent-gold/30 text-accent-gold">
                        {(game as BGGSearchResult).yearPublished}
                      </Badge>
                    )}
                    {(game as MiniatureSearchResult).factionName && (
                      <Badge variant="outline" className="text-xs border-accent-gold/30 text-accent-gold">
                        {(game as MiniatureSearchResult).factionName}
                      </Badge>
                    )}
                  </div>
                </div>
                <Plus className="h-5 w-5 text-accent-gold ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </ArchiveCard>
      )
    ))}
  </div>
)}
        </div>
      )}
    </div>
  )
}
