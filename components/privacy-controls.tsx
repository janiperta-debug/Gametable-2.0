"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Shield } from "lucide-react"

export function PrivacyControls() {
  const [showEventActivity, setShowEventActivity] = useState(true)
  const [showFriendList, setShowFriendList] = useState(true)
  const [allowFriendRequests, setAllowFriendRequests] = useState(true)
  const [showGameCollection, setShowGameCollection] = useState(true)

  return (
    <div className="room-furniture p-8 space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-6 h-6 text-accent-gold" />
        <div>
          <h2 className="text-2xl">Privacy Controls</h2>
          <p className="text-sm font-merriweather text-muted-foreground">
            Control what information is visible to other players and manage your profile privacy settings.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Show Event Activity */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-merriweather font-semibold">Show Event Activity</p>
            <p className="text-sm text-muted-foreground font-merriweather">
              Others will see: 'Attended 3 events this week, organized 1 event this month'
            </p>
          </div>
          <Switch
            checked={showEventActivity}
            onCheckedChange={setShowEventActivity}
            className="data-[state=checked]:bg-accent-gold"
          />
        </div>

        {/* Show Friend List */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-merriweather font-semibold">Show Friend List</p>
            <p className="text-sm text-muted-foreground font-merriweather">
              Display your friends list on your public profile
            </p>
          </div>
          <Switch
            checked={showFriendList}
            onCheckedChange={setShowFriendList}
            className="data-[state=checked]:bg-accent-gold"
          />
        </div>

        {/* Allow Friend Requests */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-merriweather font-semibold">Allow Friend Requests</p>
            <p className="text-sm text-muted-foreground font-merriweather">
              Allow other players to send you friend requests
            </p>
          </div>
          <Switch
            checked={allowFriendRequests}
            onCheckedChange={setAllowFriendRequests}
            className="data-[state=checked]:bg-accent-gold"
          />
        </div>

        {/* Show Game Collection */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-merriweather font-semibold">Show Game Collection</p>
            <p className="text-sm text-muted-foreground font-merriweather">
              Display your game collection publicly on your profile
            </p>
          </div>
          <Switch
            checked={showGameCollection}
            onCheckedChange={setShowGameCollection}
            className="data-[state=checked]:bg-accent-gold"
          />
        </div>

        <Button className="bg-accent-gold hover:bg-accent-gold/90 text-background font-cinzel">
          Save Profile Changes
        </Button>
      </div>
    </div>
  )
}
