import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Star, Users, Clock } from "lucide-react"

const popularRPGs = [
  {
    id: 1,
    title: "Dungeons & Dragons 5th Edition",
    image: "/placeholder.svg?height=150&width=150",
    rating: 8.5,
    players: "3-6",
    playTime: "2-4 hours",
    year: 2014,
    category: "Fantasy",
    description: "The world's greatest roleplaying game returns with a new edition.",
  },
  {
    id: 2,
    title: "Pathfinder 2nd Edition",
    image: "/placeholder.svg?height=150&width=150",
    rating: 8.2,
    players: "3-6",
    playTime: "2-4 hours",
    year: 2019,
    category: "Fantasy",
    description: "A tabletop RPG based upon the rules of Dungeons and Dragons 3.5.",
  },
  {
    id: 3,
    title: "Call of Cthulhu",
    image: "/placeholder.svg?height=150&width=150",
    rating: 8.0,
    players: "2-6",
    playTime: "2-3 hours",
    year: 1981,
    category: "Horror",
    description: "Horror roleplaying in the worlds of H.P. Lovecraft.",
  },
  {
    id: 4,
    title: "Vampire: The Masquerade",
    image: "/placeholder.svg?height=150&width=150",
    rating: 7.8,
    players: "3-6",
    playTime: "3-4 hours",
    year: 1991,
    category: "Gothic Horror",
    description: "A roleplaying game of personal and political horror.",
  },
]

export function DiscoverRPGs() {
  return (
    <div className="space-y-8">
      {/* Simple Search Bar */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent-gold/60" />
          <Input
            placeholder="Search RPGs..."
            className="pl-10 bg-transparent border-accent-gold/30 text-accent-gold placeholder:text-accent-gold/50 font-merriweather"
          />
        </div>
      </div>

      {/* RPGs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {popularRPGs.map((rpg) => (
          <Card key={rpg.id} className="room-furniture group overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={rpg.image || "/placeholder.svg"}
                alt={rpg.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold leading-tight font-merriweather text-accent-gold">{rpg.title}</h3>
                  <p className="text-sm text-accent-gold/60 font-merriweather">({rpg.year})</p>
                </div>

                <p className="text-xs text-accent-gold/70 font-merriweather line-clamp-2">{rpg.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-merriweather text-accent-gold">{rpg.rating}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-merriweather bg-accent-gold/20 text-accent-gold">
                    {rpg.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-accent-gold/60">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span className="font-merriweather">{rpg.players}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-merriweather">{rpg.playTime}</span>
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
