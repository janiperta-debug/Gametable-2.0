"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RefreshCw } from "lucide-react"

export function ProgressLevel() {
  const currentLevel = 9
  const totalXP = 800
  const currentXP = 0
  const xpToNextLevel = 100

  return (
    <div className="room-furniture p-6 space-y-4">
      {/* Level Display */}
      <h2 className="text-2xl text-accent-gold">Progress & Level</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-accent-gold/20 border border-accent-gold/40 rounded">
              <span className="text-2xl font-cinzel text-accent-gold">Level {currentLevel}</span>
            </div>
            <span className="text-lg font-merriweather text-muted-foreground">{totalXP} total XP</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background bg-transparent"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-merriweather">
            <span className="text-accent-gold">Progress to Level {currentLevel + 1}</span>
            <span className="text-muted-foreground">
              {currentXP} / {xpToNextLevel} XP
            </span>
          </div>
          <Progress value={(currentXP / xpToNextLevel) * 100} className="h-2" />
        </div>

        {/* XP Earning Methods */}
        <div className="space-y-2 pt-2">
          <ul className="space-y-1 text-sm font-merriweather text-accent-gold/80">
            <li>• Add games to your collection: +50 XP</li>
            <li>• Import BGG collection: +200 XP (one-time)</li>
            <li>• Host gaming events: +100 XP</li>
            <li>• Attend events: +75 XP</li>
            <li>• Complete profile: +150 XP</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
