"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Users } from "lucide-react"

const players = [
  {
    id: 1,
    name: "Sarah Chen",
    location: "Seattle, WA",
    avatar: "/placeholder.svg?height=64&width=64",
    games: 156,
    interests: ["Strategy", "Euro Games", "Worker Placement"],
    status: "Looking for group",
  },
  {
    id: 2,
    name: "Mike Rodriguez",
    location: "Portland, OR",
    avatar: "/placeholder.svg?height=64&width=64",
    games: 89,
    interests: ["RPG", "D&D", "Storytelling"],
    status: "Available weekends",
  },
  {
    id: 3,
    name: "Emma Thompson",
    location: "Vancouver, BC",
    avatar: "/placeholder.svg?height=64&width=64",
    games: 203,
    interests: ["Cooperative", "Legacy", "Campaign"],
    status: "Hosting weekly",
  },
]

export function DiscoverPlayers() {
  const [locationFilter, setLocationFilter] = useState("")
  const [gameFilter, setGameFilter] = useState("")
  const [gameTypeFilter, setGameTypeFilter] = useState("")

  return (
    <div className="space-y-8">
      <Card className="room-furniture">
        <CardHeader>
          <CardTitle className="text-2xl font-charm ornate-text">Refine Your Search</CardTitle>
          <p className="font-merriweather text-muted-foreground">
            Connect with fellow gamers in your area and expand your gaming circle.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-cinzel text-accent-gold">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g., Mystic Valley or postal code"
                  className="pl-10 font-merriweather"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Game Title Filter */}
            <div className="space-y-2">
              <label className="text-sm font-cinzel text-accent-gold">Search by Game Title</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g., Gloomhaven, Dungeons & Dragons"
                  className="pl-10 font-merriweather"
                  value={gameFilter}
                  onChange={(e) => setGameFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Game Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-cinzel text-accent-gold">Preferred Game Type</label>
              <Select value={gameTypeFilter} onValueChange={setGameTypeFilter}>
                <SelectTrigger className="font-merriweather">
                  <SelectValue placeholder="Any Game Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="board-games">Board Games</SelectItem>
                  <SelectItem value="rpgs">RPGs</SelectItem>
                  <SelectItem value="miniatures">Miniatures</SelectItem>
                  <SelectItem value="trading-cards">Trading Cards</SelectItem>
                  <SelectItem value="party-games">Party Games</SelectItem>
                  <SelectItem value="strategy">Strategy Games</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center">
            <Button className="px-8 font-cinzel bg-accent-gold hover:bg-accent-copper">Search for Players</Button>
          </div>
        </CardContent>
      </Card>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
          <Card key={player.id} className="picture-frame">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
                    <AvatarFallback className="font-cinzel">
                      {player.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-cinzel font-semibold text-lg">{player.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="font-merriweather">{player.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      <span className="font-merriweather">{player.games} games</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-merriweather text-muted-foreground">Interests:</p>
                  <div className="flex flex-wrap gap-1">
                    {player.interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs font-cinzel">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Badge variant="secondary" className="font-cinzel">
                    {player.status}
                  </Badge>
                </div>

                <Button className="w-full font-cinzel">Connect</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
