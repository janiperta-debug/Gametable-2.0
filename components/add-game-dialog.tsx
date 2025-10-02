"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AddGameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddGameDialog({ open, onOpenChange }: AddGameDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    playerCount: "",
    playTime: "",
    category: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Adding game:", formData)
    // Mock: In real app, this would add to Firebase
    onOpenChange(false)
    setFormData({ title: "", playerCount: "", playTime: "", category: "", notes: "" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] room-furniture">
        <DialogHeader>
          <DialogTitle className="ornate-text font-heading text-2xl">Add Game to Collection</DialogTitle>
          <DialogDescription className="font-body">
            Manually add a game to your collection. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-body">
              Game Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter game name"
              required
              className="font-body"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playerCount" className="font-body">
                Player Count
              </Label>
              <Input
                id="playerCount"
                value={formData.playerCount}
                onChange={(e) => setFormData({ ...formData, playerCount: e.target.value })}
                placeholder="e.g., 2-4"
                className="font-body"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playTime" className="font-body">
                Play Time (min)
              </Label>
              <Input
                id="playTime"
                value={formData.playTime}
                onChange={(e) => setFormData({ ...formData, playTime: e.target.value })}
                placeholder="e.g., 30-60"
                className="font-body"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className="font-body">
              Category
            </Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Strategy, Family"
              className="font-body"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-body">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this game..."
              className="font-body"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-body">
              Cancel
            </Button>
            <Button type="submit" className="theme-accent-gold font-body">
              Add Game
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
