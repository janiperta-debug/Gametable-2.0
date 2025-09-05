import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter } from "lucide-react"

export function MyGamesHeader() {
  return (
    <Card className="room-furniture">
      <CardHeader>
        <CardTitle className="text-2xl font-charm ornate-text">My Games</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent-gold h-4 w-4" />
            <Input
              placeholder="Search your games..."
              className="pl-10 bg-surface-dark border-accent-gold/20 text-foreground placeholder:text-muted-foreground font-merriweather"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-accent-gold/20 text-accent-gold hover:bg-accent-gold/10 bg-transparent"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm" className="bg-accent-gold text-surface-dark hover:bg-accent-copper font-cinzel">
              <Plus className="h-4 w-4 mr-2" />
              Add Game
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
