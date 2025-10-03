"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

export function GameInterests() {
  const [interests, setInterests] = useState({
    boardGames: true,
    warhammer: true,
    miniatures: true,
    rpg: true,
  })

  const handleToggle = (key: keyof typeof interests) => {
    setInterests((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="room-furniture p-8 space-y-6">
      <div>
        <h2 className="text-2xl mb-2">My Game Interests</h2>
        <p className="text-sm font-merriweather text-muted-foreground">
          Select the types of games you play or are interested in finding partners for.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="board-games"
            checked={interests.boardGames}
            onCheckedChange={() => handleToggle("boardGames")}
            className="border-accent-gold data-[state=checked]:bg-accent-gold data-[state=checked]:border-accent-gold"
          />
          <label htmlFor="board-games" className="text-base font-merriweather cursor-pointer">
            Board & Card Games
          </label>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="warhammer"
            checked={interests.warhammer}
            onCheckedChange={() => handleToggle("warhammer")}
            className="border-accent-gold data-[state=checked]:bg-accent-gold data-[state=checked]:border-accent-gold"
          />
          <label htmlFor="warhammer" className="text-base font-merriweather cursor-pointer">
            Warhammer
          </label>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="miniatures"
            checked={interests.miniatures}
            onCheckedChange={() => handleToggle("miniatures")}
            className="border-accent-gold data-[state=checked]:bg-accent-gold data-[state=checked]:border-accent-gold"
          />
          <label htmlFor="miniatures" className="text-base font-merriweather cursor-pointer">
            Other Miniature Games
          </label>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="rpg"
            checked={interests.rpg}
            onCheckedChange={() => handleToggle("rpg")}
            className="border-accent-gold data-[state=checked]:bg-accent-gold data-[state=checked]:border-accent-gold"
          />
          <label htmlFor="rpg" className="text-base font-merriweather cursor-pointer">
            Roleplaying Games (RPGs)
          </label>
        </div>
      </div>
    </div>
  )
}
