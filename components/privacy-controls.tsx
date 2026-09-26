"use client"

import { useEffect, useState } from "react"
import { ArchiveButton, ArchiveCard, ArchiveCardContent } from "@/components/archive-frame"
import { Switch } from "@/components/ui/switch"
import { Shield } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"

type PrivacyPreferences = {
  showEventActivity: boolean
  showFriendList: boolean
  allowFriendRequests: boolean
  showGameCollection: boolean
  showTrophyCabinet: boolean
}

const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  showEventActivity: true,
  showFriendList: true,
  allowFriendRequests: true,
  showGameCollection: true,
  showTrophyCabinet: false,
}

function readPrivacyPreferences(preferences: Record<string, unknown> | null | undefined): PrivacyPreferences {
  const privacy = preferences?.privacy
  if (!privacy || typeof privacy !== "object" || Array.isArray(privacy)) {
    return DEFAULT_PRIVACY_PREFERENCES
  }

  const values = privacy as Record<string, unknown>
  return {
    showEventActivity: typeof values.showEventActivity === "boolean" ? values.showEventActivity : true,
    showFriendList: typeof values.showFriendList === "boolean" ? values.showFriendList : true,
    allowFriendRequests: typeof values.allowFriendRequests === "boolean" ? values.allowFriendRequests : true,
    showGameCollection: typeof values.showGameCollection === "boolean" ? values.showGameCollection : true,
    showTrophyCabinet: values.showTrophyCabinet === true,
  }
}

export function PrivacyControls() {
  const { profile, loading: profileLoading, refetch } = useUser()
  const [showEventActivity, setShowEventActivity] = useState(true)
  const [showFriendList, setShowFriendList] = useState(true)
  const [allowFriendRequests, setAllowFriendRequests] = useState(true)
  const [showGameCollection, setShowGameCollection] = useState(true)
  const [showTrophyCabinet, setShowTrophyCabinet] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const t = useTranslations()

  useEffect(() => {
    if (!profile) return

    const privacy = readPrivacyPreferences(profile.preferences)
    setShowEventActivity(privacy.showEventActivity)
    setShowFriendList(privacy.showFriendList)
    setAllowFriendRequests(privacy.allowFriendRequests)
    setShowGameCollection(profile.show_collection ?? privacy.showGameCollection)
    setShowTrophyCabinet(privacy.showTrophyCabinet)
  }, [profile])

  const handleSave = async () => {
    if (!profile || saving) return

    setSaving(true)
    setStatus(null)

    try {
      const supabase = createClient()
      const currentPreferences = profile.preferences ?? {}
      const nextPreferences = {
        ...currentPreferences,
        privacy: {
          showEventActivity,
          showFriendList,
          allowFriendRequests,
          showGameCollection,
          showTrophyCabinet,
        },
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          preferences: nextPreferences,
          show_collection: showGameCollection,
        })
        .eq("id", profile.id)

      if (error) throw error

      await refetch()
      setStatus("Privacy settings saved.")
    } catch (error) {
      console.error("Error saving privacy settings:", error)
      setStatus("Could not save privacy settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ArchiveCard>
      <ArchiveCardContent className="p-8 space-y-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-accent-gold" />
          <div>
            <h2 className="text-2xl">{t("profile.privacy")}</h2>
            <p className="text-sm font-merriweather text-muted-foreground">
              {t("profile.privacyDesc")}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-merriweather font-semibold">{t("profile.showEventActivity")}</p>
              <p className="text-sm text-muted-foreground font-merriweather">
                {t("profile.showEventActivityDesc")}
              </p>
            </div>
            <Switch
              checked={showEventActivity}
              onCheckedChange={setShowEventActivity}
              className="data-[state=checked]:bg-accent-gold"
              disabled={profileLoading || saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-merriweather font-semibold">{t("profile.showFriendList")}</p>
              <p className="text-sm text-muted-foreground font-merriweather">
                {t("profile.showFriendListDesc")}
              </p>
            </div>
            <Switch
              checked={showFriendList}
              onCheckedChange={setShowFriendList}
              className="data-[state=checked]:bg-accent-gold"
              disabled={profileLoading || saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-merriweather font-semibold">{t("profile.allowFriendRequests")}</p>
              <p className="text-sm text-muted-foreground font-merriweather">
                {t("profile.allowFriendRequestsDesc")}
              </p>
            </div>
            <Switch
              checked={allowFriendRequests}
              onCheckedChange={setAllowFriendRequests}
              className="data-[state=checked]:bg-accent-gold"
              disabled={profileLoading || saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-merriweather font-semibold">{t("profile.showGameCollection")}</p>
              <p className="text-sm text-muted-foreground font-merriweather">
                {t("profile.showGameCollectionDesc")}
              </p>
            </div>
            <Switch
              checked={showGameCollection}
              onCheckedChange={setShowGameCollection}
              className="data-[state=checked]:bg-accent-gold"
              disabled={profileLoading || saving}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-merriweather font-semibold">{t("profile.showTrophyCabinet")}</p>
              <p className="text-sm text-muted-foreground font-merriweather">{t("profile.showTrophyCabinetDesc")}</p>
            </div>
            <Switch checked={showTrophyCabinet} onCheckedChange={setShowTrophyCabinet}
              className="data-[state=checked]:bg-accent-gold" disabled={profileLoading || saving}
              aria-label={t("profile.showTrophyCabinet")} />
          </div>

          <ArchiveButton active disabled={profileLoading || saving || !profile} onClick={handleSave}>
            {saving ? "Saving…" : t("profile.saveProfileChanges")}
          </ArchiveButton>
          {status && (
            <p role="status" className="text-sm text-muted-foreground font-merriweather">
              {status}
            </p>
          )}
        </div>
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
