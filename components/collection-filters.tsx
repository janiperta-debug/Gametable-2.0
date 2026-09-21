"use client"

import { ArchiveCard, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle } from "@/components/archive-frame"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "@/lib/i18n"
import type { CollectionCardItem } from "@/lib/types/collection"
import type { CollectionCategoryFilter, CollectionSpecificFilters } from "@/lib/collection/filters"
import {
  getMiniatureArmyOptions,
  getMiniatureGameOptions,
  getMiniaturePaintStatusOptions,
  getRPGSystemOptions,
  getTCGGameOptions,
} from "@/lib/collection/filters"

interface CollectionFiltersProps {
  category: CollectionCategoryFilter
  cards: readonly CollectionCardItem[]
  filters: CollectionSpecificFilters
  onFiltersChange: (filters: CollectionSpecificFilters) => void
}

export function CollectionFilters({ category, cards, filters, onFiltersChange }: CollectionFiltersProps) {
  const t = useTranslations()

  if (category === "all") {
    return null
  }

  if (category === "trading-cards") {
    const games = getTCGGameOptions(cards)

    return (
      <div className="space-y-6">
        <ArchiveCard>
          <ArchiveCardHeader><ArchiveCardTitle>Korttipeli</ArchiveCardTitle></ArchiveCardHeader>
          <ArchiveCardContent>
            <Select
              value={filters.tcgGame || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, tcgGame: value === "all" ? "" : value })}
            >
              <SelectTrigger><SelectValue placeholder="Kaikki korttipelit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kaikki korttipelit</SelectItem>
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    )
  }

  if (category === "miniatures") {
    const gameOptions = getMiniatureGameOptions(cards)
    const armyOptions = getMiniatureArmyOptions(cards, filters.miniatureGame)
    const paintOptions = getMiniaturePaintStatusOptions(cards)

    return (
      <div className="space-y-6">
        <ArchiveCard>
          <ArchiveCardHeader><ArchiveCardTitle>Peli</ArchiveCardTitle></ArchiveCardHeader>
          <ArchiveCardContent>
            <Select
              value={filters.miniatureGame || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, miniatureGame: value === "all" ? "" : value, miniatureArmy: "" })}
            >
              <SelectTrigger><SelectValue placeholder="Kaikki pelit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kaikki pelit</SelectItem>
                {gameOptions.map((game) => <SelectItem key={game} value={game}>{game}</SelectItem>)}
              </SelectContent>
            </Select>
          </ArchiveCardContent>
        </ArchiveCard>

        <ArchiveCard>
          <ArchiveCardHeader><ArchiveCardTitle>Armeija</ArchiveCardTitle></ArchiveCardHeader>
          <ArchiveCardContent>
            <Select
              value={filters.miniatureArmy || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, miniatureArmy: value === "all" ? "" : value })}
              disabled={armyOptions.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="Kaikki armeijat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kaikki armeijat</SelectItem>
                {armyOptions.map((army) => <SelectItem key={army} value={army}>{army}</SelectItem>)}
              </SelectContent>
            </Select>
          </ArchiveCardContent>
        </ArchiveCard>

        <ArchiveCard>
          <ArchiveCardHeader><ArchiveCardTitle>Maalaus</ArchiveCardTitle></ArchiveCardHeader>
          <ArchiveCardContent>
            <Select
              value={filters.miniaturePaintStatus || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, miniaturePaintStatus: value === "all" ? "" : value })}
              disabled={paintOptions.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="Kaikki" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kaikki</SelectItem>
                {paintOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    )
  }

  if (category === "rpgs") {
    const systems = getRPGSystemOptions(cards)

    return (
      <div className="space-y-6">
        <ArchiveCard>
          <ArchiveCardHeader><ArchiveCardTitle>Järjestelmä</ArchiveCardTitle></ArchiveCardHeader>
          <ArchiveCardContent>
            <Select
              value={filters.rpgSystem || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, rpgSystem: value === "all" ? "" : value })}
            >
              <SelectTrigger><SelectValue placeholder="Kaikki järjestelmät" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kaikki järjestelmät</SelectItem>
                {systems.map((system) => <SelectItem key={system} value={system}>{system}</SelectItem>)}
              </SelectContent>
            </Select>
          </ArchiveCardContent>
        </ArchiveCard>

        <ArchiveCard>
          <ArchiveCardHeader><ArchiveCardTitle>{t("collection.filters.playerCount")}</ArchiveCardTitle></ArchiveCardHeader>
          <ArchiveCardContent>
            <Label className="text-sm font-body">
              {t("collection.filters.upToPlayers").replace("{count}", filters.maxPlayers.toString())}{filters.maxPlayers === 8 ? "+" : ""}
            </Label>
            <Slider value={[filters.maxPlayers]} onValueChange={(value) => onFiltersChange({ ...filters, maxPlayers: value[0] })} max={8} min={1} step={1} className="mt-2" />
          </ArchiveCardContent>
        </ArchiveCard>

        <ArchiveCard>
          <ArchiveCardHeader><ArchiveCardTitle>{t("collection.filters.playTime")}</ArchiveCardTitle></ArchiveCardHeader>
          <ArchiveCardContent>
            <Label className="text-sm font-body">{t("collection.filters.upToMinutes").replace("{count}", filters.maxPlayTime.toString())}</Label>
            <Slider value={[filters.maxPlayTime]} onValueChange={(value) => onFiltersChange({ ...filters, maxPlayTime: value[0] })} max={240} min={15} step={15} className="mt-2" />
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    )
  }

  // Board games retain the existing player count and play time filters.
  return (
    <div className="space-y-6">
      <ArchiveCard>
        <ArchiveCardHeader><ArchiveCardTitle>{t("collection.filters.playerCount")}</ArchiveCardTitle></ArchiveCardHeader>
        <ArchiveCardContent>
          <Label className="text-sm font-body">
            {t("collection.filters.upToPlayers").replace("{count}", filters.maxPlayers.toString())}{filters.maxPlayers === 8 ? "+" : ""}
          </Label>
          <Slider value={[filters.maxPlayers]} onValueChange={(value) => onFiltersChange({ ...filters, maxPlayers: value[0] })} max={8} min={1} step={1} className="mt-2" />
        </ArchiveCardContent>
      </ArchiveCard>

      <ArchiveCard>
        <ArchiveCardHeader><ArchiveCardTitle>{t("collection.filters.playTime")}</ArchiveCardTitle></ArchiveCardHeader>
        <ArchiveCardContent>
          <Label className="text-sm font-body">{t("collection.filters.upToMinutes").replace("{count}", filters.maxPlayTime.toString())}</Label>
          <Slider value={[filters.maxPlayTime]} onValueChange={(value) => onFiltersChange({ ...filters, maxPlayTime: value[0] })} max={240} min={15} step={15} className="mt-2" />
        </ArchiveCardContent>
      </ArchiveCard>
    </div>
  )
}
