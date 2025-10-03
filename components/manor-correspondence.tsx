"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Crown, Mail } from "lucide-react"
import Link from "next/link"

export function ManorCorrespondence() {
  const [announcements, setAnnouncements] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)

  // TODO: Replace with actual user check from Firebase
  const isAdmin = true // This should check if current user is admin

  return (
    <div className="room-furniture p-8 space-y-6">
      <div className="flex items-center space-x-3">
        <Mail className="w-6 h-6 text-accent-gold" />
        <h2 className="text-2xl">Manor Correspondence</h2>
      </div>

      <div className="space-y-6">
        {/* Admin Link - Only visible to admin */}
        {isAdmin && (
          <Link href="/admin/announcements">
            <div className="flex items-center justify-between p-4 rounded-lg border border-accent-gold/40 bg-accent-gold/5 hover:bg-accent-gold/10 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-accent-gold" />
                <span className="font-cinzel text-accent-gold">Manor Administration</span>
              </div>
            </div>
          </Link>
        )}

        {/* Manor Announcements Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-merriweather font-semibold">Manor Announcements</p>
            <p className="text-sm text-muted-foreground font-merriweather">
              The manor staff may occasionally send important updates about new features, events, or significant
              announcements. All correspondence maintains the manor's elegant and respectful tone.
            </p>
          </div>
          <Switch
            checked={announcements}
            onCheckedChange={setAnnouncements}
            className="data-[state=checked]:bg-accent-gold"
          />
        </div>

        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-merriweather font-semibold">Email Notifications</p>
            <p className="text-sm text-muted-foreground font-merriweather">
              Forward in-app notifications (messages, session suggestions, event invitations) to your email address with
              elegant manor-themed formatting.
            </p>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
            className="data-[state=checked]:bg-accent-gold"
          />
        </div>

        <Button className="bg-accent-gold hover:bg-accent-gold/90 text-background font-cinzel">
          Save Correspondence Preferences
        </Button>
      </div>
    </div>
  )
}
