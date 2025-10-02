"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, X, Check } from "lucide-react"

export function ProfileHeader() {
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState("Into all kind of board games and very interested in Warhammer 40 000")
  const [profilePictureUrl, setProfilePictureUrl] = useState("")

  const handleSave = () => {
    // TODO: Save to Firebase
    setIsEditing(false)
  }

  return (
    <div className="room-furniture relative overflow-hidden">
      {/* Cover Photo Area */}
      <div className="h-48 relative bg-gradient-to-br from-accent-gold/20 to-accent-copper/20 manor-texture">
        <div className="absolute top-4 left-4 text-accent-gold text-lg opacity-60">♠</div>
        <div className="absolute top-4 right-4 text-accent-gold text-lg opacity-60">♦</div>
      </div>

      {/* Profile Content */}
      <div className="relative px-8 pb-8">
        {/* Avatar */}
        <div className="absolute -top-16 left-8">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-accent-gold shadow-lg">
              <AvatarImage src={profilePictureUrl || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-accent-gold/20 to-accent-copper/20 text-4xl text-accent-gold">
                J
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 space-y-6">
          {isEditing ? (
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-cinzel text-accent-gold">Bio</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-24 bg-background/40 border-accent-gold/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-cinzel text-accent-gold">Profile Picture URL</label>
                <Input
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-background/40 border-accent-gold/20"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} className="bg-accent-gold hover:bg-accent-gold/90 text-background">
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="border-accent-gold/40 text-accent-gold"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-lg font-merriweather text-foreground max-w-2xl">{bio}</p>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
