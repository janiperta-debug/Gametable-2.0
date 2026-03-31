"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Loader2, Plus, FileText } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { addCardToCollection } from "@/app/actions/tcg"
import { addMiniatureToCollection } from "@/app/actions/miniatures"
import { addGameToCollection } from "@/app/actions/games"
import type { TCGSearchResult } from "@/app/api/tcg/search/route"
import type { MiniatureSearchResult } from "@/app/api/miniatures/search/route"
import type { BGGCollectionItem } from "@/app/api/bgg/collection/route"
import { useToast } from "@/hooks/use-toast"

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
  
  const t = useTranslations()
  const { toast } = useToast()

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
            
            const result = await addGameToCollection(details, status, category)
            
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

  const handleBulkImport = async () => {
    if (parsedItems.length === 0) return
    
    setImportingBulk(true)
    let successCount = 0
    let errorCount = 0

    for (const item of parsedItems) {
      try {
        if (selectedCategory === "trading-cards") {
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
        } else if (selectedCategory === "miniatures") {
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

  // Render username import for board games and RPGs
  if (supportsUsernameImport) {
    return (
      <Card className="room-furniture mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full bg-background text-foreground border-border"
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={!username.trim() || importing}
              style={{
                backgroundColor: username.trim() ? "hsl(var(--accent-gold))" : "hsl(var(--muted))",
                color: username.trim() ? "hsl(var(--accent-gold-foreground))" : "hsl(var(--muted-foreground))",
              }}
              className="disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t("collection.importFrom") || "Import from"} {getSourceName()}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground font-body mt-2">
            {t("collection.importDescription") || `Import your collection from ${getSourceName()} by entering your username`}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Render bulk import for miniatures and trading cards
  return (
    <Card className="room-furniture mb-6">
      <CardContent className="p-6">
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
            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-body placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
          />

          <div className="flex gap-3">
            <Button
              onClick={handleParseBulk}
              variant="outline"
              disabled={!bulkText.trim()}
              className="flex-1"
            >
              {t("collection.parseList") || "Parse List"}
            </Button>
            
            {parsedItems.length > 0 && (
              <Button
                onClick={handleBulkImport}
                disabled={importingBulk}
                className="flex-1 theme-accent-gold"
              >
                {importingBulk ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t("collection.importing") || "Importing..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("collection.importAll") || "Import All"} ({parsedItems.length})
                  </>
                )}
              </Button>
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
        </div>
      </CardContent>
    </Card>
  )
}
