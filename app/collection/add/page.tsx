"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArchiveCard,
  ArchiveCardHeader,
  ArchiveCardTitle,
  ArchiveCardContent,
  ArchiveButton,
  ArchiveCardButton,
  ArchiveIconButton,
  ArchiveToggle,
  archiveField,
} from "@/components/archive-frame"
import { ArchiveDivider } from "@/components/archive-divider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, ScanLine, Loader2, Plus, Minus, Star, Users, Clock, Puzzle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addGameToCollection, type AddGameResult } from "@/app/actions/games"
import { addCardToCollection } from "@/app/actions/tcg"
import {
  addMiniatureToCollection,
  createMiniatureArmy,
  getUserMiniatureArmies,
  importMiniaturesToCollection,
  type MiniatureArmyContext,
  type PaintStatus,
} from "@/app/actions/miniatures"
import { resolveMiniatureArmy } from "@/lib/miniatures/army-resolver"
import { validateMiniatureBulkImport, type ResolvedMiniatureImportRow } from "@/lib/miniatures/bulk-import"
import { useTranslations } from "@/lib/i18n"
import type { BGGSearchResult, BGGGameDetails } from "@/lib/types/database"
import type { TCGSearchResult } from "@/app/api/tcg/search/route"
import type { MiniatureSearchResult } from "@/app/api/miniatures/search/route"
import { getSearchResultId } from "@/lib/search-result-id"
import { BarcodeScanner } from "@/components/barcode-scanner"

type GameCategory = "board_game" | "rpg" | "trading_card" | "miniature"

// Union type for search results from different APIs
type SearchResult = BGGSearchResult | TCGSearchResult | MiniatureSearchResult
type GameDetails = BGGGameDetails | TCGSearchResult | MiniatureSearchResult

interface CategoryConfig {
  id: GameCategory
  image: string
  searchEndpoint: string
  detailsEndpoint: string
}

const categories: CategoryConfig[] = [
  { id: "board_game", image: "/images/category-board-games.png", searchEndpoint: "/api/bgg/search", detailsEndpoint: "/api/bgg/details" },
  { id: "rpg", image: "/images/category-rpg.png", searchEndpoint: "/api/rpgg/search", detailsEndpoint: "/api/rpgg/details" },
  { id: "trading_card", image: "/images/category-tcg.png", searchEndpoint: "/api/tcg/search", detailsEndpoint: "/api/tcg/details" },
  { id: "miniature", image: "/images/category-miniatures.png", searchEndpoint: "/api/miniatures/search", detailsEndpoint: "/api/miniatures/details" },
]

// A base game with its expansions nested underneath. `synthetic` means the base
// game itself was not in the search results (we inferred it from an expansion's
// baseGame link) — we still show it as a host so expansions never stand alone.
type BoardHost = {
  base: BGGSearchResult
  synthetic: boolean
  expansions: BGGSearchResult[]
}

function groupBoardResults(results: BGGSearchResult[]): BoardHost[] {
  const validResults = results.filter(
    (result): result is BGGSearchResult =>
      Boolean(result) &&
      Number.isFinite(result.id) &&
      typeof result.name === "string",
  )

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
  for (const result of validResults) {
    if (result.type !== "expansion") ensureHost(result, false)
  }

  // Second pass: nest expansions under their base. If the API gives incomplete
  // base-game metadata, keep the expansion visible as its own fallback result.
  for (const result of validResults) {
    if (result.type !== "expansion") continue

    const baseId = result.baseGame?.bggId
    const baseName = result.baseGame?.name

    if (Number.isFinite(baseId) && typeof baseName === "string" && baseName.trim()) {
      const hadBase = hostsById.has(baseId)
      const base: BGGSearchResult = hostsById.get(baseId)?.base ?? {
        id: baseId,
        name: baseName,
        yearPublished: null,
        thumbnail: null,
        type: "base",
        baseGame: null,
      }
      ensureHost(base, !hadBase).expansions.push(result)
    } else {
      // No usable base info — show the expansion as its own host instead of
      // allowing malformed metadata to break the result list.
      ensureHost(result, false)
    }
  }

  return order.flatMap((id) => {
    const host = hostsById.get(id)
    return host ? [host] : []
  })
}

