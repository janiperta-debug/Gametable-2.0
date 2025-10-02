"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Gamepad2, User } from "lucide-react"
import Link from "next/link"

interface PlayerCardProps {
  userId: string
  name: string
  location: string
  profilePicture?: string
  gamesCount: number
  interests?: string[]
  status?: string
}

export function PlayerCard({
  userId,
  name,
  location,
  profilePicture,
  gamesCount,
  interests = [],
  status,
}: PlayerCardProps) {
  return (
    <Card className="decorative-border hover:border-amber-600/50 transition-all h-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center mb-4">
          <Avatar className="h-20 w-20 mb-3 border-2 border-amber-600/30">
            <AvatarImage src={profilePicture || "/placeholder.svg"} alt={name} />
            <AvatarFallback className="text-xl bg-amber-950/50">{name.charAt(0)}</AvatarFallback>
          </Avatar>

          <h3 className="font-cinzel text-xl font-bold mb-1">{name}</h3>

          <div className="flex items-center gap-1 text-sm text-amber-600 mb-2">
            <MapPin className="h-3 w-3" />
            <span className="font-merriweather">{location}</span>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Gamepad2 className="h-3 w-3" />
            <span className="font-merriweather">{gamesCount} games</span>
          </div>
        </div>

        {interests.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 font-merriweather">Interests:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {interests.map((interest, index) => (
                <Badge key={index} variant="outline" className="text-xs border-amber-600/30 text-amber-600">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {status && (
          <div className="mb-4 flex justify-center">
            <Badge className="bg-amber-600/20 text-amber-600 hover:bg-amber-600/30 border-amber-600/30">{status}</Badge>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 border-amber-600/30 hover:bg-amber-600/10 bg-transparent" asChild>
            <Link href={`/profile/${userId}`}>
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </Button>

          <Button
            variant="default"
            className="flex-1 bg-red-900 hover:bg-red-800"
            onClick={(e) => {
              e.stopPropagation()
              console.log("[v0] Connect clicked for user:", userId)
            }}
          >
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
