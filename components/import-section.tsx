"use client"

import { useState } from "react"
import { ArchiveCard, ArchiveCardButton, ArchiveCardContent, archiveField } from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Download, Loader2, Plus, FileText } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { addCardToCollection } from "@/app/actions/tcg"
import {
  createMiniatureArmy,
  getUserMiniatureArmies,
  importMiniaturesToCollection,
  type MiniatureArmyContext,
} from "@/app/actions/miniatures"
import { addGameToCollection } from "@/app/actions/games"
import type { TCGSearchResult } from "@/app/api/tcg/search/route"
import type { MiniatureSearchResult } from "@/app/api/miniatures/search/route"
import { resolveMiniatureArmy } from "@/lib/miniatures/army-resolver"
import { validateMiniatureBulkImport, type ResolvedMiniatureImportRow } from "@/lib/miniatures/bulk-import"
import type { BGGCollectionItem } from "@/app/api/bgg/collection/route"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/useUser"

type CategoryType = "board-games" | "rpgs" | "miniatures" | "trading-cards"

interface ImportSectionProps {
  selectedCategory: CategoryType
  onImportComplete?: () => void
}

export function ImportSection({ selectedCategory, onImportComplete }: ImportSectionProps) {
  const [username, setUsername] = useState("")
  const [importing, setImporting] = useState(false)
  
  // Bulk import state for TCG/miniatures
  const [bulkText, setBulkText] = useState("")
  const [parsedItems, setParsedItems] = useState<Array<{ name: string; quantity: number; setCode?: string }>>([])
  const [importingBulk, setImportingBulk] = useState(false)

  // Miniatures Bulk Import is a Collection mass-add (owned = true). Because
  // mini_army_units.army_id is required, a validated import may still need
  // Army context resolved/selected/created before the write happens.
  const [bulkArmyMode, setBulkArmyMode] = useState<"idle" | "select" | "create">("idle")
  const [bulkArmies, setBulkArmies] = useState<MiniatureArmyContext[]>([])
  const [bulkSelectedArmyId, setBulkSelectedArmyId] = useState("")
  const [bulkArmyName, setBulkArmyName] = useState("")
  const [bulkArmyLoading, setBulkArmyLoading] = useState(false)
  const [pendingImportRows, setPendingImportRows] = useState<ResolvedMiniatureImportRow[] | null>(null)
  
  const t = useTranslations()
  const { toast } = useToast()
  const { user } = useUser()

  // Check if this category supports username import
  const supportsUsernameImport = selectedCategory === "board-games" || selectedCategory === "rpgs"

  const getPlaceholder = () => {
    switch (selectedCategory) {
      case "board-games":
        return t("collection.bggUsernamePlaceholder") || "Enter your BoardGameGeek username"
      case "rpgs":
        return t("collection.rpggUsernamePlaceholder") || "Enter your RPGGeek username"
      default:
        return "Enter your username"
    }
  }

  const getSourceName = () => {
    switch (selectedCategory) {
      case "board-games":
        return "BoardGameGeek"
      case "rpgs":
        return "RPGGeek"
      default:
        return "External Source"
    }
  }

  const handleImport = async () => {
    console.log("[v0] handleImport CLICKED - username:", username, "category:", selectedCategory)
    
    if (!username.trim()) {
      console.log("[v0] handleImport: Empty username, returning")
      return
    }
    
    setImporting(true)
    console.log("[v0] handleImport: Starting import for user:", username)
    try {
      console.log("[v0] Importing from", getSourceName(), "for user:", username)
      
      // Determine the API endpoint based on category
      const apiUrl = selectedCategory === "board-games" 
        ? `/api/bgg/collection?username=${encodeURIComponent(username)}`
        : `/api/rpgg/collection?username=${encodeURIComponent(username)}`
      
      const response = await fetch(apiUrl)
      const data = await response.json()
      
      console.log("[v0] Collection API response:", data)
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      const items: BGGCollectionItem[] = data.items || []
      
      if (items.length === 0) {
        toast({
          title: t("common.info") || "Info",
          description: t("collection.noItemsToImport") || "No items found in your collection to import",
        })
        return
      }
      
      // Import each game
      let successCount = 0
      let errorCount = 0
      
      for (const item of items) {
        try {
          // Fetch full details for each game
          const detailsUrl = selectedCategory === "board-games"
            ? `/api/bgg/details?id=${item.id}`
            : `/api/rpgg/details?id=${item.id}`
          
          const detailsResponse = await fetch(detailsUrl)
          const details = await detailsResponse.json()
          
          if (details && details.id) {
            const status = item.status.own ? 'owned' : 'wishlist'
            const category = selectedCategory === "board-games" ? 'board_game' : 'rpg'
            
            const result = await addGameToCollection(details, status, category, false, true)
            
            if (result.error && result.error !== 'Game already in your collection') {
              errorCount++
            } else {
              successCount++
            }

          } else {
            errorCount++
          }
        } catch (e) {
          console.error("[v0] Error importing game:", item.name, e)
          errorCount++
        }
      }

      toast({
        title: t("common.success"),
        description: `${t("collection.imported") || "Imported"} ${successCount} ${t("collection.items") || "games"}${errorCount > 0 ? `, ${errorCount} ${t("collection.failed") || "failed"}` : ""}`,
      })
      
      if (successCount > 0 && onImportComplete) {
        onImportComplete()
      }
    } catch (error) {
      console.error("[v0] Import error:", error)
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : (t("collection.importFailed") || "Import failed"),
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
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
  // roster/army-planning import.
  const runMiniatureImport = async (
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
        description: `${t("collection.imported") || "Imported"} ${result.insertedCount ?? rows.length} ${t("collection.items") || "items"}`,
      })
      if (onImportComplete) onImportComplete()
    } else {
      toast({
        title: t("common.error"),
        description: result.error || (t("collection.importFailed") || "Import failed"),
        variant: "destructive",
      })
    }
  }

  const handleBulkImportMiniatures = async () => {
    setImportingBulk(true)
    try {
      // Resolve and validate the ENTIRE import before creating any Army or
      // ownership rows (partial import safety).
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
        await runMiniatureImport(validation.rows, resolution.army)
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
        description: t("collection.importFailed") || "Import failed",
        variant: "destructive",
      })
    }
  }

  const handleBulkArmySelect = async () => {
    if (!pendingImportRows || !bulkSelectedArmyId) return
    const army = bulkArmies.find((a) => a.id === bulkSelectedArmyId)
    if (!army) return
    setImportingBulk(true)
    await runMiniatureImport(pendingImportRows, army)
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
      await runMiniatureImport(pendingImportRows, result.data)
    } catch (error) {
      setBulkArmyLoading(false)
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Unable to create Army.",
        variant: "destructive",
      })
    }
  }

  const handleBulkImportTCG = async () => {
    setImportingBulk(true)
    let successCount = 0
    let errorCount = 0

    for (const item of parsedItems) {
      try {
        const response = await fetch(`/api/tcg/search?q=${encodeURIComponent(item.name)}&game=mtg`)
        const data = await response.json()

        if (data.results && data.results.length > 0) {
          const card = data.results[0] as TCGSearchResult
          const result = await addCardToCollection(card, item.quantity, "owned", true)
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
    setBulkText("")
    setParsedItems([])

    toast({
      title: t("common.success"),
      description: `${t("collection.imported") || "Imported"} ${successCount} ${t("collection.items") || "items"}${errorCount > 0 ? `, ${errorCount} ${t("collection.failed") || "failed"}` : ""}`,
    })

    if (successCount > 0 && onImportComplete) {
      onImportComplete()
    }
  }

  const handleBulkImport = async () => {
    if (parsedItems.length === 0) return

    if (selectedCategory === "miniatures") {
      await handleBulkImportMiniatures()
      return
    }

    if (selectedCategory === "trading-cards") {
      await handleBulkImportTCG()
    }
  }

  // Render username import for board games and RPGs
  if (supportsUsernameImport) {
    return (
      <ArchiveCard className="mb-6">
        <ArchiveCardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={getPlaceholder()}
                className={cn("w-full", archiveField)}
              />
            </div>
            <ArchiveCardButton
              onClick={handleImport}
              active={!!username.trim()}
              disabled={!username.trim() || importing}
              icon={
                importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />
              }
            >
              {t("collection.importFrom") || "Import from"} {getSourceName()}
            </ArchiveCardButton>
          </div>
          <p className="text-sm text-muted-foreground font-body mt-2">
            {t("collection.importDescription") || `Import your collection from ${getSourceName()} by entering your username`}
          </p>
        </ArchiveCardContent>
      </ArchiveCard>
    )
  }

  // Render bulk import for miniatures and trading cards
  return (
    <ArchiveCard className="mb-6">
      <ArchiveCardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-accent-gold" />
          <h3 className="font-heading text-lg text-accent-gold">
            {t("collection.bulkImport") || "Bulk Import"}
          </h3>
        </div>
        
        <p className="text-sm text-muted-foreground font-body mb-4">
          {selectedCategory === "trading-cards" 
            ? (t("collection.bulkImportTCGDescription") || "Paste your deck list to import multiple cards at once. Format: '4 Lightning Bolt' or '4x Dark Ritual'")
            : (t("collection.bulkImportMiniDescription") || "Paste your army list to import multiple units at once. Format: '10 Intercessors' or '5x Hellblasters'")
          }
        </p>

        <div className="space-y-4">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={selectedCategory === "trading-cards" 
              ? "4 Lightning Bolt\n2x Dark Ritual\n1 Black Lotus (LEA)"
              : "10 Intercessors\n5x Hellblasters\n1 Captain in Gravis Armour"
            }
            className={cn(
              "w-full min-h-[120px] rounded-md px-3 py-2 text-sm font-mono",
              "placeholder:text-[var(--archive-gold,#d9b65c)]/40 focus-visible:outline-none",
              archiveField,
            )}
          />

          <div className="flex gap-3">
            <ArchiveCardButton
              onClick={handleParseBulk}
              fullWidth
              disabled={!bulkText.trim()}
              className="flex-1"
            >
              {t("collection.parseList") || "Parse List"}
            </ArchiveCardButton>

            {parsedItems.length > 0 && (
              <ArchiveCardButton
                onClick={handleBulkImport}
                active
                fullWidth
                disabled={importingBulk || bulkArmyMode !== "idle"}
                className="flex-1"
                icon={
                  importingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />
                }
              >
                {importingBulk
                  ? t("collection.importing") || "Importing..."
                  : `${t("collection.importAll") || "Import All"} (${parsedItems.length})`}
              </ArchiveCardButton>
            )}
          </div>

          {parsedItems.length > 0 && (
            <div className="border border-accent-gold/20 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {parsedItems.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="border-accent-gold/30 text-sm">
                    {item.quantity}x {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {selectedCategory === "miniatures" && bulkArmyMode !== "idle" && (
            <div className="border border-accent-gold/20 rounded-lg p-3 space-y-2">
              {bulkArmyMode === "select" ? (
                <>
                  <p className="text-sm text-accent-gold font-cinzel">
                    {t("collection.armyContext") || "Army context"}
                  </p>
                  <select
                    value={bulkSelectedArmyId}
                    onChange={(e) => setBulkSelectedArmyId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">{t("collection.selectArmy") || "Select an Army"}</option>
                    {bulkArmies.map((army) => (
                      <option key={army.id} value={army.id}>
                        {army.name}
                      </option>
                    ))}
                  </select>
                  <ArchiveCardButton
                    onClick={handleBulkArmySelect}
                    active
                    fullWidth
                    disabled={!bulkSelectedArmyId || importingBulk}
                    icon={importingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  >
                    {t("collection.importToArmy") || "Import to selected Army"}
                  </ArchiveCardButton>
                </>
              ) : (
                <>
                  <p className="text-sm text-accent-gold font-cinzel">
                    {t("collection.createArmyContext") || "Create Army context"}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={bulkArmyName}
                      onChange={(e) => setBulkArmyName(e.target.value)}
                      placeholder={t("collection.armyNamePlaceholder") || "Army name"}
                      className={cn("flex-1", archiveField)}
                    />
                    <ArchiveCardButton
                      onClick={handleBulkArmyCreate}
                      active
                      disabled={bulkArmyLoading || importingBulk || !bulkArmyName.trim()}
                      icon={
                        bulkArmyLoading || importingBulk ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )
                      }
                    >
                      {t("collection.createAndImport") || "Create & Import"}
                    </ArchiveCardButton>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
