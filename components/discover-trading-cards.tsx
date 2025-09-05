import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Star, Users, Clock } from "lucide-react"

const popularTCGs = [
  {
    id: 1,
    title: "Magic: The Gathering",
    image: "/placeholder.svg?height=150&width=150",
    rating: 8.4,
    players: "2",
    playTime: "20-60 min",
    year: 1993,
    category: "Fantasy",
    description: "The original trading card game that started it all.",
  },
  {
    id: 2,
    title: "Pokémon TCG",
    image: "/placeholder.svg?height=150&width=150",
    rating: 7.6,
    players: "2",
    playTime: "15-30 min",
    year: 1996,
    category: "Pokémon",
    description: "Collect, trade, and battle with Pokémon cards.",
  },
  {
    id: 3,
    title: "Yu-Gi-Oh!",
    image: "/placeholder.svg?height=150&width=150",
    rating: 7.2,
    players: "2",
    playTime: "15-25 min",
    year: 1999,
    category: "Anime",
    description: "Strategic dueling card game based on the popular anime.",
  },
  {
    id: 4,
    title: "Flesh and Blood",
    image: "/placeholder.svg?height=150&width=150",
    rating: 8.1,
    players: "2",
    playTime: "30-45 min",
    year: 2019,
    category: "Fantasy",
    description: "A new generation trading card game for competitive play.",
  },
]

export function DiscoverTradingCards() {
  return (
    <div className="space-y-8">
      {/* Simple Search Bar */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent-gold/60" />
          <Input
            placeholder="Search trading card games..."
            className="pl-10 bg-transparent border-accent-gold/30 text-accent-gold placeholder:text-accent-gold/50 font-merriweather"
          />
        </div>
      </div>

      {/* TCGs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {popularTCGs.map((tcg) => (
          <Card key={tcg.id} className="room-furniture group overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={tcg.image || "/placeholder.svg"}
                alt={tcg.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold leading-tight font-merriweather text-accent-gold">{tcg.title}</h3>
                  <p className="text-sm text-accent-gold/60 font-merriweather">({tcg.year})</p>
                </div>

                <p className="text-xs text-accent-gold/70 font-merriweather line-clamp-2">{tcg.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-merriweather text-accent-gold">{tcg.rating}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-merriweather bg-accent-gold/20 text-accent-gold">
                    {tcg.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-accent-gold/60">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span className="font-merriweather">{tcg.players}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-merriweather">{tcg.playTime}</span>
                  </div>
                </div>

                <Button className="w-full bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="font-merriweather">Add to Collection</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
