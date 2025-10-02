"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Loader2 } from "lucide-react"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: string
}

export function ImportDialog({ open, onOpenChange, source }: ImportDialogProps) {
  const [username, setUsername] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsImporting(true)
    console.log("[v0] Importing from", source, "for user:", username)

    // Mock: Simulate import delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsImporting(false)
    onOpenChange(false)
    setUsername("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] room-furniture">
        <DialogHeader>
          <DialogTitle className="ornate-text font-heading text-2xl flex items-center gap-2">
            <Download className="h-6 w-6 text-accent-gold" />
            Import from {source}
          </DialogTitle>
          <DialogDescription className="font-body">
            Enter your {source} username to import your collection. This may take a few moments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleImport} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="font-body">
              {source} Username *
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`Enter your ${source} username`}
              required
              disabled={isImporting}
              className="font-body"
            />
          </div>
          <div className="bg-accent-gold/10 border border-accent-gold/20 rounded-lg p-4">
            <p className="text-sm font-body text-muted-foreground">
              <strong>Note:</strong> This will import all games from your {source} collection. Existing games will not
              be duplicated.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
              className="font-body"
            >
              Cancel
            </Button>
            <Button type="submit" className="theme-accent-gold font-body" disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import Collection
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
