"use client"

import { useState, useEffect } from "react"
import { ArchiveButton, archiveField } from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, X, Check, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { updateProfile } from "@/app/actions/xp"
import { ThemeHero } from "@/components/theme-hero"

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
      <div className="p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
      </div>
    )
  }

  return (
    <ThemeHero page="profile" mode="backdrop">
      {/* Title block — matches every other page */}
      <div className="text-center mb-8">
        <h1 className="logo-text text-5xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{t("profile.title")}</h1>
        <p className="font-body text-foreground/90 text-xl max-w-3xl mx-auto mt-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          {t("profile.subtitle")}
        </p>
      </div>

      {/* Identity — avatar + bio, no card */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 max-w-4xl mx-auto">
        <Avatar className="w-32 h-32 border-4 border-accent-gold shadow-lg shrink-0">
          <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-accent-gold/20 to-accent-copper/20 text-4xl text-accent-gold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 w-full">
          {isEditing ? (
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-cinzel text-accent-gold">{t("profile.bio")}</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={cn("min-h-24", archiveField)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-cinzel text-accent-gold">{t("profile.profilePictureUrl")}</label>
                <Input
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  placeholder="https://..."
                  className={archiveField}
                />
              </div>
              <div className="flex gap-3">
                <ArchiveButton
                  onClick={handleSave}
                  active
                  disabled={saving}
                  icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                >
                  {t("common.save")}
                </ArchiveButton>
                <ArchiveButton onClick={() => setIsEditing(false)} icon={<X className="w-4 h-4" />}>
                  {t("common.cancel")}
                </ArchiveButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 text-center sm:text-left">
              <p className="text-lg font-merriweather text-foreground max-w-2xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                {bio}
              </p>
              <div className="shrink-0">
                <ArchiveButton onClick={() => setIsEditing(true)} icon={<Edit className="w-4 h-4" />}>
                  {t("profile.editProfile")}
                </ArchiveButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </ThemeHero>
  )
}
