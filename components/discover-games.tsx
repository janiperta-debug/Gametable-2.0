"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, ExternalLink } from "lucide-react"

const categories = ["Board Games", "RPGs", "Miniatures", "Trading Cards"]

const gamesByCategory = {
  "Board Games": [
    {
      id: 1,
      title: "Everdell",
      category: "Strategy",
      players: "1-4",
      time: "40-80 min",
      rating: 8.1,
      image: "/placeholder.svg?height=120&width=80",
    },
    {
      id: 2,
      title: "Root",
      category: "Strategy",
      players: "2-4",
      time: "60-90 min",
      rating: 8.3,
      image: "/placeholder.svg?height=120&width=80",
    },
    {
      id: 3,
      title: "Wingspan",
      category: "Engine Building",
      players: "1-5",
      time: "40-70 min",
      rating: 8.1,
      image: "/placeholder.svg?height=120&width=80",
    },
  ],
  RPGs: [
    {
      id: 4,
      title: "Dungeons & Dragons 5E",
      category: "Fantasy RPG",
      players: "3-6",
      time: "3-4 hours",
      rating: 8.7,
      image: "/placeholder.svg?height=120&width=80",
    },
    {
      id: 5,
      title: "Pathfinder 2E",
      category: "Fantasy RPG",
      players: "3-6",
      time: "3-5 hours",
      rating: 8.5,
      image: "/placeholder.svg?height=120&width=80",
    },
  ],
  Miniatures: [
    {
      id: 6,
      title: "Warhammer 40K",
      category: "Tactical Combat",
      players: "2",
      time: "2-3 hours",
      rating: 8.2,
      image: "/placeholder.svg?height=120&width=80",
    },
    {
      id: 7,
      title: "X-Wing Miniatures",
      category: "Space Combat",
      players: "2",
      time: "45-75 min",
      rating: 7.9,
      image: "/placeholder.svg?height=120&width=80",
    },
  ],
  "Trading Cards": [
    {
      id: 8,
      title: "Magic: The Gathering",
      category: "Trading Card Game",
      players: "2",
      time: "20-60 min",
      rating: 8.4,
      image: "/placeholder.svg?height=120&width=80",
    },
    {
      id: 9,
      title: "Pokemon TCG",
      category: "Trading Card Game",
      players: "2",
      time: "15-30 min",
      rating: 7.8,
      image: "/placeholder.svg?height=120&width=80",
    },
  ],
}

const databaseSources = {
  "Board Games": { name: "BoardGameGeek", url: "https://boardgamegeek.com/xmlapi2/search?query=" },
  RPGs: { name: "RPGGeek", url: "https://rpggeek.com/xmlapi2/search?query=" },
  Miniatures: { name: "Miniature Market", url: "https://www.miniaturemarket.com/search?q=" },
  "Trading Cards": { name: "TCGPlayer", url: "https://www.tcgplayer.com/search/all/product?q=" },
}

export function DiscoverGames() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Board Games")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const currentGames = gamesByCategory[selectedCategory as keyof typeof gamesByCategory] || []
  const currentSource = databaseSources[selectedCategory as keyof typeof databaseSources]

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    console.log(`[v0] Searching ${currentSource.name} for: ${searchQuery}`)

    // Simulate API call to external database
    setTimeout(() => {
      console.log(`[v0] Search completed for ${selectedCategory} on ${currentSource.name}`)
      setIsSearching(false)
      // In a real implementation, this would fetch from the actual API
    }, 1500)
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <Card className="room-furniture">
        <CardHeader>
          <CardTitle className="text-2xl font-charm ornate-text">Discover New Games</CardTitle>
          <p className="font-merriweather text-muted-foreground">
            Search the vast library to find and add games to your personal collection.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${currentSource.name} for ${selectedCategory.toLowerCase()}...`}
                className="pl-10 font-merriweather"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="font-cinzel theme-accent-gold"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isSearching ? "Searching..." : `Search ${currentSource.name}`}
            </Button>
            <Button variant="outline" className="theme-accent-gold bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              <span className="font-cinzel">Filters</span>
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === selectedCategory ? "default" : "outline"}
                size="sm"
                className="font-cinzel transition-all duration-200 hover:scale-105 theme-accent-gold"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="text-sm text-muted-foreground font-merriweather">
            Searching in: <span className="text-accent-gold font-medium">{currentSource.name}</span>
          </div>
        </CardContent>
      </Card>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentGames.map((game) => (
          <Card key={game.id} className="picture-frame overflow-hidden">
            <div className="aspect-[3/4] bg-muted">
              <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-cinzel font-semibold">{game.title}</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-merriweather">{game.players} players</span>
                  <span className="font-merriweather">{game.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-cinzel">
                    {game.category}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">⭐ {game.rating}</span>
                  </div>
                </div>
                <Button className="w-full font-cinzel theme-accent-gold">Add to Collection</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
