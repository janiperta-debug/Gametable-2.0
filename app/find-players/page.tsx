import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, Search, UserPlus } from "lucide-react"

export default function FindPlayersPage() {
  return (
    <div className="min-h-screen manor-bg">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-amber-600 mr-3" />
            <h1 className="font-cinzel text-4xl font-bold">Find Players</h1>
          </div>
          <p className="font-merriweather text-muted-foreground text-lg">
            Connect with fellow gaming enthusiasts in your area and beyond
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="decorative-border">
              <CardHeader>
                <CardTitle className="font-cinzel">Search Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Search className="h-4 w-4 mr-2" />
                  Game Preferences
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="h-4 w-4 mr-2" />
                  Group Size
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="decorative-border">
              <CardHeader>
                <CardTitle className="font-cinzel">Gaming Community</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border bg-card/50">
                      <Avatar>
                        <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                        <AvatarFallback>GM</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">Gaming Enthusiast {i}</h4>
                        <p className="text-sm text-muted-foreground">Seattle, WA • 5 miles away</p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Strategy
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Cooperative
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-cinzel text-xl font-semibold mb-2">Build Your Gaming Circle</h3>
                  <p className="font-merriweather text-muted-foreground mb-6">
                    Advanced player matching, local group discovery, and social features coming soon.
                  </p>
                  <Button size="lg">Join the Community</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
