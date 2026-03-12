"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/lib/i18n"
import { Progress } from "@/components/ui/progress"
import { ThemeSelector } from "@/components/theme-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Palette,
  Home,
  Lock,
  Star,
  Zap,
  CheckCircle,
  Circle,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react"
import { getRoomsByCategory, type RoomTheme } from "@/lib/room-themes"
import { useUser } from "@/hooks/useUser"
import { xpForNextLevel, xpForCurrentLevel } from "@/app/actions/xp"

const groundFloorRooms = getRoomsByCategory("Ground Floor")
const secondFloorRooms = getRoomsByCategory("Second Floor")
const basementRooms = getRoomsByCategory("Basement")

interface RoomCardProps {
  room: RoomTheme
  floorComplete: boolean
  t: (key: string) => string
  unlockedRooms: string[]
  availableUnlocks: number
  activeRoom: string | null
}

function RoomCard({ room, floorComplete, t, unlockedRooms, availableUnlocks, activeRoom }: RoomCardProps) {
  const isUnlocked = unlockedRooms.includes(room.id)
  const isActive = activeRoom === room.id
  const canActuallyUnlock = room.canUnlock && availableUnlocks > 0 && floorComplete && !isUnlocked

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
        {!isUnlocked && !canActuallyUnlock && (
          <div className="absolute inset-0 bg-surface-dark/40 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center text-text-contrast">
              <Lock className="h-8 w-8 mx-auto mb-2" />
              <Badge variant="secondary" className="text-xs">
                {!floorComplete ? t("themes.completePreviousFloor") : t("themes.chooseUnlockOrder")}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="ornate-text font-heading text-xl font-bold flex items-center">
            {isUnlocked ? (
              <CheckCircle className="h-5 w-5 mr-2 text-success" />
            ) : canActuallyUnlock ? (
              <Circle className="h-5 w-5 mr-2 text-info" />
            ) : (
              <Lock className="h-5 w-5 mr-2 text-muted-foreground" />
            )}
            {room.name}
          </h3>
          <div className="flex flex-col items-end space-y-1">
            {isActive && <Badge className="theme-accent-gold text-xs">{t("themes.currentRoom")}</Badge>}
            {canActuallyUnlock && <Badge className="bg-info/10 text-info border-info/20 text-xs">{t("themes.canUnlock")}</Badge>}
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
          <p className="font-body text-sm text-muted-foreground leading-relaxed">
            {t(`rooms.${room.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}.description`) || room.description}
          </p>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-heading border-accent-copper/40 bg-accent-copper/10">
              {t(`rooms.${room.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}.atmosphere`) || room.atmosphere}
            </Badge>
            <ThemeSelector room={room} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ThemesPage() {
  const [activeTab, setActiveTab] = useState("ground-floor")
  const t = useTranslations()
  const { profile, loading } = useUser()

  // Calculate XP progress from profile data
  const level = profile?.level ?? 1
  const totalXP = profile?.xp ?? 0
  const currentLevelXP = xpForCurrentLevel(level)
  const nextLevelXP = xpForNextLevel(level)
  const xpInCurrentLevel = totalXP - currentLevelXP
  const xpNeededForLevel = nextLevelXP - currentLevelXP
  const xpProgress = xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 0

  // Get unlocked rooms from profile
  const unlockedRooms = useMemo(() => {
    // Main-hall is always unlocked by default
    const defaultRooms = ["main-hall"]
    const profileRooms = profile?.unlocked_themes ?? []
    return [...new Set([...defaultRooms, ...profileRooms])]
  }, [profile?.unlocked_themes])

  const activeRoom = profile?.theme ?? "main-hall"
  
  // Calculate available unlocks based on level
  // For now, simple logic: 1 unlock per 5 levels
  const availableUnlocks = Math.max(0, Math.floor(level / 5) - (unlockedRooms.length - 1))

  const groundFloorProgress = unlockedRooms.filter(r => 
    groundFloorRooms.some(gfr => gfr.id === r)
  ).length
  const groundFloorComplete = groundFloorProgress === groundFloorRooms.length

  if (loading) {
    return (
      <div className="min-h-screen room-environment flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Clean Header - No Decorative Elements */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Palette className="h-8 w-8 text-accent-gold mr-3" />
            <h1 className="logo-text text-5xl font-bold">{t("themes.title")}</h1>
          </div>
          <p className="font-body text-muted-foreground text-xl max-w-3xl mx-auto">
            {t("themes.subtitle")}
          </p>
        </div>

        {/* Progress Cards with Room Furniture Styling */}
        <div className="grid gap-8 md:grid-cols-2 mb-12">
          <div className="room-furniture">
            <div className="space-y-6">
              <h2 className="font-heading text-2xl font-bold flex items-center">
                <Star className="h-6 w-6 mr-3" />
                {t("themes.yourProgress")}
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold text-accent-gold font-heading">{t("themes.level")} {level}</div>
                  <div className="text-sm text-muted-foreground font-body">
                    {totalXP.toLocaleString()} XP {t("themes.earned")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold font-heading">
                    {(xpNeededForLevel - xpInCurrentLevel).toLocaleString()} XP
                  </div>
                  <div className="text-sm text-muted-foreground font-body">{t("themes.toLevel")} {level + 1}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={xpProgress} className="h-4 border-2 border-accent-gold/40" />
                <div className="flex justify-between text-xs text-muted-foreground font-body">
                  <span>{t("themes.level")} {level}</span>
                  <span>{Math.round(xpProgress)}% {t("themes.complete")}</span>
                  <span>{t("themes.level")} {level + 1}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="room-furniture">
            <div className="space-y-6">
              <h2 className="font-heading text-2xl font-bold flex items-center">
                <Zap className="h-6 w-6 mr-3" />
                {t("themes.unlockChoices")}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold font-body">{t("themes.availableUnlocks")}:</span>
                  <Badge className="bg-info/10 text-info border-info/20 text-lg px-3 py-1">
                    {availableUnlocks}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground font-body">
                  {t("themes.unlockDescription")}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-body">
                    <span>{t("themes.groundFloorRooms")}</span>
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

        {/* Tabs component to organize floors */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 max-w-2xl mx-auto">
            <TabsTrigger value="basement" className="font-body text-sm">
              <ArrowDown className="h-4 w-4 mr-2" />
              {t("themes.basement")}
            </TabsTrigger>
            <TabsTrigger value="ground-floor" className="font-body text-sm">
              <Home className="h-4 w-4 mr-2" />
              {t("themes.groundFloor")}
            </TabsTrigger>
            <TabsTrigger value="second-floor" className="font-body text-sm">
              <ArrowUp className="h-4 w-4 mr-2" />
              {t("themes.secondFloor")}
            </TabsTrigger>
          </TabsList>

          {/* Ground Floor content in TabsContent */}
          <TabsContent value="ground-floor">
            <div className="mb-16">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Home className="h-7 w-7 text-accent-gold mr-3" />
                  <h2 className="font-heading text-3xl font-bold">{t("themes.groundFloor")}</h2>
                  <Badge variant="secondary" className="ml-4 font-body text-base px-4 py-2">
                    {t("themes.chooseYourPath")}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground font-body">
                  {groundFloorProgress} / {groundFloorRooms.length} {t("themes.unlocked")} •{" "}
                  {groundFloorComplete ? t("themes.floorComplete") : `${currentUser.availableUnlocks} ${t("themes.availableUnlocks")}`}
                </div>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {groundFloorRooms.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    floorComplete={groundFloorComplete} 
                    t={t}
                    unlockedRooms={unlockedRooms}
                    availableUnlocks={availableUnlocks}
                    activeRoom={activeRoom}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Second Floor content in TabsContent */}
          <TabsContent value="second-floor">
            <div className="mb-16">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <ArrowUp className="h-7 w-7 text-accent-gold mr-3" />
                  <h2 className="font-heading text-3xl font-bold">{t("themes.secondFloor")}</h2>
                  <Badge variant="secondary" className="ml-4 font-body text-base px-4 py-2">
                    Levels 40-70
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground font-body">
                  {groundFloorComplete ? t("themes.floorComplete") : t("themes.completeFloorFirst")}
                </div>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {secondFloorRooms.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    floorComplete={groundFloorComplete} 
                    t={t}
                    unlockedRooms={unlockedRooms}
                    availableUnlocks={availableUnlocks}
                    activeRoom={activeRoom}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Basement content in TabsContent */}
          <TabsContent value="basement">
            <div className="mb-16">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <ArrowDown className="h-7 w-7 text-accent-gold mr-3" />
                  <h2 className="font-heading text-3xl font-bold">{t("themes.basement")}</h2>
                  <Badge variant="secondary" className="ml-4 font-body text-base px-4 py-2">
                    Levels 75-95
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground font-body">
                  {t("themes.completeFloorFirst")}
                </div>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {basementRooms.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    floorComplete={false} 
                    t={t}
                    unlockedRooms={unlockedRooms}
                    availableUnlocks={availableUnlocks}
                    activeRoom={activeRoom}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
