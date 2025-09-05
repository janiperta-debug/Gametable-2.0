import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dice6, Download, Plus, ChevronDown, Users, Clock } from "lucide-react"

// Mock data for board games
const boardGames = [
  {
    id: 1,
    title: "Oh Crab!",
    image: "/placeholder.svg?height=80&width=80",
    players: "2-5",
    playTime: "60min",
    source: "MANUAL",
  },
  {
    id: 2,
    title: "Wonderland Fluxx",
    image: "/placeholder.svg?height=80&width=80",
    players: "2-6",
    playTime: "30min",
    rating: 6.9,
    source: "BGG",
  },
  {
    id: 3,
    title: "Wonder Book",
    image: "/placeholder.svg?height=80&width=80",
    players: "1-4",
    playTime: "90min",
    rating: 7.6,
    source: "BGG",
  },
]

export function BoardGamesTab() {
  return (
    <div className="space-y-6">
      {/* Management Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Import from BGG */}
        <Card className="decorative-border">
          <CardHeader>
            <CardTitle className="font-heading flex items-center">
              <Dice6 className="h-5 w-5 mr-2 text-accent-gold" />
              Board Games Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-heading text-accent-gold mb-2">Import from BoardGameGeek</h4>
              <p className="text-sm text-muted-foreground mb-4">Enter your BGG username to import your board games.</p>
              <div className="flex space-x-2">
                <Input placeholder="Your BGG Username" className="flex-1" />
                <Button className="theme-accent-gold">
                  <Download className="h-4 w-4 mr-2" />
                  Import from BGG
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Add */}
        <Card className="decorative-border">
          <CardHeader>
            <CardTitle className="font-heading">Add Game Manually</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Add board games to your collection.</p>
            <Button className="w-full theme-accent-gold">
              <Plus className="h-4 w-4 mr-2" />
              Add Game Manually
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Games List */}
      <Card className="decorative-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading">Your Board Games Collection</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                Date Added (Newest First)
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Date Added (Newest First)</DropdownMenuItem>
              <DropdownMenuItem>Date Added (Oldest First)</DropdownMenuItem>
              <DropdownMenuItem>Title (A-Z)</DropdownMenuItem>
              <DropdownMenuItem>Title (Z-A)</DropdownMenuItem>
              <DropdownMenuItem>Play Time</DropdownMenuItem>
              <DropdownMenuItem>Player Count</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {boardGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center space-x-4 p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img src={game.image || "/placeholder.svg"} alt={game.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-heading font-semibold text-accent-gold">{game.title}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{game.players}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{game.playTime}</span>
                    </div>
                    {game.rating && (
                      <div className="flex items-center space-x-1">
                        <span>★ {game.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={game.source === "BGG" ? "default" : "secondary"} className="text-xs">
                  {game.source}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
