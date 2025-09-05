import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, Users } from "lucide-react"

const trophies = [
  {
    id: 1,
    title: "Collection Curator",
    description: "Own 250+ games",
    icon: Trophy,
    rarity: "Gold",
    earned: "2 days ago",
    color: "text-amber-500",
  },
  {
    id: 2,
    title: "Social Butterfly",
    description: "Connect with 25+ gamers",
    icon: Users,
    rarity: "Silver",
    earned: "1 week ago",
    color: "text-gray-400",
  },
  {
    id: 3,
    title: "Event Master",
    description: "Host 10 successful events",
    icon: Target,
    rarity: "Bronze",
    earned: "2 weeks ago",
    color: "text-amber-600",
  },
]

export function TrophyShowcase() {
  return (
    <Card className="room-furniture">
      <CardHeader>
        <CardTitle className="text-xl font-charm ornate-text">Trophy Showcase</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trophies.map((trophy) => (
            <div key={trophy.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card/50">
              <trophy.icon className={`h-8 w-8 ${trophy.color}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-cinzel font-medium text-sm">{trophy.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {trophy.rarity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-merriweather">{trophy.description}</p>
                <p className="text-xs text-muted-foreground mt-1">Earned {trophy.earned}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
