"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Mail, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"

interface EmailNotificationPrefs {
  friend_request: boolean
  badge_earned: boolean
  event_rsvp: boolean
  new_message: boolean
  admin_broadcast: boolean
}

const defaultPrefs: EmailNotificationPrefs = {
  friend_request: false,
  badge_earned: false,
  event_rsvp: false,
  new_message: false,
  admin_broadcast: true,
}

export function ProfileNotifications() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [emailPrefs, setEmailPrefs] = useState<EmailNotificationPrefs>(defaultPrefs)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useUser()
  const t = useTranslations()

  useEffect(() => {
    async function fetchPrefs() {
      if (!user) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("email_notification_types")
        .eq("id", user.id)
        .single()

      if (data?.email_notification_types) {
        setEmailPrefs(data.email_notification_types as EmailNotificationPrefs)
      }
      setLoading(false)
    }

    fetchPrefs()
  }, [user])

  async function handleToggle(key: keyof EmailNotificationPrefs) {
    if (!user) return

    const newPrefs = { ...emailPrefs, [key]: !emailPrefs[key] }
    setEmailPrefs(newPrefs)
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from("profiles")
      .update({ email_notification_types: newPrefs })
      .eq("id", user.id)

    setSaving(false)
  }

  const notificationTypes = [
    { key: "friend_request" as const, label: t("profile.emailFriendRequests") },
    { key: "badge_earned" as const, label: t("profile.emailBadges") },
    { key: "event_rsvp" as const, label: t("profile.emailEvents") },
    { key: "new_message" as const, label: t("profile.emailMessages") },
    { key: "admin_broadcast" as const, label: t("profile.emailAnnouncements") },
  ]

  return (
    <div className="room-furniture p-6">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-accent-gold" />
          <h2 className="text-2xl text-accent-gold">{t("profile.emailNotifications")}</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-accent-gold" />
        ) : (
          <ChevronDown className="w-5 h-5 text-accent-gold" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-accent-gold/20">
          {!user ? (
            <p className="text-center text-muted-foreground font-merriweather py-8">
              {t("profile.loginToManageNotifications")}
            </p>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent-gold" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-merriweather mb-4">
                {t("profile.emailNotificationsDescription")}
              </p>
              
              {notificationTypes.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="font-merriweather text-foreground">{label}</span>
                  <button
                    onClick={() => handleToggle(key)}
                    disabled={saving}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      emailPrefs[key] ? "bg-accent-gold" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        emailPrefs[key] ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}

              {saving && (
                <p className="text-xs text-muted-foreground text-center">
                  {t("common.saving")}...
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
