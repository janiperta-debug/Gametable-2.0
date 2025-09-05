import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Star, Users, Clock } from "lucide-react"

const popularMiniatures = [
  {
    id: 1,
    title: "Warhammer 40,000",
    image: "/placeholder.svg?height=150&width=150",
    rating: 8.3,
    players: "2",
    playTime: "2-3 hours",
    year: 1987,
    category: "Sci-Fi",
    description: "In the grim darkness of the far future, there is only war.",
  },
  {
    id: 2,
    title: "Age of Sigmar",
    image: "/placeholder.svg?height=150&width=150",
    rating: 7.9,
    players: "2",
    playTime: "1-2 hours",
    year: 2015,
    category: "Fantasy",
    description: "Epic battles in the Mortal Realms with stunning miniatures.",
  },
  {
    id: 3,
    title: "X-Wing Miniatures",
    image: "/placeholder.svg?height=150&width=150",
    rating: 8.1,
    players: "2",
    playTime: "45-75 min",
    year: 2012,
    category: "Star Wars",
    description: "Fast-paced space combat in the Star Wars universe.",
  },
  {
    id: 4,
    title: "Infinity",
    image: "/placeholder.svg?height=150&width=150",
    rating: 8.0,
    players: "2",
    playTime: "90-120 min",
    year: 2005,
    category: "Sci-Fi",
    description: "Skirmish-level tactical miniature game set in a high-tech future.",
  },
]

export function DiscoverMiniatures() {
  return (
    <div className="space-y-8">
      {/* Simple Search Bar */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent-gold/60" />
          <Input
            placeholder="Search miniature games..."
            className="pl-10 bg-transparent border-accent-gold/30 text-accent-gold placeholder:text-accent-gold/50 font-merriweather"
          />
        </div>
      </div>

      {/* Miniatures Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {popularMiniatures.map((game) => (
          <Card key={game.id} className="room-furniture group overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={game.image || "/placeholder.svg"}
                alt={game.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold leading-tight font-merriweather text-accent-gold">{game.title}</h3>
                  <p className="text-sm text-accent-gold/60 font-merriweather">({game.year})</p>
                </div>

                <p className="text-xs text-accent-gold/70 font-merriweather line-clamp-2">{game.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-merriweather text-accent-gold">{game.rating}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-merriweather bg-accent-gold/20 text-accent-gold">
                    {game.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-accent-gold/60">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span className="font-merriweather">{game.players}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-merriweather">{game.playTime}</span>
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
