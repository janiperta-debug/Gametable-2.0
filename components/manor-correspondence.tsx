"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Crown, Mail } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n"

export function ManorCorrespondence() {
  const [announcements, setAnnouncements] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const t = useTranslations()

  // TODO: Replace with actual user check from database
  const isAdmin = true // This should check if current user is admin

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

        <Button className="bg-accent-gold hover:bg-accent-gold/90 text-background font-cinzel">
          {t("correspondence.savePreferences")}
        </Button>
      </div>
    </div>
  )
}
