"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { getCampaignWorldEntities } from "@/app/actions/campaign-world"

type WorldEntity = {
  id: string
  entity_type: string
  name: string
  summary: string
  details: Record<string, unknown>
  visibility: "gm_only" | "players"
  status: string
}

const TYPE_LABELS: Record<string, string> = {
  character: "Hahmot",
  person: "Henkilöt",
  location: "Paikat",
  faction: "Ryhmittymät",
  quest: "Tehtävät",
  item: "Esineet",
  creature: "Olennot",
  history: "Historia",
  rule: "Säännöt",
  other: "Muut tiedot",
}

export function CampaignWorldPanel({ eventId }: { eventId: string }) {
  const [entities, setEntities] = useState<WorldEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    getCampaignWorldEntities(eventId).then((result) => {
      if (!active) return
      if (result.success) setEntities(result.entities as WorldEntity[])
      else setError(result.error)
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Kampanjan tietojen lataaminen epäonnistui.")
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [eventId])

  const groups = useMemo(() => {
    const map = new Map<string, WorldEntity[]>()
    for (const entity of entities) {
      const current = map.get(entity.entity_type) ?? []
      current.push(entity)
      map.set(entity.entity_type, current)
    }
    return [...map.entries()]
  }, [entities])

  return (
    <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Kampanjan henkilöt, paikat, tehtävät ja muu pelimaailman tieto yhdessä paikassa.
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Ladataan kampanjan tietoja…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : entities.length === 0 ? (
          <div className="rounded-md border border-accent-gold/20 bg-background/30 p-4 text-sm text-muted-foreground">
            Tietopankki on vielä tyhjä. Kun pelinjohtaja hyväksyy aineistotuonnin ehdotuksia, ne ilmestyvät tänne.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-accent-gold/30 text-accent-gold">{entities.length} kohdetta</Badge>
              <Badge variant="outline">Pelinjohtajan tuomat tiedot ovat oletuksena yksityisiä</Badge>
            </div>
            {groups.map(([type, group]) => (
              <details key={type} className="rounded-md border border-accent-gold/20 bg-background/30 p-3" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                  <span className="font-medium">{TYPE_LABELS[type] ?? type}</span>
                  <Badge variant="outline">{group.length}</Badge>
                </summary>
                <div className="mt-3 space-y-2">
                  {group.map((entity) => (
                    <details key={entity.id} className="rounded border border-accent-gold/10 bg-background/40 p-3">
                      <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                        <span className="min-w-0 flex-1 text-sm font-medium">{entity.name}</span>
                        {entity.visibility === "gm_only" && <Badge variant="outline">Vain pelinjohtajalle</Badge>}
                      </summary>
                      <div className="mt-2 space-y-2 text-sm">
                        {entity.summary && <p className="whitespace-pre-wrap">{entity.summary}</p>}
                        {Object.keys(entity.details ?? {}).length > 0 && (
                          <div className="space-y-1 rounded bg-background/40 p-2">
                            {Object.entries(entity.details).map(([key, value]) => (
                              <p key={key} className="break-words text-xs">
                                <span className="text-muted-foreground">{key}: </span>
                                {typeof value === "string" ? value : JSON.stringify(value)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
    </div>
  )
}
