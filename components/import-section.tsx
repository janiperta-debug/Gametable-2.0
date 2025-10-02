"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

type CategoryType = "board-games" | "rpgs" | "miniatures" | "trading-cards"

interface ImportSectionProps {
  selectedCategory: CategoryType
}

export function ImportSection({ selectedCategory }: ImportSectionProps) {
  const [username, setUsername] = useState("")

  const getPlaceholder = () => {
    switch (selectedCategory) {
      case "board-games":
        return "Enter your BoardGameGeek username"
      case "rpgs":
        return "Enter your RPGGeek username"
      case "miniatures":
        return "Enter your Miniatures username"
      case "trading-cards":
        return "Enter your Trading Cards username"
      default:
        return "Enter your username"
    }
  }

  const getSourceName = () => {
    switch (selectedCategory) {
      case "board-games":
        return "BoardGameGeek"
      case "rpgs":
        return "RPGGeek"
      case "miniatures":
        return "Miniatures Database"
      case "trading-cards":
        return "Trading Cards Database"
      default:
        return "External Source"
    }
  }

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log("[v0] Importing from", getSourceName(), "for user:", username)
  }

  return (
    <Card className="room-furniture mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full bg-background text-foreground border-border"
            />
          </div>
          <Button
            onClick={handleImport}
            disabled={!username.trim()}
            style={{
              backgroundColor: username.trim() ? "hsl(var(--accent-gold))" : "hsl(var(--muted))",
              color: username.trim() ? "hsl(var(--accent-gold-foreground))" : "hsl(var(--muted-foreground))",
            }}
            className="disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
          >
            <Download className="h-4 w-4 mr-2" />
            Import from {getSourceName()}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground font-body mt-2">
          Import your collection from {getSourceName()} by entering your username
        </p>
      </CardContent>
    </Card>
  )
}
