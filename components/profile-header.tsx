"use client"

import { useState, useEffect, useRef } from "react"
import { ArchiveButton, archiveField } from "@/components/archive-frame"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, X, Check, Loader2, Upload, ImageIcon } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { updateProfile } from "@/app/actions/xp"
import { ThemeHero } from "@/components/theme-hero"
import { createClient } from "@/lib/supabase/client"

export function ProfileHeader() {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const { profile, loading, refetch } = useUser()
  const [bio, setBio] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations()
  const supabase = createClient()

  // Sync local state with profile data
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "")
      setProfilePictureUrl(profile.avatar_url || "")
      setAvatarFile(null)
      setAvatarPreview(null)
      setUploadError(null)
    }
  }, [profile])

  useEffect(() => {
    if (!avatarFile) return
    const previewUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [avatarFile])

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.")
      event.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5 MB.")
      event.target.value = ""
      return
    }

    setAvatarFile(file)
  }

  const prepareAvatar = async (file: File) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error("Could not read image"))
        image.src = objectUrl
      })

      const maxSize = 512
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

      const context = canvas.getContext("2d")
      if (!context) throw new Error("Could not prepare image")

      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
          "image/webp",
          0.85,
        )
      })
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setUploadError(null)
    let uploadedPath: string | null = null

    try {
      let avatarUrl = profilePictureUrl

      if (avatarFile) {
        const blob = await prepareAvatar(avatarFile)
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error("You must be signed in to upload an avatar.")

        uploadedPath = `${user.id}/${crypto.randomUUID()}.webp`
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(uploadedPath, blob, { contentType: "image/webp", upsert: false })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("avatars").getPublicUrl(uploadedPath)
        avatarUrl = data.publicUrl
      }

      const result = await updateProfile({ bio, avatar_url: avatarUrl })
      if (!result.success) throw new Error(result.error || "Failed to save profile")

      if (uploadedPath && profile?.avatar_url?.includes("/storage/v1/object/public/avatars/")) {
        const oldPath = profile.avatar_url.split("/storage/v1/object/public/avatars/")[1]
        if (oldPath) await supabase.storage.from("avatars").remove([oldPath])
      }

      await refetch()
      setAvatarFile(null)
      setAvatarPreview(null)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to save profile:", error)
      if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath])
      setUploadError(error instanceof Error ? error.message : "Failed to save profile")
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
              <div className="space-y-3">
                <label className="text-sm font-cinzel text-accent-gold">{t("profile.profilePictureUrl")}</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-accent-gold/70 bg-accent-gold/10 shrink-0 flex items-center justify-center">
                    {avatarPreview || profile?.avatar_url ? (
                      <img src={avatarPreview || profile?.avatar_url || ""} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-accent-gold/70" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <ArchiveButton
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      icon={<Upload className="w-4 h-4" />}
                    >
                      {t("common.add")}
                    </ArchiveButton>
                    <span className="text-xs text-muted-foreground">JPG, PNG or WebP · max 5 MB</span>
                  </div>
                </div>
                <Input
                  value={profilePictureUrl}
                  onChange={(e) => { setProfilePictureUrl(e.target.value); setAvatarFile(null); setAvatarPreview(null) }}
                  placeholder="https://..."
                  className={archiveField}
                />
                {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}
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
