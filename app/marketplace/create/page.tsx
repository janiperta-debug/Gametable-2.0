"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArchiveCard,
  ArchiveCardButton,
  ArchiveCardContent,
  ArchiveIconButton,
  archiveField,
  archiveSelectContent,
  archiveSelectItem,
} from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Store } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { useToast } from "@/hooks/use-toast"
import { getUserGamesForListing, createListing } from "@/app/actions/marketplace"

type ListingType = "sell" | "trade" | "give"
type ListingCondition = "new" | "like_new" | "good" | "fair" | "poor"

interface UserGameForListing {
  id: string
  game_id: string
  game: {
    id: string
    name: string
    thumbnail_url: string | null
  } | null
}

export default function CreateListingPage() {
  const t = useTranslations()
  const { user, loading: userLoading } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedGameId = searchParams.get("gameId")

  const [userGames, setUserGames] = useState<UserGameForListing[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [selectedGameId, setSelectedGameId] = useState(preselectedGameId || "")
  const [listingType, setListingType] = useState<ListingType>("sell")
  const [condition, setCondition] = useState<ListingCondition>("good")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)

  // Load user's games
  useEffect(() => {
    async function loadUserGames() {
      if (!user) return
      setLoadingGames(true)
      const result = await getUserGamesForListing()
      if (!result.error) {
        setUserGames(result.data)
        // If preselected game exists in user's games, keep it selected
        if (preselectedGameId && result.data.some(g => g.id === preselectedGameId)) {
          setSelectedGameId(preselectedGameId)
        }
      }
      setLoadingGames(false)
    }
    loadUserGames()
  }, [user, preselectedGameId])

  // Get selected game details
  const selectedGame = userGames.find(g => g.id === selectedGameId)

  async function handleCreateListing() {
    if (!selectedGameId) return
    
    setCreating(true)
    try {
      const result = await createListing({
        user_game_id: selectedGameId,
        listing_type: listingType,
        condition: condition,
        price: listingType === "sell" ? parseFloat(price) || undefined : undefined,
        description: description || undefined,
      })

      if (result.success) {
        toast({
          title: t("marketplace.listingCreated"),
          description: t("marketplace.listingCreatedDescription") || "Your game is now listed on the marketplace.",
        })
        router.push("/marketplace")
      } else {
        toast({
          title: t("common.error"),
          description: result.error || "Failed to create listing",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: t("common.error"),
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
    setCreating(false)
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 pt-20">
        <ArchiveCard className="max-w-md mx-auto text-center">
          <ArchiveCardContent className="p-8">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-2xl mb-2">{t("auth.loginRequired")}</h2>
            <p className="text-muted-foreground mb-4">{t("marketplace.loginToCreateListing")}</p>
            <div className="flex justify-center">
              <ArchiveCardButton asChild active>
                <Link href="/auth/login">{t("auth.login")}</Link>
              </ArchiveCardButton>
            </div>
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <ArchiveIconButton
          icon={<ArrowLeft className="h-5 w-5" />}
          aria-label={t("common.cancel")}
          onClick={() => router.push("/marketplace")}
        />
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-accent-gold">{t("marketplace.createListing")}</h1>
          <p className="text-muted-foreground font-body">{t("marketplace.createListingDescription") || "List a game from your collection on the marketplace"}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <ArchiveCard>
          <ArchiveCardContent className="p-6 md:p-8 space-y-6">
          {/* Game Selection */}
          <div className="space-y-3">
            <Label className="font-heading text-lg">{t("marketplace.selectGameFromCollection")}</Label>
            {loadingGames ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-accent-gold" />
              </div>
            ) : userGames.length === 0 ? (
              <div className="text-center py-8 bg-black/30 rounded-lg">
                <p className="text-muted-foreground mb-4">{t("marketplace.noGamesInCollection")}</p>
                <div className="flex justify-center">
                  <ArchiveCardButton asChild>
                    <Link href="/collection">{t("collection.addGames")}</Link>
                  </ArchiveCardButton>
                </div>
              </div>
            ) : (
              <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                <SelectTrigger className={cn("h-14", archiveField)}>
                  <SelectValue placeholder={t("marketplace.selectGame")} />
                </SelectTrigger>
                <SelectContent className={archiveSelectContent}>
                  {userGames.map(ug => (
                    <SelectItem key={ug.id} value={ug.id} className={cn("py-3", archiveSelectItem)}>
                      <div className="flex items-center gap-3">
                        {ug.game?.thumbnail_url && (
                          <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={ug.game.thumbnail_url}
                              alt={ug.game?.name || ""}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span>{ug.game?.name || "Unknown Game"}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Show selected game preview */}
            {selectedGame?.game && (
              <div className="flex items-center gap-4 p-4 bg-black/30 rounded-lg">
                {selectedGame.game.thumbnail_url && (
                  <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={selectedGame.game.thumbnail_url}
                      alt={selectedGame.game.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-heading font-medium">{selectedGame.game.name}</p>
                  <p className="text-sm text-muted-foreground">{t("marketplace.selectedGame")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Listing Type */}
          <div className="space-y-3">
            <Label className="font-heading text-lg">{t("marketplace.listingType")}</Label>
            <Select value={listingType} onValueChange={(v) => setListingType(v as ListingType)}>
              <SelectTrigger className={cn("h-12", archiveField)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={archiveSelectContent}>
                <SelectItem value="sell" className={archiveSelectItem}>{t("marketplace.forSale")}</SelectItem>
                <SelectItem value="trade" className={archiveSelectItem}>{t("marketplace.forTrade")}</SelectItem>
                <SelectItem value="give" className={archiveSelectItem}>{t("marketplace.freeToGive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div className="space-y-3">
            <Label className="font-heading text-lg">{t("marketplace.condition")}</Label>
            <Select value={condition} onValueChange={(v) => setCondition(v as ListingCondition)}>
              <SelectTrigger className={cn("h-12", archiveField)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={archiveSelectContent}>
                <SelectItem value="new" className={archiveSelectItem}>{t("marketplace.conditionNew")}</SelectItem>
                <SelectItem value="like_new" className={archiveSelectItem}>{t("marketplace.likeNew")}</SelectItem>
                <SelectItem value="good" className={archiveSelectItem}>{t("marketplace.good")}</SelectItem>
                <SelectItem value="fair" className={archiveSelectItem}>{t("marketplace.fair")}</SelectItem>
                <SelectItem value="poor" className={archiveSelectItem}>{t("marketplace.poor")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price (only for sell) */}
          {listingType === "sell" && (
            <div className="space-y-3">
              <Label className="font-heading text-lg">{t("marketplace.price")}</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={cn("h-12 pl-8", archiveField)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-gold z-10">€</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <Label className="font-heading text-lg">{t("marketplace.descriptionOptional")}</Label>
            <Textarea
              placeholder={t("marketplace.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn("min-h-[120px]", archiveField)}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <ArchiveCardButton asChild fullWidth className="flex-1">
              <Link href="/marketplace">{t("common.cancel")}</Link>
            </ArchiveCardButton>
            <ArchiveCardButton
              active
              fullWidth
              className="flex-1"
              onClick={handleCreateListing}
              disabled={creating || !selectedGameId}
              icon={creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
            >
              {t("marketplace.createListing")}
            </ArchiveCardButton>
          </div>
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    </div>
  )
}
