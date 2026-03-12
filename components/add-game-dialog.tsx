"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Plus, Star, Users, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addGameToCollection } from "@/app/actions/games"
import { useTranslations } from "@/lib/i18n"
import type { BGGSearchResult, BGGGameDetails } from "@/lib/types/database"

interface AddGameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGameAdded?: () => void
}

export function AddGameDialog({ open, onOpenChange, onGameAdded }: AddGameDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<BGGSearchResult[]>([])
  const [addingGameId, setAddingGameId] = useState<number | null>(null)
  const [selectedGame, setSelectedGame] = useState<BGGGameDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchResults([])
    setSelectedGame(null)

    try {
      const response = await fetch(`/api/bgg/search?query=${encodeURIComponent(searchQuery)}`)
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

  const handleSelectGame = async (bggId: number) => {
    setLoadingDetails(true)
    try {
      const response = await fetch(`/api/bgg/details?id=${bggId}`)
      const details: BGGGameDetails = await response.json()
      
      if (details && details.id !== undefined) {
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
      const result = await addGameToCollection(selectedGame, "owned")

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
        onGameAdded?.()
        handleClose()
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

  const handleClose = () => {
    onOpenChange(false)
    setSearchQuery("")
    setSearchResults([])
    setSelectedGame(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col room-furniture">
        <DialogHeader>
          <DialogTitle className="ornate-text font-heading text-2xl">{t("collection.searchBGG")}</DialogTitle>
          <DialogDescription className="font-body">
            {t("collection.searchBGGDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="flex gap-2 mt-4">
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

        {/* Selected Game Preview */}
        {selectedGame && (
          <div className="mt-4 p-4 rounded-lg border border-accent-gold/30 bg-accent-gold/5">
            <div className="flex gap-4">
              {selectedGame.thumbnail && (
                <img
                  src={selectedGame.thumbnail}
                  alt={selectedGame.name}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-lg truncate">{selectedGame.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedGame.yearPublished && (
                    <Badge variant="outline" className="text-xs border-accent-gold/20">
                      {selectedGame.yearPublished}
                    </Badge>
                  )}
                  {selectedGame.rating && (
                    <Badge variant="outline" className="text-xs border-accent-gold/20">
                      <Star className="h-3 w-3 mr-1 fill-accent-gold text-accent-gold" />
                      {selectedGame.rating}
                    </Badge>
                  )}
                  {selectedGame.minPlayers && selectedGame.maxPlayers && (
                    <Badge variant="outline" className="text-xs border-accent-gold/20">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedGame.minPlayers}-{selectedGame.maxPlayers}
                    </Badge>
                  )}
                  {selectedGame.minPlaytime && (
                    <Badge variant="outline" className="text-xs border-accent-gold/20">
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedGame.minPlaytime}-{selectedGame.maxPlaytime || selectedGame.minPlaytime}m
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setSelectedGame(null)} className="font-body">
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
          <div className="flex-1 overflow-y-auto mt-4 space-y-2 min-h-0 max-h-[300px]">
            {searching || loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-body">
                {searchQuery ? t("collection.noResults") : t("collection.searchPrompt")}
              </div>
            ) : (
              searchResults.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-accent-gold/20 hover:bg-accent-gold/10 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-medium truncate">{game.name}</h4>
                    {game.yearPublished && (
                      <Badge variant="outline" className="mt-1 text-xs border-accent-gold/20 text-accent-gold">
                        {game.yearPublished}
                      </Badge>
                    )}
                  </div>
                  <Plus className="h-4 w-4 text-accent-gold ml-4 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
