import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ThemeSelector } from "@/components/theme-selector"
import {
  Palette,
  Home,
  Lock,
  Star,
  Zap,
  Sparkles,
  SortAsc as Portal,
  CheckCircle,
  Circle,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { getRoomsByCategory, type RoomTheme } from "@/lib/room-themes"

// Mock user data - in real app this would come from your backend
const currentUser = {
  level: 12,
  xp: 1850,
  xpToNextLevel: 2400,
  xpForCurrentLevel: 2200,
  unlockedRooms: ["main-hall", "library"], // User has unlocked 2 ground floor rooms
  availableUnlocks: 1, // User can unlock 1 more ground floor room
  currentDimension: "classic", // classic, cyberpunk-2050, cartoon-world, steampunk, etc.
}

const groundFloorRooms = getRoomsByCategory("Ground Floor")
const secondFloorRooms = getRoomsByCategory("Second Floor")
const basementRooms = getRoomsByCategory("Basement")

function RoomCard({ room, floorComplete }: { room: RoomTheme; floorComplete: boolean }) {
  const canActuallyUnlock = room.canUnlock && currentUser.availableUnlocks > 0 && floorComplete

  return (
    <div className="room-furniture relative">
      {/* Room Image Preview */}
      <div className="aspect-video overflow-hidden bg-muted relative mb-4">
        <img
          src={room.image || "/placeholder.svg"}
          alt={room.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {/* Unlock Status Overlay */}
        {!room.isUnlocked && !canActuallyUnlock && (
          <div className="absolute inset-0 bg-surface-dark/40 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center text-text-contrast">
              <Lock className="h-8 w-8 mx-auto mb-2" />
              <Badge variant="secondary" className="text-xs">
                {!floorComplete ? "Complete previous floor" : "Choose unlock order"}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="ornate-text font-heading text-xl font-bold flex items-center">
            {room.isUnlocked ? (
              <CheckCircle className="h-5 w-5 mr-2 text-success" />
            ) : canActuallyUnlock ? (
              <Circle className="h-5 w-5 mr-2 text-info" />
            ) : (
              <Lock className="h-5 w-5 mr-2 text-muted-foreground" />
            )}
            {room.name}
          </h3>
          <div className="flex flex-col items-end space-y-1">
            {room.isActive && <Badge className="theme-accent-gold text-xs">Current Room</Badge>}
            {canActuallyUnlock && <Badge className="bg-info/10 text-info border-info/20 text-xs">Can Unlock</Badge>}
            <Badge
              variant="outline"
              className={`text-xs ${
                room.category === "Ground Floor"
                  ? "border-info/20 text-info"
                  : room.category === "Second Floor"
                    ? "border-secondary/20 text-secondary"
                    : "border-tertiary/20 text-tertiary"
              }`}
            >
              {room.category}
            </Badge>
          </div>
        </div>

        {/* Color Preview */}
        <div className="flex space-x-1 h-8 overflow-hidden border-2 border-accent-gold/40">
          <div className="flex-1" style={{ backgroundColor: room.colors.primary }} />
          <div className="flex-1" style={{ backgroundColor: room.colors.secondary }} />
          <div className="flex-1" style={{ backgroundColor: room.colors.accent }} />
          <div className="flex-1" style={{ backgroundColor: room.colors.background }} />
        </div>

        {/* Description */}
        <div className="space-y-3">
          <p className="font-body text-sm text-muted-foreground leading-relaxed">{room.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-heading border-accent-copper/40 bg-accent-copper/10">
              {room.atmosphere}
            </Badge>
            <ThemeSelector room={room} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ThemesPage() {
  const xpProgress =
    ((currentUser.xp - currentUser.xpForCurrentLevel) / (currentUser.xpToNextLevel - currentUser.xpForCurrentLevel)) *
    100

  const groundFloorProgress = currentUser.unlockedRooms.length
  const groundFloorComplete = groundFloorProgress === groundFloorRooms.length

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Clean Header - No Decorative Elements */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Palette className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="ornate-text font-heading text-5xl font-bold">Dimensional Manor System</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            Choose your path through each floor, unlock dimensions, and discover infinite gaming realms
          </p>
        </div>

        {/* Progress Cards with Room Furniture Styling */}
        <div className="grid gap-8 md:grid-cols-2 mb-12">
          <div className="room-furniture">
            <div className="space-y-6">
              <h2 className="ornate-text font-heading text-2xl font-bold flex items-center">
                <Star className="h-6 w-6 mr-3" />
                Your Progress
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold text-accent-gold font-heading">Level {currentUser.level}</div>
                  <div className="text-sm text-muted-foreground font-body">
                    {currentUser.xp.toLocaleString()} XP earned
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold font-heading">
                    {(currentUser.xpToNextLevel - currentUser.xp).toLocaleString()} XP
                  </div>
                  <div className="text-sm text-muted-foreground font-body">to Level {currentUser.level + 1}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={xpProgress} className="h-4 border-2 border-accent-gold/40" />
                <div className="flex justify-between text-xs text-muted-foreground font-body">
                  <span>Level {currentUser.level}</span>
                  <span>{Math.round(xpProgress)}% complete</span>
                  <span>Level {currentUser.level + 1}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="room-furniture">
            <div className="space-y-6">
              <h2 className="ornate-text font-heading text-2xl font-bold flex items-center">
                <Zap className="h-6 w-6 mr-3" />
                Unlock Choices
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold font-body">Available Unlocks:</span>
                  <Badge className="bg-info/10 text-info border-info/20 text-lg px-3 py-1">
                    {currentUser.availableUnlocks}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground font-body">
                  You can choose which Ground Floor room to unlock next! Complete all 7 to access Second Floor.
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-body">
                    <span>Ground Floor Rooms</span>
                    <span>
                      {groundFloorProgress}/{groundFloorRooms.length}
                    </span>
                  </div>
                  <Progress
                    value={(groundFloorProgress / groundFloorRooms.length) * 100}
                    className="h-3 border-2 border-accent-copper/40"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ground Floor - Heritage Rooms */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Home className="h-7 w-7 text-accent-gold mr-3" />
              <h2 className="ornate-text font-heading text-3xl font-bold">Ground Floor</h2>
              <Badge variant="secondary" className="ml-4 font-body text-base px-4 py-2">
                Choose Your Path
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground font-body">
              {groundFloorProgress} of {groundFloorRooms.length} unlocked •{" "}
              {groundFloorComplete ? "Floor Complete!" : `${currentUser.availableUnlocks} choices available`}
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {groundFloorRooms.map((room) => (
              <RoomCard key={room.id} room={room} floorComplete={groundFloorComplete} />
            ))}
          </div>
        </div>

        {/* Second Floor - Club Rooms */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <ArrowUp className="h-7 w-7 text-accent-gold mr-3" />
              <h2 className="ornate-text font-heading text-3xl font-bold">Second Floor</h2>
              <Badge variant="secondary" className="ml-4 font-body text-base px-4 py-2">
                Levels 40-70
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground font-body">
              {groundFloorComplete ? "Available after Ground Floor completion" : "Complete Ground Floor first"}
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {secondFloorRooms.map((room) => (
              <RoomCard key={room.id} room={room} floorComplete={groundFloorComplete} />
            ))}
          </div>
        </div>

        {/* Basement - Secret Chambers */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <ArrowDown className="h-7 w-7 text-accent-gold mr-3" />
              <h2 className="ornate-text font-heading text-3xl font-bold">Basement</h2>
              <Badge variant="secondary" className="ml-4 font-body text-base px-4 py-2">
                Levels 75-95
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground font-body">
              {false ? "Available after Second Floor completion" : "Complete Second Floor first"}
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {basementRooms.map((room) => (
              <RoomCard key={room.id} room={room} floorComplete={false} />
            ))}
          </div>
        </div>

        {/* Portal System Card */}
        <div className="room-furniture text-center">
          <div className="space-y-6">
            <Portal className="h-20 w-20 text-accent-gold mx-auto animate-pulse" />
            <h3 className="ornate-text font-heading text-3xl font-bold">The Ultimate Adventure Awaits</h3>
            <p className="font-body text-muted-foreground max-w-4xl mx-auto text-lg leading-relaxed">
              Reach Level 100 to unlock the Portal System and access infinite dimensional realms. Each dimension offers
              unique rooms, fresh XP activities, and completely new ways to experience your gaming journey. No grinding
              - just endless discovery!
            </p>
            <div className="grid gap-6 md:grid-cols-3 max-w-3xl mx-auto mt-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-gold font-heading">∞</div>
                <div className="text-sm text-muted-foreground font-body">Dimensions</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-gold font-heading">19×∞</div>
                <div className="text-sm text-muted-foreground font-body">Unique Rooms</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent-gold font-heading">Fresh</div>
                <div className="text-sm text-muted-foreground font-body">XP Activities</div>
              </div>
            </div>
            <div className="flex justify-center space-x-2 mt-8">
              <Sparkles className="h-5 w-5 text-accent-gold" />
              <span className="text-base font-heading text-accent-gold">Every dimension tells a different story</span>
              <Sparkles className="h-5 w-5 text-accent-gold" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
