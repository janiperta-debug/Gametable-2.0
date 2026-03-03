"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Shield } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

export function PrivacyControls() {
  const [showEventActivity, setShowEventActivity] = useState(true)
  const [showFriendList, setShowFriendList] = useState(true)
  const [allowFriendRequests, setAllowFriendRequests] = useState(true)
  const [showGameCollection, setShowGameCollection] = useState(true)
  const t = useTranslations()

  return (
    <div className="room-furniture p-8 space-y-6">
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
        {/* Show Event Activity */}
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
          />
        </div>

        {/* Show Friend List */}
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
          />
        </div>

        {/* Allow Friend Requests */}
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
          />
        </div>

        {/* Show Game Collection */}
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
          />
        </div>

        <Button className="bg-accent-gold hover:bg-accent-gold/90 text-background font-cinzel">
          {t("profile.saveProfileChanges")}
        </Button>
      </div>
    </div>
  )
}
