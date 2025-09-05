import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ExternalLink } from "lucide-react"

const highlights = [
  {
    id: 1,
    title: "Wingspan",
    image: "/placeholder.svg?height=120&width=80",
    rating: 9.2,
    category: "Strategy",
    status: "Recently Added",
    description: "Beautiful engine-building game about birds",
  },
  {
    id: 2,
    title: "Gloomhaven",
    image: "/placeholder.svg?height=120&width=80",
    rating: 9.8,
    category: "Adventure",
    status: "Currently Playing",
    description: "Epic dungeon-crawling campaign game",
  },
  {
    id: 3,
    title: "Azul",
    image: "/placeholder.svg?height=120&width=80",
    rating: 8.5,
    category: "Abstract",
    status: "Favorite",
    description: "Gorgeous tile-laying puzzle game",
  },
  {
    id: 4,
    title: "Spirit Island",
    image: "/placeholder.svg?height=120&width=80",
    rating: 9.1,
    category: "Cooperative",
    status: "Wishlist",
    description: "Defend your island from invaders",
  },
]

export function CollectionHighlights() {
  return (
    <Card className="room-furniture">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-charm ornate-text">Collection Highlights</CardTitle>
        <Button variant="ghost" size="sm">
          <span className="font-cinzel">View All</span>
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((game) => (
            <div key={game.id} className="picture-frame p-4 space-y-3">
              <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden">
                <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-cinzel font-semibold text-sm">{game.title}</h4>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium">{game.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-merriweather">{game.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {game.category}
                  </Badge>
                  <Badge variant={game.status === "Currently Playing" ? "default" : "secondary"} className="text-xs">
                    {game.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
