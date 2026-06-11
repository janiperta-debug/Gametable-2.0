"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, X, Check, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { updateProfile } from "@/app/actions/xp"
import { getRoomTheme } from "@/lib/room-themes"

export function ProfileHeader() {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const { profile, loading, refetch } = useUser()
  const [bio, setBio] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState("")
  const t = useTranslations()

  // Sync local state with profile data
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "")
      setProfilePictureUrl(profile.avatar_url || "")
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ bio, avatar_url: profilePictureUrl })
      await refetch()
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setSaving(false)
    }
  }

  // Get initials for avatar fallback
  const initials = profile?.display_name 
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  if (loading) {
    return (
      <div className="room-furniture p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  // Get theme preview image
  const userTheme = profile?.preferred_theme ? getRoomTheme(profile.preferred_theme) : null
  const themeImageUrl = userTheme?.image

  return (
    <div className="room-furniture relative overflow-hidden">
      {/* Cover Photo Area - displays user's selected theme preview */}
      <div className="h-48 relative">
        {themeImageUrl ? (
          <img 
            src={themeImageUrl} 
            alt={userTheme?.name || "Theme preview"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-gold/20 to-accent-copper/20 manor-texture" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        <div className="absolute top-4 left-4 text-accent-gold text-lg opacity-60">♠</div>
        <div className="absolute top-4 right-4 text-accent-gold text-lg opacity-60">♦</div>
      </div>

      {/* Profile Content */}
      <div className="relative px-8 pb-8">
        {/* Avatar */}
        <div className="absolute -top-16 left-8">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-accent-gold shadow-lg">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-accent-gold/20 to-accent-copper/20 text-4xl text-accent-gold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 space-y-6">
          {isEditing ? (
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-cinzel text-accent-gold">{t("profile.bio")}</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-24 bg-background/40 border-accent-gold/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-cinzel text-accent-gold">{t("profile.profilePictureUrl")}</label>
                <Input
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-background/40 border-accent-gold/20"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-accent-gold hover:bg-accent-gold/90 text-background"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {t("common.save")}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="border-accent-gold/40 text-accent-gold"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("common.cancel")}
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
                  {t("profile.editProfile")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
