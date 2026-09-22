"use client"

import { useState, useEffect } from "react"
import { Check, Loader2, Puzzle } from "lucide-react"
import { getGameExpansions, toggleGameExpansionOwnership } from "@/app/actions/games"
import { repairExpansionImages } from "@/app/actions/expansion-images"
import { useTranslations } from "@/lib/i18n"

interface Expansion {
  id: string
  name: string
  year: number | null
  image_url: string | null
  owned: boolean
}

const EXPANSION_FALLBACK_IMAGE = "/images/fallbacks/board-games-fallback.png"

function ExpansionRow({
  expansion,
  isToggling,
  onToggle,
}: {
  expansion: Expansion
  isToggling: boolean
  onToggle: () => void
}) {
  const [imageSrc, setImageSrc] = useState(expansion.image_url || EXPANSION_FALLBACK_IMAGE)

  useEffect(() => {
    setImageSrc(expansion.image_url || EXPANSION_FALLBACK_IMAGE)
  }, [expansion.image_url])

  return (
    <li className="w-full min-w-0 max-w-full overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        disabled={isToggling}
        aria-pressed={expansion.owned}
        className={`grid w-full min-w-0 max-w-full grid-cols-[3rem_minmax(0,1fr)_1.5rem] items-center gap-3 overflow-hidden rounded-lg border p-2 text-left transition-colors min-h-[44px] ${
          expansion.owned
            ? "border-accent-gold bg-accent-gold/10"
            : "border-border bg-transparent hover:border-accent-gold/50"
        }`}
      >
        <div className="relative h-12 w-12 min-w-0 shrink-0 overflow-hidden rounded bg-surface/50">
          <img
            src={imageSrc}
            alt=""
            className="block h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => {
              if (imageSrc !== EXPANSION_FALLBACK_IMAGE) {
                setImageSrc(EXPANSION_FALLBACK_IMAGE)
              }
            }}
          />
        </div>
        <div className="min-w-0 w-full overflow-hidden">
          <p className="m-0 w-full min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] font-body text-sm leading-snug text-foreground">
            {expansion.name}
          </p>
          {expansion.year ? (
            <p className="text-xs text-muted-foreground">{expansion.year}</p>
          ) : null}
        </div>
        <span
          className={`flex h-6 w-6 min-w-0 shrink-0 items-center justify-center rounded-full border ${
            expansion.owned
              ? "border-accent-gold bg-accent-gold text-background"
              : "border-muted-foreground/40 text-transparent"
          }`}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin text-accent-gold" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </span>
      </button>
    </li>
  )
}

export function GameExpansions({ gameId }: { gameId: string }) {
  const t = useTranslations()
  const [expansions, setExpansions] = useState<Expansion[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)

      // Older catalog rows may have been created before BGG image enrichment
      // was batched correctly. Repair those rows once, then load the catalog.
      await repairExpansionImages(gameId)
      const result = await getGameExpansions(gameId)

      if (active) {
        setExpansions((result.expansions as Expansion[]) || [])
        setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [gameId])

  const handleToggle = async (expansion: Expansion) => {
    const nextOwned = !expansion.owned
    setTogglingId(expansion.id)
    setExpansions((prev) =>
      prev.map((e) => (e.id === expansion.id ? { ...e, owned: nextOwned } : e)),
    )
    const result = await toggleGameExpansionOwnership(expansion.id, nextOwned, gameId)
    if (result.error) {
      setExpansions((prev) =>
        prev.map((e) => (e.id === expansion.id ? { ...e, owned: !nextOwned } : e)),
      )
    }
    setTogglingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-accent-gold" />
      </div>
    )
  }

  if (expansions.length === 0) {
    return null
  }

  const ownedCount = expansions.filter((e) => e.owned).length

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden border-t border-border/50 pt-4">
      <div className="mb-3 flex min-w-0 max-w-full items-center justify-between gap-2 overflow-hidden">
        <h3 className="min-w-0 font-cinzel text-lg font-semibold flex items-center gap-2">
          <Puzzle className="h-5 w-5 shrink-0 text-accent-gold" />
          <span className="min-w-0 break-words">{t("game.expansions")}</span>
        </h3>
        <span className="shrink-0 text-sm text-accent-gold">
          {t("game.expansionsOwned", { owned: ownedCount, total: expansions.length })}
        </span>
      </div>

      <ul className="m-0 flex w-full min-w-0 max-w-full flex-col gap-2 overflow-hidden p-0">
        {expansions.map((expansion) => (
          <ExpansionRow
            key={expansion.id}
            expansion={expansion}
            isToggling={togglingId === expansion.id}
            onToggle={() => handleToggle(expansion)}
          />
        ))}
      </ul>
    </div>
  )
}
