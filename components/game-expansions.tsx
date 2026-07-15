"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Check, Loader2, Puzzle } from "lucide-react"
import { getGameExpansions, toggleGameExpansionOwnership } from "@/app/actions/games"
import { useTranslations } from "@/lib/i18n"

interface Expansion {
  id: string
  name: string
  year: number | null
  image_url: string | null
  owned: boolean
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
    // Optimistic update
    setExpansions((prev) =>
      prev.map((e) => (e.id === expansion.id ? { ...e, owned: nextOwned } : e)),
    )
    const result = await toggleGameExpansionOwnership(expansion.id, nextOwned, gameId)
    if (result.error) {
      // Revert on failure
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

  // Nothing to show if the catalog has no expansions for this game.
  if (expansions.length === 0) {
    return null
  }

  const ownedCount = expansions.filter((e) => e.owned).length

  return (
    <div className="pt-4 border-t border-border/50">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-cinzel text-lg font-semibold flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-accent-gold" />
          {t("game.expansions")}
        </h3>
        <span className="text-sm text-accent-gold">
          {t("game.expansionsOwned", { owned: ownedCount, total: expansions.length })}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {expansions.map((expansion) => {
          const isToggling = togglingId === expansion.id
          return (
            <li key={expansion.id}>
              <button
                type="button"
                onClick={() => handleToggle(expansion)}
                disabled={isToggling}
                aria-pressed={expansion.owned}
                className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors min-h-[44px] ${
                  expansion.owned
                    ? "border-accent-gold bg-accent-gold/10"
                    : "border-border bg-transparent hover:border-accent-gold/50"
                }`}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-surface/50">
                  <Image
                    src={expansion.image_url || "/placeholder.svg"}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm text-foreground">{expansion.name}</p>
                  {expansion.year ? (
                    <p className="text-xs text-muted-foreground">{expansion.year}</p>
                  ) : null}
                </div>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
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
        })}
      </ul>
    </div>
  )
}
