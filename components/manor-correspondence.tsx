"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown, Mail, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface EventDigestPrefs {
  enabled: boolean
  frequency: string
  categories: string[]
  max_distance_km: number | null
}

const EVENT_CATEGORIES = ["board_game_night", "rpg_session", "tournament", "custom"]
const DISTANCE_OPTIONS = [
  { value: "25", label: "25 km" },
  { value: "50", label: "50 km" },
  { value: "100", label: "100 km" },
  { value: "null", label: "noLimit" },
]

export function ManorCorrespondence() {
  const [announcements, setAnnouncements] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [digestPrefs, setDigestPrefs] = useState<EventDigestPrefs>({
    enabled: false,
    frequency: "weekly",
    categories: [],
    max_distance_km: null,
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const t = useTranslations()
  const { user, profile } = useUser()
  const { toast } = useToast()

  // TODO: Replace with actual admin check from database
  const isAdmin = true

  // Load existing preferences
  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("email_notifications, event_digest_prefs")
        .eq("id", user.id)
        .single()

      if (!error && data) {
        setEmailNotifications(data.email_notifications ?? true)
        if (data.event_digest_prefs) {
          setDigestPrefs(data.event_digest_prefs as EventDigestPrefs)
        }
      }
      setLoading(false)
    }

    loadPreferences()
  }, [user])

  const handleCategoryToggle = (category: string) => {
    setDigestPrefs((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handleDistanceChange = (value: string) => {
    setDigestPrefs((prev) => ({
      ...prev,
      max_distance_km: value === "null" ? null : parseInt(value, 10),
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("profiles")
      .update({
        email_notifications: emailNotifications,
        event_digest_prefs: digestPrefs,
      })
      .eq("id", user.id)

    setSaving(false)

    if (error) {
      toast({
        title: t("common.error"),
        description: t("correspondence.saveFailed"),
        variant: "destructive",
      })
    } else {
      toast({
        title: t("common.success"),
        description: t("correspondence.saveSuccess"),
      })
    }
  }

  if (loading) {
    return (
      <div className="room-furniture p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent-gold" />
      </div>
    )
  }

  return (
    <div className="room-furniture p-8 space-y-6">
      <div className="flex items-center space-x-3">
        <Mail className="w-6 h-6 text-accent-gold" />
        <h2 className="text-2xl">{t("correspondence.title")}</h2>
      </div>

      <div className="space-y-6">
        {/* Admin Link - Only visible to admin */}
        {isAdmin && (
          <Link href="/admin/announcements">
            <div className="flex items-center justify-between p-4 rounded-lg border border-accent-gold/40 bg-accent-gold/5 hover:bg-accent-gold/10 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-accent-gold" />
                <span className="font-cinzel text-accent-gold">{t("correspondence.manorAdmin")}</span>
              </div>
            </div>
          </Link>
        )}

        {/* Manor Announcements Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-merriweather font-semibold">{t("correspondence.announcements")}</p>
            <p className="text-sm text-muted-foreground font-merriweather">
              {t("correspondence.announcementsDesc")}
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
            <p className="font-merriweather font-semibold">{t("correspondence.emailNotifications")}</p>
            <p className="text-sm text-muted-foreground font-merriweather">
              {t("correspondence.emailNotificationsDesc")}
            </p>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
            className="data-[state=checked]:bg-accent-gold"
          />
        </div>

        {/* Weekly Event Digest Section */}
        <div className="border-t border-border pt-6 space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-5 h-5 text-accent-gold" />
            <h3 className="font-cinzel text-lg text-accent-gold">{t("correspondence.eventDigest.title")}</h3>
          </div>

          {/* Digest Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-merriweather font-semibold">{t("correspondence.eventDigest.enable")}</p>
              <p className="text-sm text-muted-foreground font-merriweather">
                {t("correspondence.eventDigest.enableDesc")}
              </p>
            </div>
            <Switch
              checked={digestPrefs.enabled}
              onCheckedChange={(checked) => setDigestPrefs((prev) => ({ ...prev, enabled: checked }))}
              className="data-[state=checked]:bg-accent-gold"
            />
          </div>

          {/* Category Filter - only show if digest is enabled */}
          {digestPrefs.enabled && (
            <>
              <div className="space-y-3">
                <p className="font-merriweather font-semibold">{t("correspondence.eventDigest.categories")}</p>
                <p className="text-sm text-muted-foreground font-merriweather">
                  {t("correspondence.eventDigest.categoriesDesc")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {EVENT_CATEGORIES.map((category) => (
                    <label
                      key={category}
                      className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-accent/10"
                    >
                      <Checkbox
                        checked={digestPrefs.categories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                        className="border-accent-gold data-[state=checked]:bg-accent-gold data-[state=checked]:border-accent-gold"
                      />
                      <span className="font-merriweather text-sm">{t(`events.types.${category}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Distance Filter */}
              <div className="space-y-3">
                <p className="font-merriweather font-semibold">{t("correspondence.eventDigest.distance")}</p>
                <p className="text-sm text-muted-foreground font-merriweather">
                  {t("correspondence.eventDigest.distanceDesc")}
                </p>
                <Select
                  value={digestPrefs.max_distance_km?.toString() ?? "null"}
                  onValueChange={handleDistanceChange}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTANCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value === "null" ? t("correspondence.eventDigest.noLimit") : option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent-gold hover:bg-accent-gold/90 text-background font-cinzel"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            t("correspondence.savePreferences")
          )}
        </Button>
      </div>
    </div>
  )
}
