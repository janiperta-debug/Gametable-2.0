"use client"

import { Button } from "@/components/ui/button"
import { Gamepad2, Users } from "lucide-react"

interface DiscoverToggleProps {
  activeTab: "games" | "players"
  onTabChange: (tab: "games" | "players") => void
}

export function DiscoverToggle({ activeTab, onTabChange }: DiscoverToggleProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex space-x-1 bg-card/50 p-1 rounded-lg border">
        <Button
          variant={activeTab === "games" ? "default" : "ghost"}
          onClick={() => onTabChange("games")}
          className={`flex items-center space-x-2 ${activeTab === "games" ? "theme-accent-gold" : ""}`}
        >
          <Gamepad2 className="h-4 w-4" />
          <span className="font-cinzel">Discover Games</span>
        </Button>
        <Button
          variant={activeTab === "players" ? "default" : "ghost"}
          onClick={() => onTabChange("players")}
          className={`flex items-center space-x-2 ${activeTab === "players" ? "theme-accent-gold" : ""}`}
        >
          <Users className="h-4 w-4" />
          <span className="font-cinzel">Find Players</span>
        </Button>
      </div>
    </div>
  )
}
