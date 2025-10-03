"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Store, Heart, Search, MessageCircle, User, Star, Users, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Mock data for marketplace listings
const MOCK_MARKETPLACE_LISTINGS = [
  {
    id: 1,
    gameTitle: "Wingspan",
    gameImage: "/wingspan-board-game-box.png",
    rating: 4.8,
    playerCount: "1-5",
    playTime: "40-70",
    category: "Strategy",
    condition: "Like New",
    seller: { id: "user1", name: "Sarah Chen", avatar: "/placeholder.svg?height=40&width=40" },
    tradeNotes: "Played twice, all components included. Looking to trade for engine-building games.",
    listedDate: "2 days ago",
  },
  {
    id: 2,
    gameTitle: "Scythe",
    gameImage: "/scythe-board-game-box.png",
    rating: 4.7,
    playerCount: "1-5",
    playTime: "90-115",
    category: "Strategy",
    condition: "Good",
    seller: { id: "user2", name: "Mike Johnson", avatar: "/placeholder.svg?height=40&width=40" },
    tradeNotes: "Great condition, minor box wear. Open to trades or sale.",
    listedDate: "5 days ago",
  },
  {
    id: 3,
    gameTitle: "Pandemic",
    gameImage: "/pandemic-board-game-box.png",
    rating: 4.5,
    playerCount: "2-4",
    playTime: "45-60",
    category: "Cooperative",
    condition: "Very Good",
    seller: { id: "user3", name: "Alex Rivera", avatar: "/placeholder.svg?height=40&width=40" },
    tradeNotes: "Complete set with expansion. Prefer local trades.",
    listedDate: "1 week ago",
  },
]

