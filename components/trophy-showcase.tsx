"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, Users } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

const trophies = [
  {
    id: 1,
    titleKey: "trophies.collectionCurator",
    descKey: "trophies.collectionCuratorDesc",
    icon: Trophy,
    rarityKey: "trophies.gold",
    earnedKey: "trophies.twoDaysAgo",
    color: "text-amber-500",
  },
  {
    id: 2,
    titleKey: "trophies.socialButterfly",
    descKey: "trophies.socialButterflyDesc",
    icon: Users,
    rarityKey: "trophies.silver",
    earnedKey: "trophies.oneWeekAgo",
    color: "text-gray-400",
  },
  {
    id: 3,
    titleKey: "trophies.eventMaster",
    descKey: "trophies.eventMasterDesc",
    icon: Target,
    rarityKey: "trophies.bronze",
    earnedKey: "trophies.twoWeeksAgo",
    color: "text-amber-600",
  },
]

export function TrophyShowcase() {
  const t = useTranslations()
  
  return (
    <Card className="room-furniture">
      <CardHeader>
        <CardTitle className="text-xl">{t("trophies.showcase")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trophies.map((trophy) => (
            <div key={trophy.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card/50">
              <trophy.icon className={`h-8 w-8 ${trophy.color}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm">{t(trophy.titleKey)}</h4>
                  <Badge variant="outline" className="text-xs">
                    {t(trophy.rarityKey)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t(trophy.descKey)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("trophies.earned")} {t(trophy.earnedKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
