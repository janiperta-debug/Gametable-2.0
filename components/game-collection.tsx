"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function GameCollection() {
  return (
    <div className="room-furniture p-6 space-y-4">
      <h2 className="text-2xl font-charm ornate-text text-accent-gold">My Game Collection</h2>

      <Link href="/collection">
        <Button className="bg-accent-gold hover:bg-accent-gold/90 text-background font-cinzel">View My Games</Button>
      </Link>
    </div>
  )
}
