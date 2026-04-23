"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Store, Heart, Search, MessageCircle, User, Plus, Loader2, Trash2 } from "lucide-react"
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
    const result = await contactSeller(sellerId)
    if (result.error) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    } else if (result.conversationId) {
      router.push(`/messages?conversation=${result.conversationId}`)
    } else {
      router.push("/messages")
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
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="logo-text text-5xl font-bold">{t("marketplace.title")}</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            {t("marketplace.subtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "listings" | "wishlists")}>
            <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-0 max-w-md mx-auto">
              <TabsTrigger value="listings" className="font-cinzel text-xs sm:text-sm">
                {t("marketplace.availableGames")}
              </TabsTrigger>
              <TabsTrigger value="wishlists" className="font-cinzel text-xs sm:text-sm">
                {t("marketplace.userWishlists")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {user && (
            <Link href="/marketplace/create">
              <Button className="bg-accent-gold hover:bg-accent-copper">
                <Plus className="h-4 w-4 mr-2" />
                {t("marketplace.createListing")}
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="manor-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "listings" ? t("marketplace.searchGames") : t("marketplace.searchUsersOrGames")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-body bg-surface/50 border-accent-gold/20 focus:border-accent-gold"
              />
            </div>

            {activeTab === "listings" && (
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className="w-full md:w-[180px] bg-surface/50 border-accent-gold/20 font-body">
                  <SelectValue placeholder={t("marketplace.condition")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-body">{t("marketplace.allConditions")}</SelectItem>
                  <SelectItem value="new" className="font-body">{t("marketplace.conditionNew")}</SelectItem>
                  <SelectItem value="like_new" className="font-body">{t("marketplace.likeNew")}</SelectItem>
                  <SelectItem value="good" className="font-body">{t("marketplace.good")}</SelectItem>
                  <SelectItem value="fair" className="font-body">{t("marketplace.fair")}</SelectItem>
                  <SelectItem value="poor" className="font-body">{t("marketplace.poor")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
          </div>
        ) : activeTab === "listings" ? (
          <div className="space-y-6">
            {filteredListings.length === 0 ? (
              <div className="text-center py-12 manor-card">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-body text-lg">{t("marketplace.noListings")}</p>
                {user && (
                  <Button 
                    onClick={() => setCreateModalOpen(true)}
                    className="mt-4 bg-accent-gold hover:bg-accent-copper"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("marketplace.createFirstListing")}
                  </Button>
                )}
              </div>
            ) : (
              filteredListings.map((listing) => {
                const isOwner = user?.id === listing.seller_id
                const sellerName = listing.seller?.display_name || listing.seller?.username || "Unknown"
                
                return (
                  <div key={listing.id} className="manor-card p-6 hover:shadow-lg transition-all duration-300">
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-400/40 text-red-400 hover:bg-red-400/10 bg-transparent"
                                  onClick={() => handleDeleteListing(listing.id)}
                                  disabled={deleting === listing.id}
                                >
                                  {deleting === listing.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {t("common.delete")}
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <>
                                  <Link href={"/users/" + (listing.seller?.id || listing.seller_id)}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-accent-gold/20 hover:border-accent-gold bg-transparent"
                                    >
                                      <User className="h-4 w-4 mr-2" />
                                      {t("profile.viewProfile")}
                                    </Button>
                                  </Link>
                                  <Button 
                                    size="sm" 
                                    className="bg-accent-gold hover:bg-accent-gold/90 text-background"
                                    onClick={() => handleContactSeller(listing.seller_id)}
                                    disabled={contacting === listing.seller_id}
                                  >
                                    {contacting === listing.seller_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        {t("marketplace.contactSeller")}
                                      </>
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedWishlists).length === 0 ? (
              <div className="text-center py-12 manor-card">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-body text-lg">{t("marketplace.noWishlists")}</p>
              </div>
            ) : (
              Object.entries(groupedWishlists).map(([userId, wishlist]) => {
                const userName = wishlist.user?.display_name || wishlist.user?.username || "Unknown"
                
                return (
                  <div key={userId} className="manor-card p-6 hover:shadow-lg transition-all duration-300">
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
                        <Link href={"/users/" + userId}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-accent-gold/20 hover:border-accent-gold bg-transparent"
                          >
                            <User className="h-4 w-4 mr-2" />
                            {t("profile.viewProfile")}
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          className="bg-accent-gold hover:bg-accent-gold/90 text-background"
                          onClick={() => handleContactSeller(userId)}
                          disabled={contacting === userId}
                        >
                          {contacting === userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              {t("marketplace.offerTrade")}
                            </>
                          )}
                        </Button>
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
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
