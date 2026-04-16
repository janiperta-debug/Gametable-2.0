"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/useUser"

const INTEREST_KEYS = ["boardGames", "tradingCards", "miniatures", "rpg"] as const
type InterestKey = typeof INTEREST_KEYS[number]

const INTEREST_LABELS: Record<InterestKey, string> = {
  boardGames: "profile.boardAndCardGames",
  tradingCards: "profile.tradingCards",
  miniatures: "profile.otherMiniatureGames",
  rpg: "profile.roleplayingGames",
}

export function GameInterests() {
  const [interests, setInterests] = useState<Record<InterestKey, boolean>>({
    boardGames: false,
    tradingCards: false,
    miniatures: false,
    rpg: false,
  })
  const [loading, setLoading] = useState(true)
  const t = useTranslations()
  const { user } = useUser()
  const supabase = createClient()

  // Load interests from database
  useEffect(() => {
    async function loadInterests() {
      if (!user) return
      
      const { data } = await supabase
        .from("profiles")
        .select("game_interests")
        .eq("id", user.id)
        .single()
      
      if (data?.game_interests) {
        const loaded: Record<InterestKey, boolean> = {
          boardGames: false,
          tradingCards: false,
          miniatures: false,
          rpg: false,
        }
        for (const key of data.game_interests) {
          if (INTEREST_KEYS.includes(key as InterestKey)) {
            loaded[key as InterestKey] = true
          }
        }
        setInterests(loaded)
      }
      setLoading(false)
    }
    loadInterests()
  }, [user, supabase])

  const handleToggle = async (key: InterestKey) => {
    if (!user) return
    
    const newInterests = { ...interests, [key]: !interests[key] }
    setInterests(newInterests)
    
    // Convert to array of selected keys
    const selectedInterests = INTEREST_KEYS.filter(k => newInterests[k])
    
    await supabase
      .from("profiles")
      .update({ game_interests: selectedInterests })
      .eq("id", user.id)
  }

  if (loading) {
    return (
      <div className="room-furniture p-8 space-y-6">
        <div>
          <h2 className="text-2xl mb-2">{t("profile.gameInterests")}</h2>
          <p className="text-sm font-merriweather text-muted-foreground">
            {t("profile.gameInterestsDesc")}
          </p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-6 bg-muted rounded w-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="room-furniture p-8 space-y-6">
      <div>
        <h2 className="text-2xl mb-2">{t("profile.gameInterests")}</h2>
        <p className="text-sm font-merriweather text-muted-foreground">
          {t("profile.gameInterestsDesc")}
        </p>
      </div>

      <div className="space-y-4">
        {INTEREST_KEYS.map((key) => (
          <div key={key} className="flex items-center space-x-3">
            <Checkbox
              id={key}
              checked={interests[key]}
              onCheckedChange={() => handleToggle(key)}
              className="border-accent-gold data-[state=checked]:bg-accent-gold data-[state=checked]:border-accent-gold"
            />
            <label htmlFor={key} className="text-base font-merriweather cursor-pointer">
              {t(INTEREST_LABELS[key])}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
