"use client"

import { useState, useEffect } from "react"
import {
  ArchiveButton,
  ArchiveCard,
  ArchiveCardButton,
  ArchiveCardContent,
  ArchiveToggle,
  archiveField,
  archiveSelectContent,
  archiveSelectItem,
} from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeHero } from "@/components/theme-hero"
import { Store, Heart, Search, MessageCircle, User, Plus, Loader2, Trash2, Users, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@/hooks/useUser"
import { useToast } from "@/hooks/use-toast"
import { 
  getMarketplaceListings, 
  getWishlists, 
  deleteListing,
  contactSeller,
  type MarketplaceListing,
  type WishlistEntry
} from "@/app/actions/marketplace"

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState<"listings" | "wishlists">("listings")
  const [searchQuery, setSearchQuery] = useState("")
  const [conditionFilter, setConditionFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [wishlists, setWishlists] = useState<WishlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [contacting, setContacting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  const t = useTranslations()
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const listGameParam = searchParams.get("listGame")

  // Redirect to create page if listGame param is present
  useEffect(() => {
    if (listGameParam && user) {
      router.replace(`/marketplace/create?gameId=${listGameParam}`)
    }
  }, [listGameParam, user, router])

  // Load listings and wishlists
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [listingsResult, wishlistsResult] = await Promise.all([
        getMarketplaceListings(),
        getWishlists()
      ])
      if (!listingsResult.error) setListings(listingsResult.data)
      if (!wishlistsResult.error) setWishlists(wishlistsResult.data)
      setLoading(false)
    }
    loadData()
  }, [])

  // Filter listings
  const filteredListings = listings.filter(listing => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesGame = listing.game?.name?.toLowerCase().includes(query)
      const matchesSeller = listing.seller?.display_name?.toLowerCase().includes(query)
      if (!matchesGame && !matchesSeller) return false
    }
    if (conditionFilter !== "all" && listing.condition !== conditionFilter) return false
    return true
  })

  // Filter wishlists
  const filteredWishlists = wishlists.filter(entry => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return entry.game?.name?.toLowerCase().includes(query) ||
           entry.user?.display_name?.toLowerCase().includes(query)
  })

  // Group wishlists by user
  const groupedWishlists = filteredWishlists.reduce((acc, entry) => {
    const userId = entry.user_id
    if (!acc[userId]) {
      acc[userId] = {
        user: entry.user,
        games: []
      }
    }
    acc[userId].games.push(entry)
    return acc
  }, {} as Record<string, { user: any; games: WishlistEntry[] }>)

  async function handleContactSeller(sellerId: string) {
    if (!user) {
      toast({ title: t("common.error"), description: t("marketplace.loginToContact"), variant: "destructive" })
      return
    }
    setContacting(sellerId)
    try {
      const result = await contactSeller(sellerId)
      if (result.error) {
        toast({ title: t("common.error"), description: result.error, variant: "destructive" })
      } else if (result.conversationId) {
        router.push(`/messages?conversation=${result.conversationId}`)
      } else {
        router.push("/messages")
      }
    } catch {
      toast({ title: t("common.error"), description: "Failed to contact seller", variant: "destructive" })
    }
    setContacting(null)
  }

  async function handleDeleteListing(listingId: string) {
    setDeleting(listingId)
    const result = await deleteListing(listingId)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else {
      toast({ title: t("common.success"), description: t("marketplace.listingDeleted") })
      setListings(prev => prev.filter(l => l.id !== listingId))
    }
    setDeleting(null)
  }

  const conditionLabels: Record<string, string> = {
    new: t("marketplace.conditionNew"),
    like_new: t("marketplace.likeNew"),
    good: t("marketplace.good"),
    fair: t("marketplace.fair"),
    poor: t("marketplace.poor")
  }

  const listingTypeLabels: Record<string, string> = {
    sell: t("marketplace.forSale"),
    trade: t("marketplace.forTrade"),
    give: t("marketplace.freeToGive")
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <ThemeHero page="marketplace" mode="backdrop">
          <div className="text-center">
            <h1 className="logo-text text-5xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              {t("marketplace.title")}
            </h1>
            <p className="font-body text-foreground/90 text-xl max-w-3xl mx-auto mt-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {t("marketplace.subtitle")}
            </p>
          </div>
        </ThemeHero>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <ArchiveToggle
            value={activeTab}
            onChange={(value) => setActiveTab(value as "listings" | "wishlists")}
            options={[
              { value: "listings", label: t("marketplace.availableGames") },
              { value: "wishlists", label: t("marketplace.userWishlists") },
            ]}
          />

          {user && (
            <ArchiveButton asChild icon={<Plus className="h-4 w-4" />}>
              <Link href="/marketplace/create">{t("marketplace.createListing")}</Link>
            </ArchiveButton>
          )}
        </div>

        {/* Search and Filters */}
        <ArchiveCard className="mb-8">
          <ArchiveCardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder={activeTab === "listings" ? t("marketplace.searchGames") : t("marketplace.searchUsersOrGames")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn("pl-10 font-body", archiveField)}
                />
              </div>

              {activeTab === "listings" && (
                <Select value={conditionFilter} onValueChange={setConditionFilter}>
                  <SelectTrigger className={cn("w-full md:w-[180px] font-body", archiveField)}>
                    <SelectValue placeholder={t("marketplace.condition")} />
                  </SelectTrigger>
                  <SelectContent className={archiveSelectContent}>
                    <SelectItem value="all" className={cn("font-body", archiveSelectItem)}>{t("marketplace.allConditions")}</SelectItem>
                    <SelectItem value="new" className={cn("font-body", archiveSelectItem)}>{t("marketplace.conditionNew")}</SelectItem>
                    <SelectItem value="like_new" className={cn("font-body", archiveSelectItem)}>{t("marketplace.likeNew")}</SelectItem>
                    <SelectItem value="good" className={cn("font-body", archiveSelectItem)}>{t("marketplace.good")}</SelectItem>
                    <SelectItem value="fair" className={cn("font-body", archiveSelectItem)}>{t("marketplace.fair")}</SelectItem>
                    <SelectItem value="poor" className={cn("font-body", archiveSelectItem)}>{t("marketplace.poor")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </ArchiveCardContent>
        </ArchiveCard>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
          </div>
        ) : activeTab === "listings" ? (
          <div className="space-y-6">
            {filteredListings.length === 0 ? (
              <ArchiveCard className="text-center">
                <ArchiveCardContent className="py-12">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-body text-lg">{t("marketplace.noListings")}</p>
                  {user && (
                    <div className="flex justify-center mt-4">
                      <ArchiveCardButton asChild active icon={<Plus className="h-4 w-4" />}>
                        <Link href="/marketplace/create">{t("marketplace.createFirstListing")}</Link>
                      </ArchiveCardButton>
                    </div>
                  )}
                </ArchiveCardContent>
              </ArchiveCard>
            ) : (
              filteredListings.map((listing) => {
                const isOwner = user?.id === listing.seller_id
                const sellerName = listing.seller?.display_name || listing.seller?.username || "Unknown"
                
                return (
                  <ArchiveCard key={listing.id} className="transition-all duration-300">
                    <ArchiveCardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Game Image */}
                      <div className="relative w-full md:w-32 h-48 md:h-44 flex-shrink-0">
                        <Image
                          src={listing.game?.thumbnail_url || listing.game?.image_url || "/placeholder.svg"}
                          alt={listing.game?.name || "Game"}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>

                      {/* Game Details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-heading font-semibold text-2xl mb-2">{listing.game?.name}</h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="border-accent-gold/20 text-accent-gold">
                                  {listingTypeLabels[listing.listing_type]}
                                </Badge>
                                <Badge variant="secondary" className="bg-surface">
                                  {conditionLabels[listing.condition]}
                                </Badge>
                                {listing.listing_type === "sell" && listing.price && (
                                  <Badge className="bg-green-600">${listing.price}</Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            {listing.game?.min_players && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{listing.game.min_players}-{listing.game.max_players} players</span>
                              </div>
                            )}
                            {listing.game?.playing_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{listing.game.playing_time} min</span>
                              </div>
                            )}
                          </div>

                          {listing.description && (
                            <p className="font-body text-muted-foreground mb-4">{listing.description}</p>
                          )}

                          {/* Seller Info */}
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10">
                                <Image
                                  src={listing.seller?.avatar_url || "/placeholder.svg"}
                                  alt={sellerName}
                                  fill
                                  className="object-cover rounded-full"
                                />
                              </div>
                              <div>
                                <p className="font-heading font-medium text-sm">{sellerName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {t("marketplace.listed")} {new Date(listing.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {isOwner ? (
                                <ArchiveCardButton
                                  onClick={() => handleDeleteListing(listing.id)}
                                  disabled={deleting === listing.id}
                                  icon={
                                    deleting === listing.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )
                                  }
                                >
                                  {t("common.delete")}
                                </ArchiveCardButton>
                              ) : (
                                <>
                                  <ArchiveCardButton
                                    asChild
                                    icon={<User className="h-4 w-4" />}
                                  >
                                    <Link href={"/users/" + (listing.seller?.id || listing.seller_id)}>
                                      {t("profile.viewProfile")}
                                    </Link>
                                  </ArchiveCardButton>
                                  <ArchiveCardButton
                                    active
                                    onClick={() => handleContactSeller(listing.seller_id)}
                                    disabled={contacting === listing.seller_id}
                                    icon={
                                      contacting === listing.seller_id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <MessageCircle className="h-4 w-4" />
                                      )
                                    }
                                  >
                                    {t("marketplace.contactSeller")}
                                  </ArchiveCardButton>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    </ArchiveCardContent>
                  </ArchiveCard>
                )
              })
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedWishlists).length === 0 ? (
              <ArchiveCard className="text-center">
                <ArchiveCardContent className="py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-body text-lg">{t("marketplace.noWishlists")}</p>
                </ArchiveCardContent>
              </ArchiveCard>
            ) : (
              Object.entries(groupedWishlists).map(([userId, wishlist]) => {
                const userName = wishlist.user?.display_name || wishlist.user?.username || "Unknown"
                
                return (
                  <ArchiveCard key={userId} className="transition-all duration-300">
                    <ArchiveCardContent className="p-6">
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                          <Image
                            src={wishlist.user?.avatar_url || "/placeholder.svg"}
                            alt={userName}
                            fill
                            className="object-cover rounded-full"
                          />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-xl mb-1">{userName}</h3>
                          {wishlist.user?.location && (
                            <p className="text-sm text-muted-foreground">{wishlist.user.location}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <ArchiveCardButton asChild icon={<User className="h-4 w-4" />}>
                          <Link href={"/users/" + userId}>{t("profile.viewProfile")}</Link>
                        </ArchiveCardButton>
                        <ArchiveCardButton
                          active
                          onClick={() => handleContactSeller(userId)}
                          disabled={contacting === userId}
                          icon={
                            contacting === userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MessageCircle className="h-4 w-4" />
                            )
                          }
                        >
                          {t("marketplace.offerTrade")}
                        </ArchiveCardButton>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="h-4 w-4 text-accent-gold" />
                        <h4 className="font-heading font-medium">
                          {t("marketplace.wishlist")} ({wishlist.games.length} {t("marketplace.games")})
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {wishlist.games.map((entry) => (
                          <Link key={entry.id} href={`/game/${entry.game_id}`}>
                            <Badge
                              variant="outline"
                              className="border-accent-gold/20 text-foreground font-body cursor-pointer hover:bg-accent-gold/10 hover:border-accent-gold transition-colors"
                            >
                              {entry.game?.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                    </ArchiveCardContent>
                  </ArchiveCard>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
