"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const categories = [
  { id: "all", label: "All Games", count: 247 },
  { id: "board-games", label: "Board Games", count: 189 },
  { id: "rpgs", label: "RPGs", count: 34 },
  { id: "miniatures", label: "Miniatures", count: 24 },
  { id: "trading-cards", label: "Trading Cards", count: 12 },
]

export function GameCategoryTabs() {
  const [activeCategory, setActiveCategory] = useState("all")

  return (
    <Card className="room-furniture">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className={
                activeCategory === category.id
                  ? "bg-accent-gold text-surface-dark hover:bg-accent-copper font-cinzel"
                  : "border-accent-gold/20 text-accent-gold hover:bg-accent-gold/10 font-cinzel"
              }
            >
              {category.label}
              <span className="ml-2 text-xs opacity-70">({category.count})</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