export default function AddGamePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"manual" | "bulk">("manual")
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("board_game")
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [barcodeScanning, setBarcodeScanning] = useState(false)
  const [barcodeCandidate, setBarcodeCandidate] = useState<string | null>(null)
  const [barcodeMappingHit, setBarcodeMappingHit] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [addingGameId, setAddingGameId] = useState<number | string | null>(null)
  const [selectedGame, setSelectedGame] = useState<GameDetails | null>(null)
  const [tcgQuantity, setTcgQuantity] = useState(1)
  const [tcgGame, setTcgGame] = useState<"magic" | "pokemon" | "yugioh" | "lorcana" | "flesh-and-blood" | "one-piece">("magic")
  const [miniQuantity, setMiniQuantity] = useState(1)
  const [miniPaintStatus, setMiniPaintStatus] = useState<PaintStatus>("unpainted")
  const [miniatureArmies, setMiniatureArmies] = useState<MiniatureArmyContext[]>([])
  const [selectedArmy, setSelectedArmy] = useState<MiniatureArmyContext | null>(null)
  const [armyMode, setArmyMode] = useState<"idle" | "select" | "create">("idle")
  const [armyName, setArmyName] = useState("")
  const [armyLoading, setArmyLoading] = useState(false)
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
    imageUrl: "",
  })
  const [savingManual, setSavingManual] = useState(false)
  
  // Bulk import state
  const [bulkText, setBulkText] = useState("")
  const [parsedItems, setParsedItems] = useState<Array<{ name: string; quantity: number; setCode?: string }>>([])
  const [importingBulk, setImportingBulk] = useState(false)

  // Miniatures Bulk Import (Collection mass-add, owned = true) needs its own
  // Army context resolution state, independent of the "search" tab's Army
  // state above, because mini_army_units.army_id is required for every row.
  const [bulkArmyMode, setBulkArmyMode] = useState<"idle" | "select" | "create">("idle")
  const [bulkArmies, setBulkArmies] = useState<MiniatureArmyContext[]>([])
  const [bulkSelectedArmyId, setBulkSelectedArmyId] = useState("")
  const [bulkArmyName, setBulkArmyName] = useState("")
  const [bulkArmyLoading, setBulkArmyLoading] = useState(false)
  const [pendingImportRows, setPendingImportRows] = useState<ResolvedMiniatureImportRow[] | null>(null)

  const categoryConfig = categories.find(c => c.id === selectedCategory)!

  const boardHosts =
    selectedCategory === "board_game"
      ? groupBoardResults(searchResults as BGGSearchResult[])
      : []

  const handleSearch = async (queryOverride?: string): Promise<SearchResult[]> => {
    const query = (queryOverride ?? searchQuery).trim()
    if (!query) return []

    setSearching(true)
    setSearchResults([])
    setSelectedGame(null)
    setBarcodeMappingHit(false)

    try {
      // TCG API uses 'q' parameter and needs 'game', BGG/RPGG use 'query'
      let url = ""
      if (selectedCategory === "trading_card") {
        url = `${categoryConfig.searchEndpoint}?q=${encodeURIComponent(query)}&game=${tcgGame}`
      } else {
        url = `${categoryConfig.searchEndpoint}?query=${encodeURIComponent(searchQuery)}`
      }
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const results = (data.results || []) as SearchResult[]
      setSearchResults(results)
      return results
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: t("common.error"),
        description: t("collection.searchFailed"),
        variant: "destructive",
      })
      return []
    } finally {
      setSearching(false)
    }
  }

  const handleSelectGame = async (gameId: number | string) => {
    setLoadingDetails(true)
    setTcgQuantity(1) // Reset quantity for new selection
    setMiniQuantity(1)
    setMiniPaintStatus("unpainted")
    setMiniatureArmies([])
    setSelectedArmy(null)
    setArmyMode("idle")
    try {
      // For TCG, also pass game type
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
        setLoadingDetails(false)
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
      setLoadingDetails(false)
    }
  }

  const handleBarcodeDetected = useCallback(async (barcode: string) => {
    setBarcodeScanning(false)
    setBarcodeCandidate(barcode)
    setBarcodeMappingHit(false)
    setSearching(true)

    try {
      if (selectedCategory !== "board_game" && selectedCategory !== "rpg") {
        return
      }

      const response = await fetch(
        `/api/barcode/resolve?barcode=${encodeURIComponent(barcode)}&category=${selectedCategory}`,
      )
      const data = await response.json()

      if (data.resolved && data.externalGameId) {
        if (data.source === "mapping") {
          setBarcodeCandidate(null)
          setBarcodeMappingHit(true)
        }
        await handleSelectGame(data.externalGameId)
        return
      }

      const suggestedQuery = data.suggestedQuery || data.providerResult?.name
      if (suggestedQuery) {
        setSearchQuery(suggestedQuery)
        const results = await handleSearch(suggestedQuery)
        const firstResult = results[0]
        if (firstResult) {
          await handleSelectGame(getSearchResultId(firstResult))
          return
        }
      }

      setSearchQuery(barcode)
      toast({
        title: "Viivakoodi tunnistettu",
        description: "Peliä ei löytynyt suoraan. Haku voidaan tehdä viivakoodin perusteella.",
      })
    } catch (error) {
      console.error("Barcode resolve error:", error)
      toast({
        title: t("common.error"),
        description: "Viivakoodin käsittely epäonnistui. Voit hakea pelin nimellä.",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }, [handleSearch, handleSelectGame, selectedCategory, t, toast])

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

  const handleAddGame = async () => {
    if (!selectedGame) return
    
    setAddingGameId(getSearchResultId(selectedGame))

    try {
      let result: AddGameResult

      if (selectedCategory === "trading_card") {
        // Use TCG-specific action
        const tcgResult = await addCardToCollection(selectedGame as TCGSearchResult, tcgQuantity, "owned")
        result = tcgResult.success ? {} : { error: tcgResult.error }
      } else if (selectedCategory === "miniature") {
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
          result = miniResult.success ? {} : { error: miniResult.error }
        } else {
          const miniResult = await addMiniatureToCollection(miniature, miniQuantity, miniPaintStatus, "owned", false, selectedArmy)
          result = miniResult.success ? {} : { error: miniResult.error }
        }
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
    console.log("handleManualSubmit called with:", manualForm, "category:", selectedCategory)
    
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
        image: manualForm.imageUrl || null,
        thumbnail: manualForm.imageUrl || null,
      }

      console.log("Calling addGameToCollection with:", gameDetails)
      const result = await addGameToCollection(gameDetails, "owned", selectedCategory, true)
      console.log("addGameToCollection result:", result)

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
    setActiveTab("manual")
    setBarcodeCandidate(null)
    setBarcodeMappingHit(false)
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

  // Performs the actual Collection write once Army context is resolved. All
  // rows use owned = true - this is a physical Collection mass-add, not a
  // roster/army-planning import (see WP-004G/WP-004H).
  const runMiniatureBulkImport = async (
    rows: ResolvedMiniatureImportRow[],
    army: Pick<MiniatureArmyContext, "id" | "factionId">,
  ) => {
    const result = await importMiniaturesToCollection(
      rows.map((row) => ({ catalogId: row.catalogId, modelCount: row.modelCount })),
      army,
    )

    setImportingBulk(false)
    setBulkArmyMode("idle")
    setBulkArmies([])
    setBulkSelectedArmyId("")
    setBulkArmyName("")
    setPendingImportRows(null)

    if (result.success) {
      setBulkText("")
      setParsedItems([])
      toast({
        title: t("common.success"),
        description: `Imported ${result.insertedCount ?? rows.length} items`,
      })
      router.push("/collection")
    } else {
      toast({
        title: t("common.error"),
        description: result.error || "Import failed",
        variant: "destructive",
      })
    }
  }

  const handleBulkArmySelect = async () => {
    if (!pendingImportRows || !bulkSelectedArmyId) return
    const army = bulkArmies.find((a) => a.id === bulkSelectedArmyId)
    if (!army) return
    setImportingBulk(true)
    await runMiniatureBulkImport(pendingImportRows, army)
  }

  const handleBulkArmyCreate = async () => {
    if (!pendingImportRows || !bulkArmyName.trim()) return
    const factionId = pendingImportRows[0]?.factionId
    if (!factionId) return

    setBulkArmyLoading(true)
    try {
      const result = await createMiniatureArmy(bulkArmyName, factionId)
      if (!result.success || !result.data) throw new Error(result.error)
      setBulkArmyLoading(false)
      setImportingBulk(true)
      await runMiniatureBulkImport(pendingImportRows, result.data)
    } catch (error) {
      setBulkArmyLoading(false)
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Unable to create Army.",
        variant: "destructive",
      })
    }
  }

  const handleBulkImport = async () => {
    if (parsedItems.length === 0) return
    
    setImportingBulk(true)

    if (selectedCategory === "miniature") {
      try {
        // Resolve and validate the ENTIRE import before creating any Army or
        // ownership rows (partial import safety) - the same contract as the
        // Miniatures Bulk Import in components/import-section.tsx.
        const searchResultsByLine = await Promise.all(
          parsedItems.map(async (item) => {
            const response = await fetch(`/api/miniatures/search?query=${encodeURIComponent(item.name)}`)
            const data = await response.json()
            return (data.results || []) as MiniatureSearchResult[]
          }),
        )

        const validation = validateMiniatureBulkImport(parsedItems, searchResultsByLine)
        if (!validation.success) {
          setImportingBulk(false)
          const names = validation.issues.map((issue) => issue.name).join(", ")
          toast({
            title: t("common.error"),
            description: names ? `${validation.error}: ${names}` : validation.error,
            variant: "destructive",
          })
          return
        }

        const armiesResult = await getUserMiniatureArmies()
        if (!armiesResult.success) {
          setImportingBulk(false)
          toast({ title: t("common.error"), description: armiesResult.error, variant: "destructive" })
          return
        }

        const resolution = resolveMiniatureArmy(validation.factionId, armiesResult.data)
        if (resolution.kind === "auto") {
          await runMiniatureBulkImport(validation.rows, resolution.army)
          return
        }

        // Needs user input: select among multiple compatible Armies, or create one.
        setBulkArmies(resolution.candidates)
        setPendingImportRows(validation.rows)
        setBulkArmyMode(resolution.kind)
        setImportingBulk(false)
      } catch {
        setImportingBulk(false)
        toast({
          title: t("common.error"),
          description: "Import failed",
          variant: "destructive",
        })
      }
      return
    }

    // Trading cards keep their existing per-line best-effort import.
    let successCount = 0
    let errorCount = 0

    for (const item of parsedItems) {
      try {
        const response = await fetch(`/api/tcg/search?q=${encodeURIComponent(item.name)}&game=${tcgGame}`)
        const data = await response.json()

        if (data.results && data.results.length > 0) {
          const card = data.results[0] as TCGSearchResult
          const result = await addCardToCollection(card, item.quantity, "owned")
          if (result.success) successCount++
          else errorCount++
        } else {
          errorCount++
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
          <div className="flex items-center gap-4 mb-8">
            <ArchiveButton icon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.back()}>
              {t("collection.back")}
            </ArchiveButton>
            <h1 className="ornate-text font-heading text-3xl font-bold">{t("collection.addGame")}</h1>
          </div>

          {/* Category Selector */}
          <ArchiveCard className="mb-6">
            <ArchiveCardHeader>
              <ArchiveCardTitle>{t("collection.selectCategory")}</ArchiveCardTitle>
            </ArchiveCardHeader>
            <ArchiveCardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map(({ id, image }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selectedCategory === id}
                    onClick={() => handleCategoryChange(id)}
                    className={`group relative flex min-h-[150px] flex-col items-center justify-center rounded-xl px-3 py-4 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--archive-gold,#d9b65c)]/70 ${
                      selectedCategory === id
                        ? "bg-[var(--archive-gold,#d9b65c)]/10 ring-2 ring-[var(--archive-gold,#d9b65c)]/80 shadow-[0_0_24px_rgba(217,182,92,0.22)]"
                        : "bg-black/10 ring-1 ring-[var(--archive-gold,#d9b65c)]/20 hover:bg-[var(--archive-gold,#d9b65c)]/5 hover:ring-[var(--archive-gold,#d9b65c)]/45"
                    }`}
                  >
                    <img
                      src={image}
                      alt={t(`collection.${id === "board_game" ? "boardGames" : id === "rpg" ? "rpgs" : id === "trading_card" ? "tradingCards" : "miniatures"}`)}
                      className="h-24 w-full object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)] transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="mt-2 font-cinzel text-sm font-semibold text-foreground">
                      {t(`collection.${id === "board_game" ? "boardGames" : id === "rpg" ? "rpgs" : id === "trading_card" ? "tradingCards" : "miniatures"}`)}
                    </span>
                  </button>
                ))}
              </div>
            </ArchiveCardContent>
          </ArchiveCard>

          {/* Search/Manual Tabs */}
          <ArchiveCard>
            <ArchiveCardContent className="pt-6">
              {/* Physical game identification */}
              {(selectedCategory === "board_game" || selectedCategory === "rpg") && (
                <div className="space-y-4">
                  {!barcodeScanning ? (
                    <ArchiveButton
                      type="button"
                      onClick={() => setBarcodeScanning(true)}
                      icon={<ScanLine className="h-4 w-4" />}
                      fullWidth
                    >
                      Skannaa viivakoodi
                    </ArchiveButton>
                  ) : (
                    <BarcodeScanner
                      onDetected={handleBarcodeDetected}
                      onClose={() => setBarcodeScanning(false)}
                    />
                  )}

                  {barcodeMappingHit && selectedGame && (
                    <div className="flex items-center gap-2 rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-3 py-2">
                      <span className="text-sm text-accent-gold" aria-hidden="true">✓</span>
                      <p className="text-xs text-muted-foreground font-body">
                        Viivakoodi tunnistettu GameTablen omasta varmistetusta tunnistuksesta.
                      </p>
                    </div>
                  )}

                  {barcodeCandidate && selectedGame && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-3 py-2">
                      <p className="text-xs text-muted-foreground font-body">
                        Löytyikö tämä peli viivakoodilla? Vahvista tunnistus, jotta GameTable muistaa yhdistelmän jatkossa.
                      </p>
                      <ArchiveButton
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/barcode/confirm", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                barcode: barcodeCandidate,
                                category: selectedCategory,
                                externalGameId: String((selectedGame as BGGGameDetails).id),
                              }),
                            })
                            const data = await response.json()
                            if (!response.ok) throw new Error(data.error || "Vahvistus epäonnistui")
                            setBarcodeCandidate(null)
                            toast({ title: t("common.success"), description: "Viivakoodiyhdistelmä tallennettu." })
                          } catch (error) {
                            toast({
                              title: t("common.error"),
                              description: error instanceof Error ? error.message : "Viivakoodiyhdistelmän tallennus epäonnistui.",
                              variant: "destructive",
                            })
                          }
                        }}
                        className="shrink-0"
                      >
                        Vahvista
                      </ArchiveButton>
                    </div>
                  )}
                </div>
              )}

              {/* TCG game selector */}
              {selectedCategory === "trading_card" && (
                <div className="mb-6 space-y-3">
                  <p className="font-body text-sm text-muted-foreground">Valitse korttipeli</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "magic", label: "Magic: The Gathering" },
                      { id: "pokemon", label: "Pokémon" },
                      { id: "yugioh", label: "Yu-Gi-Oh!" },
                      { id: "lorcana", label: "Disney Lorcana" },
                      { id: "flesh-and-blood", label: "Flesh & Blood" },
                      { id: "one-piece", label: "One Piece" },
                      { id: "riftbound", label: "Riftbound" },
                      { id: "digimon", label: "Digimon Card Game" },
                      { id: "gundam", label: "Gundam Card Game" },
                      { id: "star-wars-unlimited", label: "Star Wars: Unlimited" },
                      { id: "dragon-ball-fusion-world", label: "Dragon Ball Super: Fusion World" },
                    ].map((game) => (
                      <ArchiveCardButton
                        key={game.id}
                        type="button"
                        active={tcgGame === game.id}
                        onClick={() => {
                          setTcgGame(game.id as typeof tcgGame)
                          setSearchResults([])
                          setSelectedGame(null)
                        }}
                      >
                        <span className="normal-case">{game.label}</span>
                      </ArchiveCardButton>
                    ))}
                  </div>
                </div>
              )}

              {/* Import / manual are the only Add Game entry methods. External search lives on Etsi peli. */}
              <div className="mb-6 flex justify-center">
                <ArchiveToggle
                  value={activeTab}
                  onChange={(v) => setActiveTab(v)}
                  options={[
                    { value: "manual", label: t("collection.manualEntry") },
                    ...(selectedCategory === "trading_card" || selectedCategory === "miniature"
                      ? [{ value: "bulk" as const, label: t("collection.bulkImport") }]
                      : []),
                  ]}
                />
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
                            {selectedCategory === "miniature" && (selectedGame as MiniatureSearchResult).modelCountMin && (
                              <Badge variant="outline" className="text-xs border-accent-gold/30">
                                {(selectedGame as MiniatureSearchResult).modelCountMin} models
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
                            <ArchiveIconButton
                              type="button"
                              aria-label={t("collection.decrease") || "Decrease"}
                              onClick={() => setTcgQuantity(Math.max(1, tcgQuantity - 1))}
                              icon={<Minus className="h-4 w-4" />}
                            />
                            <Input
                              type="number"
                              min="1"
                              value={tcgQuantity}
                              onChange={(e) => setTcgQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 h-8 text-center"
                            />
                            <ArchiveIconButton
                              type="button"
                              aria-label={t("collection.increase") || "Increase"}
                              onClick={() => setTcgQuantity(tcgQuantity + 1)}
                              icon={<Plus className="h-4 w-4" />}
                            />
                          </div>
                        </div>
                      )}
                      {/* Miniature quantity and paint status */}
                      {selectedCategory === "miniature" && (
                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-accent-gold/20">
                          <div className="flex items-center gap-2">
                            <Label className="text-accent-gold font-cinzel text-sm">{t("collection.quantity") || "Quantity"}:</Label>
                            <div className="flex items-center gap-1">
                              <ArchiveIconButton
                                type="button"
                                aria-label={t("collection.decrease") || "Decrease"}
                                onClick={() => setMiniQuantity(Math.max(1, miniQuantity - 1))}
                                icon={<Minus className="h-4 w-4" />}
                              />
                              <Input
                                type="number"
                                min="1"
                                value={miniQuantity}
                                onChange={(e) => setMiniQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 h-8 text-center"
                              />
                              <ArchiveIconButton
                                type="button"
                                aria-label={t("collection.increase") || "Increase"}
                                onClick={() => setMiniQuantity(miniQuantity + 1)}
                                icon={<Plus className="h-4 w-4" />}
                              />
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
                      {selectedCategory === "miniature" && armyMode !== "idle" && (
                        <div className="mt-4 rounded border border-accent-gold/20 p-3 space-y-2">
                          {armyMode === "select" ? (
                            <>
                              <Label className="text-accent-gold font-cinzel text-sm">Army context</Label>
                              <select
                                value={selectedArmy?.id ?? ""}
                                onChange={(event) => setSelectedArmy(miniatureArmies.find((army) => army.id === event.target.value) ?? null)}
                                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                              >
                                <option value="">Select an Army</option>
                                {miniatureArmies.map((army) => <option key={army.id} value={army.id}>{army.name}</option>)}
                              </select>
                            </>
                          ) : (
                            <>
                              <Label className="text-accent-gold font-cinzel text-sm">Create Army context</Label>
                              <div className="flex gap-2">
                                <Input value={armyName} onChange={(event) => setArmyName(event.target.value)} placeholder="Army name" />
                                <ArchiveButton type="button" onClick={handleCreateMiniatureArmy} disabled={armyLoading || !armyName.trim()}>
                                  {armyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                                </ArchiveButton>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <div className={`flex justify-end gap-3 mt-4 ${selectedCategory !== "trading_card" && selectedCategory !== "miniature" ? "pt-4 border-t border-accent-gold/20" : ""}`}>
                        <ArchiveButton onClick={() => setSelectedGame(null)}>
                          {t("common.cancel")}
                        </ArchiveButton>
                        <ArchiveButton
                          onClick={handleAddGame}
                          disabled={addingGameId === getSearchResultId(selectedGame) || (selectedCategory === "miniature" && armyMode !== "idle" && !selectedArmy)}
                          icon={
                            addingGameId === getSearchResultId(selectedGame) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )
                          }
                        >
                          {t("collection.addToCollection")}
                        </ArchiveButton>
                      </div>
                    </div>
                  )}



              {/* Manual Entry Tab */}
              {activeTab === "manual" && (
                <div className="space-y-6">
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
                        className={`mt-1 font-body ${archiveField}`}
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
                          className={`mt-1 font-body ${archiveField}`}
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
                            className={`mt-1 font-body ${archiveField}`}
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
                            className={`mt-1 font-body ${archiveField}`}
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
                          className={`mt-1 font-body ${archiveField}`}
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
                          className={`mt-1 font-body ${archiveField}`}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="imageUrl" className="text-accent-gold font-cinzel text-sm uppercase tracking-wider">
                        {t("collection.imageUrl") || "Image URL"}
                      </Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        value={manualForm.imageUrl}
                        onChange={(e) => setManualForm({ ...manualForm, imageUrl: e.target.value })}
                        placeholder="https://example.com/game-image.jpg"
                        className={`mt-1 font-body ${archiveField}`}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("collection.imageUrlHelp") || "Optional: Paste a URL to an image of the game"}
                      </p>
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
                        className={`mt-1 w-full min-h-[100px] rounded-md px-3 py-2 text-sm font-body focus-visible:outline-none ${archiveField}`}
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <ArchiveButton
                        onClick={handleManualSubmit}
                        disabled={savingManual || !manualForm.name.trim()}
                        icon={
                          savingManual ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )
                        }
                      >
                        {t("collection.addToCollection")}
                      </ArchiveButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Import Tab (only for TCG and Miniatures) */}
              {activeTab === "bulk" && (selectedCategory === "trading_card" || selectedCategory === "miniature") && (
                <div className="space-y-6">
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
                          className={`mt-1 w-full min-h-[150px] rounded-md px-3 py-2 text-sm font-mono focus-visible:outline-none ${archiveField}`}
                        />
                      </div>

                      <ArchiveButton onClick={handleParseBulk} fullWidth>
                        {t("collection.parseList")}
                      </ArchiveButton>

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

                          <ArchiveButton
                            onClick={handleBulkImport}
                            disabled={importingBulk || bulkArmyMode !== "idle"}
                            fullWidth
                            icon={
                              importingBulk ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )
                            }
                          >
                            {importingBulk
                              ? "Importing..."
                              : `${t("collection.importAll")} (${parsedItems.length})`}
                          </ArchiveButton>
                        </div>
                      )}

                      {selectedCategory === "miniature" && bulkArmyMode !== "idle" && (
                        <div className="border border-accent-gold/20 rounded-lg p-3 space-y-2">
                          {bulkArmyMode === "select" ? (
                            <>
                              <Label className="text-accent-gold font-cinzel text-sm">Army context</Label>
                              <select
                                value={bulkSelectedArmyId}
                                onChange={(e) => setBulkSelectedArmyId(e.target.value)}
                                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                              >
                                <option value="">Select an Army</option>
                                {bulkArmies.map((army) => (
                                  <option key={army.id} value={army.id}>
                                    {army.name}
                                  </option>
                                ))}
                              </select>
                              <ArchiveButton
                                onClick={handleBulkArmySelect}
                                disabled={!bulkSelectedArmyId || importingBulk}
                                fullWidth
                                icon={importingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                              >
                                Import to selected Army
                              </ArchiveButton>
                            </>
                          ) : (
                            <>
                              <Label className="text-accent-gold font-cinzel text-sm">Create Army context</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={bulkArmyName}
                                  onChange={(e) => setBulkArmyName(e.target.value)}
                                  placeholder="Army name"
                                />
                                <ArchiveButton
                                  type="button"
                                  onClick={handleBulkArmyCreate}
                                  disabled={bulkArmyLoading || importingBulk || !bulkArmyName.trim()}
                                >
                                  {bulkArmyLoading || importingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & Import"}
                                </ArchiveButton>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                </div>
              )}
            </ArchiveCardContent>
          </ArchiveCard>
        </div>
      </main>
    </div>
  )
}