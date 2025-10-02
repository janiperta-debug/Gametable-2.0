"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="w-full h-auto flex-wrap justify-start gap-2 bg-transparent border-0 p-0">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="font-cinzel data-[state=active]:font-semibold"
              >
                {category.label}
                <span className="ml-2 text-xs opacity-70">({category.count})</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  )
}