// Mock data for user wishlists
const MOCK_WISHLISTS = [
  {
    userId: "user4",
    userName: "Emma Wilson",
    userAvatar: "/placeholder.svg?height=40&width=40",
    wishlistGames: [
      { title: "Ticket to Ride", category: "Family" },
      { title: "Terraforming Mars", category: "Strategy" },
      { title: "Azul", category: "Abstract" },
    ],
    location: "Seattle, WA",
  },
  {
    userId: "user5",
    userName: "David Park",
    userAvatar: "/placeholder.svg?height=40&width=40",
    wishlistGames: [
      { title: "Gloomhaven", category: "Thematic" },
      { title: "Spirit Island", category: "Cooperative" },
    ],
    location: "Portland, OR",
  },
  {
    userId: "user6",
    userName: "Lisa Martinez",
    userAvatar: "/placeholder.svg?height=40&width=40",
    wishlistGames: [
      { title: "Wingspan", category: "Strategy" },
      { title: "Everdell", category: "Strategy" },
      { title: "Cascadia", category: "Family" },
    ],
    location: "San Francisco, CA",
  },
]

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState<"listings" | "wishlists">("listings")
  const [searchQuery, setSearchQuery] = useState("")
  const [conditionFilter, setConditionFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filteredListings = useMemo(() => {
    let filtered = [...MOCK_MARKETPLACE_LISTINGS]

    if (searchQuery) {
      filtered = filtered.filter((listing) => listing.gameTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (conditionFilter !== "all") {
      filtered = filtered.filter((listing) => listing.condition === conditionFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((listing) => listing.category === categoryFilter)
    }

    return filtered
  }, [searchQuery, conditionFilter, categoryFilter])

  const filteredWishlists = useMemo(() => {
    if (!searchQuery) return MOCK_WISHLISTS

    return MOCK_WISHLISTS.filter(
      (wishlist) =>
        wishlist.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wishlist.wishlistGames.some((game) => game.title.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  }, [searchQuery])

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="logo-text text-5xl font-bold">Marketplace</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Trade games with other players or find someone who has what you're looking for
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "listings" | "wishlists")}>
            <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 max-w-md mx-auto">
              <TabsTrigger value="listings" className="font-cinzel text-xs sm:text-sm">
                Available Games
              </TabsTrigger>
              <TabsTrigger value="wishlists" className="font-cinzel text-xs sm:text-sm">
                User Wishlists
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search and Filters */}
        <div className="manor-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "listings" ? "Search games..." : "Search users or games..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-body bg-surface/50 border-accent-gold/20 focus:border-accent-gold"
              />
            </div>

            {activeTab === "listings" && (
              <>
                <Select value={conditionFilter} onValueChange={setConditionFilter}>
                  <SelectTrigger className="w-full md:w-[180px] bg-surface/50 border-accent-gold/20 font-body">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-body">
                      All Conditions
                    </SelectItem>
                    <SelectItem value="Like New" className="font-body">
                      Like New
                    </SelectItem>
                    <SelectItem value="Very Good" className="font-body">
                      Very Good
                    </SelectItem>
                    <SelectItem value="Good" className="font-body">
                      Good
                    </SelectItem>
                    <SelectItem value="Fair" className="font-body">
                      Fair
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[180px] bg-surface/50 border-accent-gold/20 font-body">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-body">
                      All Categories
                    </SelectItem>
                    <SelectItem value="Strategy" className="font-body">
                      Strategy
                    </SelectItem>
                    <SelectItem value="Cooperative" className="font-body">
                      Cooperative
                    </SelectItem>
                    <SelectItem value="Family" className="font-body">
                      Family
                    </SelectItem>
                    <SelectItem value="Thematic" className="font-body">
                      Thematic
                    </SelectItem>
                    <SelectItem value="Abstract" className="font-body">
                      Abstract
                    </SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === "listings" ? (
          <div className="space-y-6">
            {filteredListings.length === 0 ? (
              <div className="text-center py-12 manor-card">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-body text-lg">No listings found matching your criteria.</p>
              </div>
            ) : (
              filteredListings.map((listing) => (
                <div key={listing.id} className="manor-card p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Game Image */}
                    <div className="relative w-full md:w-32 h-48 md:h-44 flex-shrink-0">
                      <Image
                        src={listing.gameImage || "/placeholder.svg"}
                        alt={listing.gameTitle}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>

                    {/* Game Details */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-heading font-semibold text-2xl mb-2">{listing.gameTitle}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="border-accent-gold/20 text-accent-gold">
                                {listing.category}
                              </Badge>
                              <Badge variant="secondary" className="bg-surface">
                                {listing.condition}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-accent-gold text-accent-gold" />
                            <span className="font-medium">{listing.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{listing.playerCount} players</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{listing.playTime} min</span>
                          </div>
                        </div>

                        <p className="font-body text-muted-foreground mb-4">{listing.tradeNotes}</p>

                        {/* Seller Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10">
                              <Image
                                src={listing.seller.avatar || "/placeholder.svg"}
                                alt={listing.seller.name}
                                fill
                                className="object-cover rounded-full"
                              />
                            </div>
                            <div>
                              <p className="font-heading font-medium text-sm">{listing.seller.name}</p>
                              <p className="text-xs text-muted-foreground">Listed {listing.listedDate}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Link href={`/profile/${listing.seller.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-accent-gold/20 hover:border-accent-gold bg-transparent"
                              >
                                <User className="h-4 w-4 mr-2" />
                                View Profile
                              </Button>
                            </Link>
                            <Link href={`/messages?user=${listing.seller.id}`}>
                              <Button size="sm" className="bg-accent-gold hover:bg-accent-gold/90 text-background">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Contact Seller
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredWishlists.length === 0 ? (
              <div className="text-center py-12 manor-card">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-body text-lg">No wishlists found matching your search.</p>
              </div>
            ) : (
              filteredWishlists.map((wishlist) => (
                <div key={wishlist.userId} className="manor-card p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16">
                        <Image
                          src={wishlist.userAvatar || "/placeholder.svg"}
                          alt={wishlist.userName}
                          fill
                          className="object-cover rounded-full"
                        />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-xl mb-1">{wishlist.userName}</h3>
                        <p className="text-sm text-muted-foreground">{wishlist.location}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/profile/${wishlist.userId}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-accent-gold/20 hover:border-accent-gold bg-transparent"
                        >
                          <User className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      </Link>
                      <Link href={`/messages?user=${wishlist.userId}`}>
                        <Button size="sm" className="bg-accent-gold hover:bg-accent-gold/90 text-background">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Offer Trade
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="h-4 w-4 text-accent-gold" />
                      <h4 className="font-heading font-medium">Wishlist ({wishlist.wishlistGames.length} games)</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {wishlist.wishlistGames.map((game, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-accent-gold/20 text-foreground font-body"
                        >
                          {game.title}
                          <span className="ml-2 text-xs text-muted-foreground">({game.category})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
