"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

export function FriendsList() {
  const friends: any[] = []

  return (
    <div className="room-furniture p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl text-accent-gold">Friends ({friends.length})</h2>
      </div>

      {friends.length === 0 ? (
        <p className="text-muted-foreground font-merriweather">No friends yet. Connect with other gamers!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
          <div
            key={friend.id}
            className="p-5 bg-background/40 border border-accent-gold/30 rounded-lg hover:border-accent-gold/50 transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              <Avatar className={`${friend.color} text-white w-12 h-12`}>
                <AvatarFallback className={`${friend.color} text-white text-lg`}>{friend.avatar}</AvatarFallback>
              </Avatar>
              <span className="font-merriweather text-foreground text-lg">{friend.name}</span>
            </div>
            <div className="flex gap-2">
              <Link href={`/profile/${friend.id}`} className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-accent-gold/40 text-accent-gold hover:bg-accent-gold/10 bg-transparent"
                >
                  View Profile →
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="border-red-400/40 text-red-400 hover:bg-red-400/10 bg-transparent"
              >
                Remove
              </Button>
            </div>
          </div>
          ))}
        </div>
      )}

      <p className="text-sm font-merriweather text-accent-gold/60 italic pt-2">
        Your location and game interests are visible to others to help find gaming partners. Direct messaging and event
        organization are limited to friends.
      </p>
    </div>
  )
}
