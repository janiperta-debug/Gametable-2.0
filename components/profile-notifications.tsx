"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export function ProfileNotifications() {
  const [isExpanded, setIsExpanded] = useState(false)
  const unreadCount = 0

  return (
    <div className="room-furniture p-6">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between text-left">
        <h2 className="text-2xl font-charm ornate-text text-accent-gold">My Notifications ({unreadCount} unread)</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-accent-gold" />
        ) : (
          <ChevronDown className="w-5 h-5 text-accent-gold" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-accent-gold/20">
          <p className="text-center text-muted-foreground font-merriweather py-8">No new notifications</p>
        </div>
      )}
    </div>
  )
}
