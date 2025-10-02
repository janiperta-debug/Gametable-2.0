"use client"

import { useState, use } from "react"
import { Navigation } from "@/components/navigation"
import { CollectionFilters } from "@/components/collection-filters"
import { GameGrid } from "@/components/game-grid"
import { Filter, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function UserCollectionPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [showFilters, setShowFilters] = useState(false)

  // TODO: Fetch user data from Firebase using userId
  // For now, using mock data
  const userData = {
    name: "Karimatti Hautala",
    location: "Espoo",
    profilePicture: "/placeholder.svg?height=80&width=80",
    gamesCount: 482,
  }

  return (
    <div className="min-h-screen room-environment">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href={`/profile/${userId}`}
          className="inline-flex items-center gap-2 text-accent-gold hover:text-accent-gold/80 mb-6 font-merriweather"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        {/* User Info Header */}
        <div className="room-furniture p-6 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-accent-gold/40">
              <AvatarImage src={userData.profilePicture || "/placeholder.svg"} alt={userData.name} />
              <AvatarFallback className="text-2xl font-cinzel">{userData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-cinzel text-3xl font-bold text-accent-gold">{userData.name}'s Collection</h1>
              <p className="font-merriweather text-muted-foreground">{userData.gamesCount} games</p>
            </div>
          </div>
        </div>

        {/* Collection Grid */}
        <div className="grid gap-6 lg:grid-cols-4">
          {showFilters && (
            <div className="lg:col-span-1">
              <CollectionFilters />
            </div>
          )}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            <div className="mb-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="theme-accent-gold bg-transparent"
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="font-cinzel">{showFilters ? "Hide Filters" : "Show Filters"}</span>
              </Button>
            </div>
            <GameGrid />
          </div>
        </div>
      </main>
    </div>
  )
}
