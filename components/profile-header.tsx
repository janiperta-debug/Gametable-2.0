import { Button } from "@/components/ui/button"
import { Camera, Edit, Settings } from "lucide-react"

export function ProfileHeader() {
  return (
    <div className="room-furniture relative overflow-hidden">
      {/* Cover Photo Area */}
      <div className="h-48 relative bg-gradient-to-br from-accent-gold/20 to-accent-copper/20 manor-texture">
        {/* Corner decorative elements */}
        <div className="absolute top-4 left-4 text-accent-gold text-lg opacity-60">♠</div>
        <div className="absolute top-4 right-4 text-accent-gold text-lg opacity-60">♦</div>

        {/* Change Cover Button */}
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 right-16 bg-background/80 border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background"
        >
          <Camera className="w-4 h-4 mr-2" />
          Change Cover
        </Button>
      </div>

      {/* Profile Content */}
      <div className="relative px-8 pb-8">
        {/* Avatar */}
        <div className="absolute -top-16 left-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-muted border-4 border-accent-gold shadow-lg overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-accent-gold/20 to-accent-copper/20 flex items-center justify-center">
                <span className="text-4xl text-accent-gold">A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 flex justify-between items-start">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-charm ornate-text mb-2">GameMaster Alex</h1>
              <p className="text-lg font-merriweather text-muted-foreground">
                Passionate tabletop enthusiast and strategy game collector
              </p>
            </div>

            {/* Profile Details */}
            <div className="flex items-center space-x-6 text-sm font-merriweather text-muted-foreground">
              <div className="flex items-center space-x-1">
                <span>📍</span>
                <span>Seattle, WA</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📅</span>
                <span>Joined March 2023</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-accent-gold/20 border border-accent-gold/40 rounded-full text-sm font-cinzel text-accent-gold">
                Strategy Enthusiast
              </span>
              <span className="px-3 py-1 bg-accent-copper/20 border border-accent-copper/40 rounded-full text-sm font-cinzel text-accent-copper">
                Event Organizer
              </span>
              <span className="px-3 py-1 bg-accent-gold/20 border border-accent-gold/40 rounded-full text-sm font-cinzel text-accent-gold">
                Collection Curator
              </span>
              <span className="px-3 py-1 bg-accent-copper/20 border border-accent-copper/40 rounded-full text-sm font-cinzel text-accent-copper">
                Trophy Hunter
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background bg-transparent"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background bg-transparent"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
