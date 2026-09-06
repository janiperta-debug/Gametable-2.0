export interface MiniatureSearchResult {
  catalogId: string
  name: string
  source?: "wahapedia" | string
  sourceId?: string
  systemId: string
  systemCode: string
  systemName: string
  edition?: string
  factionId?: string
  factionName?: string
  unitType?: string
  basePoints?: number
  modelCountMin?: number
  modelCountMax?: number
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function mapMiniatureCatalogUnit(unit: Record<string, any>): MiniatureSearchResult | null {
  const faction = Array.isArray(unit.faction) ? unit.faction[0] : unit.faction
  const system = Array.isArray(faction?.system) ? faction.system[0] : faction?.system
  if (!system?.id) return null

  const datasheet = asObject(unit.datasheet)
  const sourceId = typeof datasheet.wahapedia_id === "string" ? datasheet.wahapedia_id : undefined

  return {
    catalogId: unit.id,
    name: unit.name,
    source: sourceId ? "wahapedia" : undefined,
    sourceId,
    systemId: system.id,
    systemCode: system.code || "unknown",
    systemName: system.name || "Unknown System",
    edition: system.edition || undefined,
    factionId: faction?.id,
    factionName: faction?.name,
    unitType: unit.unit_type || undefined,
    basePoints: unit.base_points,
    modelCountMin: unit.model_count_min,
    modelCountMax: unit.model_count_max,
  }
}
