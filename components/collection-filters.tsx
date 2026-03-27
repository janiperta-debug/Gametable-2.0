"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useTranslations } from "@/lib/i18n"

export function CollectionFilters() {
  const t = useTranslations()
  
  // Sliders start at max value (right side) and filter DOWN
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [maxPlayTime, setMaxPlayTime] = useState(240)
  
  const mechanics = [
    { id: "worker-placement", labelKey: "collection.filters.workerPlacement", count: 23 },
    { id: "deck-building", labelKey: "collection.filters.deckBuilding", count: 18 },
    { id: "area-control", labelKey: "collection.filters.areaControl", count: 15 },
    { id: "cooperative", labelKey: "collection.filters.cooperative", count: 12 },
    { id: "engine-building", labelKey: "collection.filters.engineBuilding", count: 19 },
  ]

  return (
    <div className="space-y-6">
      <Card className="room-furniture">
        <CardHeader>
          <CardTitle className="ornate-text font-heading text-lg font-bold">
            {t("collection.filters.playerCount")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-body">
              {t("collection.filters.upToPlayers").replace("{count}", maxPlayers.toString())}
              {maxPlayers === 8 ? "+" : ""}
            </Label>
            <Slider 
              value={[maxPlayers]} 
              onValueChange={(value) => setMaxPlayers(value[0])}
              max={8} 
              min={1} 
              step={1} 
              className="mt-2" 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="room-furniture">
        <CardHeader>
          <CardTitle className="ornate-text font-heading text-lg font-bold">
            {t("collection.filters.playTime")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-body">
              {t("collection.filters.upToMinutes").replace("{count}", maxPlayTime.toString())}
            </Label>
            <Slider 
              value={[maxPlayTime]} 
              onValueChange={(value) => setMaxPlayTime(value[0])}
              max={240} 
              min={15} 
              step={15} 
              className="mt-2" 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="room-furniture">
        <CardHeader>
          <CardTitle className="ornate-text font-heading text-lg font-bold">
            {t("collection.filters.mechanics")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mechanics.map((mechanic) => (
            <div key={mechanic.id} className="flex items-center space-x-2">
              <Checkbox id={mechanic.id} />
              <Label htmlFor={mechanic.id} className="flex-1 text-sm font-body">
                {t(mechanic.labelKey)}
              </Label>
              <span className="text-xs text-muted-foreground font-body">({mechanic.count})</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
