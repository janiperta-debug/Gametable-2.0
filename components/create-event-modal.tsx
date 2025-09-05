"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, UserCheck, Lock } from "lucide-react"

interface CreateEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEventModal({ open, onOpenChange }: CreateEventModalProps) {
  const [gameSource, setGameSource] = useState<"collection" | "manual">("collection")
  const [privacy, setPrivacy] = useState("public")
  const [formData, setFormData] = useState({
    title: "",
    game: "",
    date: "",
    time: "",
    location: "",
    maxPlayers: "",
    description: "",
  })

  // Mock user collection games
  const collectionGames = [
    "Wingspan",
    "Azul",
    "Gloomhaven",
    "Ticket to Ride",
    "Scythe",
    "Pandemic",
    "Catan",
    "Splendor",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle event creation
    console.log("[v0] Creating event:", { ...formData, gameSource, privacy })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="room-furniture w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="ornate-text font-heading text-2xl">Create Event</DialogTitle>
          <DialogDescription className="font-body text-muted-foreground">
            Create a new gaming event and invite players to join your tabletop adventure.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="font-body text-accent-gold">
                Title
              </Label>
              <Input
                id="title"
                placeholder="Event Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="font-body"
                required
              />
            </div>

            {/* Game Selection */}
            <div className="space-y-4">
              <Label className="font-body text-accent-gold">Game</Label>

              {/* Toggle Buttons */}
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={() => setGameSource("collection")}
                  className={gameSource === "collection" ? "theme-accent-gold" : ""}
                  variant={gameSource === "collection" ? "default" : "ghost"}
                >
                  From Collection
                </Button>
                <Button
                  type="button"
                  onClick={() => setGameSource("manual")}
                  className={gameSource === "manual" ? "theme-accent-gold" : ""}
                  variant={gameSource === "manual" ? "default" : "ghost"}
                >
                  Manual Entry
                </Button>
              </div>

              {/* Game Input */}
              {gameSource === "collection" ? (
                <Select value={formData.game} onValueChange={(value) => setFormData({ ...formData, game: value })}>
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Select a game..." />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionGames.map((game) => (
                      <SelectItem key={game} value={game} className="font-body">
                        {game}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Enter game name..."
                  value={formData.game}
                  onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  className="font-body"
                />
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="font-body text-accent-gold">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="font-body"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="font-body text-accent-gold">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="font-body"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="font-body text-accent-gold">
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., 'Online' or 'My Place'"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="font-body"
                required
              />
            </div>

            {/* Max Players */}
            <div className="space-y-2">
              <Label htmlFor="maxPlayers" className="font-body text-accent-gold">
                Max Players
              </Label>
              <Input
                id="maxPlayers"
                type="number"
                placeholder="e.g., 4"
                value={formData.maxPlayers}
                onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                className="font-body"
                min="1"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="font-body text-accent-gold">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Anything else to know? (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="font-body min-h-[100px]"
              />
            </div>

            {/* Event Privacy */}
            <div className="space-y-4">
              <Label className="font-body text-accent-gold">Event Privacy</Label>
              <RadioGroup value={privacy} onValueChange={setPrivacy} className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-accent-gold/20">
                  <RadioGroupItem value="public" id="public" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Globe className="h-4 w-4 text-accent-gold" />
                      <Label htmlFor="public" className="font-body font-semibold text-accent-gold">
                        Public
                      </Label>
                    </div>
                    <p className="font-body text-sm text-muted-foreground">Anyone can see and join this event</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border border-accent-gold/20">
                  <RadioGroupItem value="friends" id="friends" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <UserCheck className="h-4 w-4 text-accent-gold" />
                      <Label htmlFor="friends" className="font-body font-semibold text-accent-gold">
                        Friends Only
                      </Label>
                    </div>
                    <p className="font-body text-sm text-muted-foreground">Only your friends can see and join</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border border-accent-gold/20">
                  <RadioGroupItem value="private" id="private" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Lock className="h-4 w-4 text-accent-gold" />
                      <Label htmlFor="private" className="font-body font-semibold text-accent-gold">
                        Private (Invite Only)
                      </Label>
                    </div>
                    <p className="font-body text-sm text-muted-foreground">Only invited players can see this event</p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-accent-gold/20 bg-background">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" className="theme-accent-gold" onClick={handleSubmit}>
            Create Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
