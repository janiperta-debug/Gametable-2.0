"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Users, Clock, Calendar, ArrowLeft, Save, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewGamePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    category: "board-games",
    rating: "0",
    playerCount: "",
    playTime: "",
    yearPublished: new Date().getFullYear().toString(),
    mechanics: [] as string[],
    description: "",
    image: "/board-game-box.jpg",
  })

  const [newMechanic, setNewMechanic] = useState("")

  const handleAddMechanic = () => {
    if (newMechanic.trim() && !formData.mechanics.includes(newMechanic.trim())) {
      setFormData({
        ...formData,
        mechanics: [...formData.mechanics, newMechanic.trim()],
      })
      setNewMechanic("")
    }
  }

  const handleRemoveMechanic = (mechanic: string) => {
    setFormData({
      ...formData,
      mechanics: formData.mechanics.filter((m) => m !== mechanic),
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Save game to database
    console.log("[v0] Saving game:", formData)
    router.push("/collection")
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/collection">
            <Button variant="ghost" className="font-body hover:text-accent-gold">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Collection
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Game Image */}
            <div className="lg:col-span-1">
              <Card className="picture-frame overflow-hidden sticky top-8">
                <div className="aspect-[3/4] relative bg-surface/50">
                  <img
                    src={formData.image || "/placeholder.svg"}
                    alt="Game preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <Label htmlFor="image" className="font-body text-sm">
                    Image URL
                  </Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="Enter image URL"
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Game Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Category */}
              <Card className="room-furniture">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="title" className="font-body text-sm">
                      Game Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter game title"
                      className="mt-2 text-2xl font-heading font-bold"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="font-body text-sm">
                      Category *
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="board-games">Board Games</option>
                      <option value="rpgs">RPGs</option>
                      <option value="miniatures">Miniatures</option>
                      <option value="trading-cards">Trading Cards</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="room-furniture">
                <CardContent className="p-6">
                  <h2 className="ornate-text font-heading text-xl font-bold mb-4">Game Stats</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="playerCount" className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Users className="h-4 w-4" />
                        Players
                      </Label>
                      <Input
                        id="playerCount"
                        value={formData.playerCount}
                        onChange={(e) => setFormData({ ...formData, playerCount: e.target.value })}
                        placeholder="2-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playTime" className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Clock className="h-4 w-4" />
                        Play Time (min)
                      </Label>
                      <Input
                        id="playTime"
                        value={formData.playTime}
                        onChange={(e) => setFormData({ ...formData, playTime: e.target.value })}
                        placeholder="30-60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearPublished" className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="h-4 w-4" />
                        Published
                      </Label>
                      <Input
                        id="yearPublished"
                        type="number"
                        value={formData.yearPublished}
                        onChange={(e) => setFormData({ ...formData, yearPublished: e.target.value })}
                        placeholder="2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating" className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Star className="h-4 w-4" />
                        Rating
                      </Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                        placeholder="4.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mechanics */}
              <Card className="room-furniture">
                <CardContent className="p-6">
                  <h2 className="ornate-text font-heading text-xl font-bold mb-4">Game Mechanics</h2>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMechanic}
                        onChange={(e) => setNewMechanic(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMechanic())}
                        placeholder="Add a mechanic (e.g., deck-building)"
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddMechanic} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.mechanics.map((mechanic) => (
                        <Badge
                          key={mechanic}
                          variant="secondary"
                          className="font-body text-sm px-3 py-1 bg-accent-gold/10 text-accent-gold border border-accent-gold/20 cursor-pointer hover:bg-accent-gold/20"
                          onClick={() => handleRemoveMechanic(mechanic)}
                        >
                          {mechanic}
                          <X className="h-3 w-3 ml-2" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="room-furniture">
                <CardContent className="p-6">
                  <h2 className="ornate-text font-heading text-xl font-bold mb-4">About This Game</h2>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter a description of the game..."
                    className="min-h-[150px] font-body"
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card className="room-furniture">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" className="flex-1 theme-accent-gold">
                      <Save className="h-4 w-4 mr-2" />
                      Save Game
                    </Button>
                    <Link href="/collection" className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-muted-foreground/50 bg-transparent"
                      >
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
