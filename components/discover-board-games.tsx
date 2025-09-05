import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Star, Users, Clock } from "lucide-react"

const popularGames = [
  {
    id: 1,
    title: "Wingspan",
    image: "/placeholder.svg?height=150&width=150",
    rating: 8.1,
    players: "1-5",
    playTime: "40-70 min",
    year: 2019,
    category: "Strategy",
    description: "A competitive, medium-weight, card-driven, engine-building board game.",
  },
  {
    id: 2,
    title: "Azul",
    image: "/placeholder.svg?height=150&width=150",
    rating: 7.8,
    players: "2-4",
    playTime: "30-45 min",
    year: 2017,
    category: "Abstract",
    description: "Players compete as artisans decorating the walls of the Royal Palace.",
  },
  {
    id: 3,
    title: "Ticket to Ride",
    image: "/placeholder.svg?height=150&width=150",
    rating: 7.4,
    players: "2-5",
    playTime: "30-60 min",
    year: 2004,
    category: "Family",
    description: "A railway-themed German-style board game designed by Alan R. Moon.",
  },
  {
    id: 4,
    title: "Splendor",
    image: "/placeholder.svg?height=150&width=150",
    rating: 7.4,
    players: "2-4",
    playTime: "30 min",
    year: 2014,
    category: "Engine Building",
    description: "Players are merchants of the Renaissance trying to buy gem mines.",
  },
]

export function DiscoverBoardGames() {
  return (
    <div className="space-y-8">
      {/* Simple Search Bar */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent-gold/60" />
          <Input
            placeholder="Search board games..."
            className="pl-10 bg-transparent border-accent-gold/30 text-accent-gold placeholder:text-accent-gold/50 font-merriweather"
          />
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {popularGames.map((game) => (
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
