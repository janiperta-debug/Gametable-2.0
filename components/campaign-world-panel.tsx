"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { getCampaignWorldEntities, updateCampaignEntityVisibility, assignCampaignCharacter } from "@/app/actions/campaign-world"

type WorldEntity = {
  id: string
  entity_type: string
  name: string
  summary: string
  details: Record<string, unknown>
  visibility: "gm_only" | "players"
  assigned_to_user_id: string | null
  status: string
}
type Participant = { user_id: string; display_name: string | null; username: string | null }

const TYPE_LABELS: Record<string, string> = {
  character: "Hahmot", person: "Henkilöt", location: "Paikat", faction: "Ryhmittymät",
  quest: "Tehtävät", item: "Esineet", creature: "Olennot", history: "Historia",
  rule: "Säännöt", other: "Muut tiedot",
}

const selectClass = "w-full rounded-md border border-accent-gold/25 bg-background px-3 py-2 text-sm"

export function CampaignWorldPanel({ eventId }: { eventId: string }) {
  const [entities, setEntities] = useState<WorldEntity[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isGM, setIsGM] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState<string | null>(null)

  const loadEntities = async () => {
    setError("")
    try {
      const result = await getCampaignWorldEntities(eventId)
      if (result.success) {
        setEntities(result.entities as WorldEntity[])
        setParticipants(result.participants as Participant[])
        setIsGM(result.isGM)
      } else setError(result.error)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kampanjan tietojen lataaminen epäonnistui.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      setError("")
      try {
        const result = await getCampaignWorldEntities(eventId)
        if (!active) return
        if (result.success) {
          setEntities(result.entities as WorldEntity[])
          setParticipants(result.participants as Participant[])
          setIsGM(result.isGM)
        } else setError(result.error)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Kampanjan tietojen lataaminen epäonnistui.")
      } finally {
        if (active) setLoading(false)
      }
    }
    const handleWorldUpdated = () => { void load() }
    void load()
    window.addEventListener("gametable:campaign-world-updated", handleWorldUpdated)
    return () => {
      active = false
      window.removeEventListener("gametable:campaign-world-updated", handleWorldUpdated)
    }
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

  const changeVisibility = async (entity: WorldEntity, visibility: "gm_only" | "players") => {
    if (entity.visibility === visibility) return
    setSaving(entity.id)
    const result = await updateCampaignEntityVisibility(eventId, entity.id, visibility)
    if (result.success) setEntities(current => current.map(item => item.id === entity.id ? { ...item, visibility: result.visibility } : item))
    else setError(result.error)
    setSaving(null)
  }

  const changeAssignment = async (entity: WorldEntity, userId: string) => {
    const assignedTo = userId || null
    if (entity.assigned_to_user_id === assignedTo) return
    setSaving(entity.id)
    const result = await assignCampaignCharacter(eventId, entity.id, assignedTo)
    if (result.success) setEntities(current => current.map(item => item.id === entity.id ? { ...item, assigned_to_user_id: result.assignedToUserId } : item))
    else setError(result.error)
    setSaving(null)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Kampanjan henkilöt, paikat, tehtävät ja muu pelimaailman tieto yhdessä paikassa.
      </p>
      {isGM && (
        <p className="text-xs text-muted-foreground">
          Voit julkaista yksittäisiä tietoja osallistujille ja kohdistaa kampanjan hahmoja pelaajille. Muut tiedot pysyvät yksityisinä.
        </p>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground">Ladataan kampanjan tietoja…</p>
      ) : error && entities.length === 0 ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : entities.length === 0 ? (
        <div className="rounded-md border border-accent-gold/20 bg-background/30 p-4 text-sm text-muted-foreground">
          Tietopankki on vielä tyhjä. Kun pelinjohtaja hyväksyy aineistotuonnin ehdotuksia, ne ilmestyvät tänne.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-accent-gold/30 text-accent-gold">{entities.length} kohdetta</Badge>
            {isGM && <Badge variant="outline">Oletuksena vain pelinjohtajalle</Badge>}
          </div>
          {groups.map(([type, group]) => (
            <details key={type} className="rounded-md border border-accent-gold/20 bg-background/30 p-3" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <span className="font-medium">{TYPE_LABELS[type] ?? type}</span>
                <Badge variant="outline">{group.length}</Badge>
              </summary>
              <div className="mt-3 space-y-2">
                {group.map(entity => (
                  <details key={entity.id} className="rounded border border-accent-gold/10 bg-background/40 p-3">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 text-sm font-medium">{entity.name}</span>
                      {entity.visibility === "gm_only" && <Badge variant="outline">Vain pelinjohtajalle</Badge>}
                      {entity.assigned_to_user_id && isGM && <Badge variant="outline">Kohdistettu</Badge>}
                    </summary>
                    <div className="mt-2 space-y-3 text-sm">
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
                      {isGM && (
                        <div className="grid gap-3 border-t border-accent-gold/10 pt-3">
                          <label className="block space-y-1">
                            <span className="text-xs text-muted-foreground">Näkyvyys</span>
                            <select className={selectClass} value={entity.visibility} disabled={saving === entity.id}
                              onChange={event => void changeVisibility(entity, event.target.value as "gm_only" | "players")}>
                              <option value="gm_only">Vain pelinjohtajalle</option>
                              <option value="players">Kaikille osallistujille</option>
                            </select>
                          </label>
                          {entity.entity_type === "character" && (
                            <label className="block space-y-1">
                              <span className="text-xs text-muted-foreground">Hahmon pelaaja</span>
                              <select className={selectClass} value={entity.assigned_to_user_id ?? ""} disabled={saving === entity.id}
                                onChange={event => void changeAssignment(entity, event.target.value)}>
                                <option value="">Ei kohdistettu</option>
                                {participants.map(participant => (
                                  <option key={participant.user_id} value={participant.user_id}>
                                    {participant.display_name || participant.username || "Pelaaja"}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
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
      {error && entities.length > 0 && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
