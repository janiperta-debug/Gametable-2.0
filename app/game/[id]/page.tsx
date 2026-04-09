"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Edit, Save, X, Star, Users, Clock, Loader2, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getGameById, updateGame, removeGameFromCollection, type GameCategory } from "@/app/actions/games"
import { useTranslations } from "@/lib/i18n"

const CATEGORIES: { value: GameCategory; label: string }[] = [
  { value: "board_game", label: "Lautapeli" },
  { value: "rpg", label: "Roolipeli" },
  { value: "trading_card", label: "Keräilykortti" },
  { value: "miniature", label: "Miniatyyri" },
]

export default function GameDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const gameId = params.id as string

  const [game, setGame] = useState<Record<string, unknown> | null>(null)
  const [userGame, setUserGame] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editCategory, setEditCategory] = useState<GameCategory>("board_game")
  const [editYear, setEditYear] = useState("")
  const [editMinPlayers, setEditMinPlayers] = useState("")
  const [editMaxPlayers, setEditMaxPlayers] = useState("")
  const [editMinPlaytime, setEditMinPlaytime] = useState("")
  const [editMaxPlaytime, setEditMaxPlaytime] = useState("")
  const [editDescription, setEditDescription] = useState("")

  useEffect(() => {
    async function loadGame() {
      setLoading(true)
      const result = await getGameById(gameId)
      if (result.game) {
        setGame(result.game)
        setUserGame(result.userGame)
        // Initialize edit form
        setEditName(result.game.name || "")
        setEditCategory((result.game.category as GameCategory) || "board_game")
        setEditYear(result.game.year?.toString() || "")
        setEditMinPlayers(result.game.min_players?.toString() || "")
        setEditMaxPlayers(result.game.max_players?.toString() || "")
        setEditMinPlaytime(result.game.min_playtime?.toString() || "")
        setEditMaxPlaytime(result.game.max_playtime?.toString() || "")
        setEditDescription(result.game.description || "")
      }
      setLoading(false)
    }
    loadGame()
  }, [gameId])

  const handleSave = async () => {
    setSaving(true)
    const result = await updateGame(gameId, {
      name: editName,
      category: editCategory,
      year: editYear ? parseInt(editYear) : null,
      min_players: editMinPlayers ? parseInt(editMinPlayers) : null,
      max_players: editMaxPlayers ? parseInt(editMaxPlayers) : null,
      min_playtime: editMinPlaytime ? parseInt(editMinPlaytime) : null,
      max_playtime: editMaxPlaytime ? parseInt(editMaxPlaytime) : null,
      description: editDescription || null,
    })

    if (result.success) {
      // Refresh game data
      const refreshed = await getGameById(gameId)
      if (refreshed.game) {
        setGame(refreshed.game)
      }
      setIsEditing(false)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!userGame) return
    setDeleting(true)
    const result = await removeGameFromCollection(userGame.id as string)
    if (result.success) {
      router.push("/collection")
    }
    setDeleting(false)
  }

  const handleCancel = () => {
    // Reset form to original values
    if (game) {
      setEditName(game.name as string || "")
      setEditCategory((game.category as GameCategory) || "board_game")
      setEditYear((game.year as number)?.toString() || "")
      setEditMinPlayers((game.min_players as number)?.toString() || "")
      setEditMaxPlayers((game.max_players as number)?.toString() || "")
      setEditMinPlaytime((game.min_playtime as number)?.toString() || "")
      setEditMaxPlaytime((game.max_playtime as number)?.toString() || "")
      setEditDescription(game.description as string || "")
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">{t("game.notFound")}</p>
        <Link href="/collection">
          <Button variant="outline" className="theme-accent-gold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("game.backToCollection")}
          </Button>
        </Link>
      </div>
    )
  }

  const canEdit = !!userGame

  return (
    <div className="min-h-screen pb-8">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/collection">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("game.backToCollection")}
            </Button>
          </Link>

          {canEdit && !isEditing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="theme-accent-gold"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t("game.edit")}
              </Button>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("game.deleteTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("game.deleteDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {isEditing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                {t("common.cancel")}
              </Button>
              <Button
                className="bg-accent-gold hover:bg-accent-gold/90 text-background"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t("common.save")}
              </Button>
            </div>
          )}
        </div>

        {/* Game Content */}
        <div className="manor-card p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image */}
            <div className="w-full md:w-1/3">
              <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-surface/50">
                <Image
                  src={(game.image_url as string) || (game.thumbnail_url as string) || "/placeholder.svg"}
                  alt={game.name as string}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <>
                  {/* Edit Mode */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm text-muted-foreground">
                        {t("game.name")}
                      </Label>
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-sm text-muted-foreground">
                        {t("game.category")}
                      </Label>
                      <Select value={editCategory} onValueChange={(v) => setEditCategory(v as GameCategory)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="year" className="text-sm text-muted-foreground">
                        {t("game.yearPublished")}
                      </Label>
                      <Input
                        id="year"
                        type="number"
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minPlayers" className="text-sm text-muted-foreground">
                          {t("game.minPlayers")}
                        </Label>
                        <Input
                          id="minPlayers"
                          type="number"
                          value={editMinPlayers}
                          onChange={(e) => setEditMinPlayers(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxPlayers" className="text-sm text-muted-foreground">
                          {t("game.maxPlayers")}
                        </Label>
                        <Input
                          id="maxPlayers"
                          type="number"
                          value={editMaxPlayers}
                          onChange={(e) => setEditMaxPlayers(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minPlaytime" className="text-sm text-muted-foreground">
                          {t("game.minPlaytime")}
                        </Label>
                        <Input
                          id="minPlaytime"
                          type="number"
                          value={editMinPlaytime}
                          onChange={(e) => setEditMinPlaytime(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxPlaytime" className="text-sm text-muted-foreground">
                          {t("game.maxPlaytime")}
                        </Label>
                        <Input
                          id="maxPlaytime"
                          type="number"
                          value={editMaxPlaytime}
                          onChange={(e) => setEditMaxPlaytime(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm text-muted-foreground">
                        {t("game.description")}
                      </Label>
                      <Textarea
                        id="description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* View Mode */}
                  <div>
                    <h1 className="font-cinzel text-3xl font-bold text-foreground mb-2">
                      {game.name as string}
                    </h1>
                    <Badge variant="outline" className="text-sm border-accent-gold/20 text-accent-gold">
                      {CATEGORIES.find(c => c.value === game.category)?.label || game.category as string}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    {game.bgg_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-accent-gold text-accent-gold" />
                        <span className="font-medium">{(game.bgg_rating as number).toFixed(1)}</span>
                      </div>
                    )}
                    {(game.min_players || game.max_players) && (
                      <div className="flex items-center gap-1">
                        <Users className="h-5 w-5" />
                        <span>
                          {game.min_players === game.max_players
                            ? `${game.min_players}`
                            : `${game.min_players || "?"}-${game.max_players || "?"}`} {t("game.players")}
                        </span>
                      </div>
                    )}
                    {(game.min_playtime || game.max_playtime) && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-5 w-5" />
                        <span>
                          {game.min_playtime === game.max_playtime
                            ? `${game.min_playtime}`
                            : `${game.min_playtime || "?"}-${game.max_playtime || "?"}`} min
                        </span>
                      </div>
                    )}
                    {game.year && (
                      <span>{t("game.published")} {game.year as number}</span>
                    )}
                  </div>

                  {game.description && (
                    <div className="pt-4 border-t border-border/50">
                      <h3 className="font-cinzel text-lg font-semibold mb-2">{t("game.description")}</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {game.description as string}
                      </p>
                    </div>
                  )}

                  {game.bgg_id && (
                    <div className="pt-4">
                      <a
                        href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-gold hover:underline text-sm"
                      >
                        {t("game.viewOnBGG")}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
