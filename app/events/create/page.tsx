"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Globe, UserCheck, Lock } from "lucide-react"

export default function CreateEventPage() {
  const router = useRouter()
  const [gameSelection, setGameSelection] = useState("collection")
  const [privacy, setPrivacy] = useState("public")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    router.push("/events")
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="ornate-text font-heading text-3xl font-bold">Create Event</h1>
          </div>

          {/* Form */}
          <Card className="room-furniture">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-body text-accent-gold">
                    Title
                  </Label>
                  <Input id="title" placeholder="Event Title" className="font-body" />
                </div>

                {/* Game Selection */}
                <div className="space-y-4">
                  <Label className="font-body text-accent-gold">Game</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={gameSelection === "collection" ? "default" : "outline"}
                      className={gameSelection === "collection" ? "theme-accent-gold" : "bg-transparent"}
                      onClick={() => setGameSelection("collection")}
                    >
                      From Collection
                    </Button>
                    <Button
                      type="button"
                      variant={gameSelection === "manual" ? "default" : "outline"}
                      className={gameSelection === "manual" ? "theme-accent-gold" : "bg-transparent"}
                      onClick={() => setGameSelection("manual")}
                    >
                      Manual Entry
                    </Button>
                  </div>

                  {gameSelection === "collection" ? (
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wingspan">Wingspan</SelectItem>
                        <SelectItem value="azul">Azul</SelectItem>
                        <SelectItem value="gloomhaven">Gloomhaven</SelectItem>
                        <SelectItem value="pandemic">Pandemic</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input placeholder="Enter game name manually" />
                  )}
                </div>

                {/* Date & Time */}
                <div className="space-y-2">
                  <Label htmlFor="datetime" className="font-body text-accent-gold">
                    Date & Time
                  </Label>
                  <Input id="datetime" type="datetime-local" className="font-body" />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-body text-accent-gold">
                    Location
                  </Label>
                  <Input id="location" placeholder="e.g., 'Online' or 'My Place'" className="font-body" />
                </div>

                {/* Max Players */}
                <div className="space-y-2">
                  <Label htmlFor="maxPlayers" className="font-body text-accent-gold">
                    Max Players
                  </Label>
                  <Input id="maxPlayers" type="number" placeholder="e.g., 4" className="font-body" />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-body text-accent-gold">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Anything else to know? (optional)"
                    className="font-body min-h-[100px]"
                  />
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <Label className="font-body text-accent-gold">Event Privacy</Label>
                  <RadioGroup value={privacy} onValueChange={setPrivacy} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="public" id="public" />
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-accent-gold" />
                        <div>
                          <Label htmlFor="public" className="font-body font-medium text-accent-gold">
                            Public
                          </Label>
                          <p className="font-body text-sm text-muted-foreground">Anyone can see and join this event</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="friends" id="friends" />
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-accent-gold" />
                        <div>
                          <Label htmlFor="friends" className="font-body font-medium text-accent-gold">
                            Friends Only
                          </Label>
                          <p className="font-body text-sm text-muted-foreground">Only your friends can see and join</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="private" id="private" />
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-accent-gold" />
                        <div>
                          <Label htmlFor="private" className="font-body font-medium text-accent-gold">
                            Private (Invite Only)
                          </Label>
                          <p className="font-body text-sm text-muted-foreground">
                            Only invited players can see this event
                          </p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent">
                    Cancel
                  </Button>
                  <Button type="submit" className="theme-accent-gold">
                    Create Event
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
