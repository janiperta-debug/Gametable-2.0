import type { MiniatureArmyContext } from "./army-resolver"

export type MiniaturePaintStatus = "unpainted" | "primed" | "in_progress" | "painted" | "based"
type ProductionPaintStatus = "unpainted" | "primed" | "wip" | "battle_ready" | "parade_ready"

const paintStatusMap: Record<MiniaturePaintStatus, ProductionPaintStatus> = {
  unpainted: "unpainted",
  primed: "primed",
  in_progress: "wip",
  painted: "battle_ready",
  based: "parade_ready",
}

export function mapMiniaturePaintStatus(paintStatus: string): ProductionPaintStatus | undefined {
  return paintStatus in paintStatusMap
    ? paintStatusMap[paintStatus as MiniaturePaintStatus]
    : undefined
}

interface CanonicalMiniatureUnit {
  id: string
  faction_id: string
  base_points: number
}

interface BuildMiniatureArmyUnitPayloadOptions {
  catalogId?: string
  army?: Pick<MiniatureArmyContext, "id" | "factionId">
  canonicalUnit?: CanonicalMiniatureUnit
  userId: string
  modelCount: number
  paintStatus: string
}

export function buildMiniatureArmyUnitPayload({
  catalogId,
  army,
  canonicalUnit,
  userId,
  modelCount,
  paintStatus,
}: BuildMiniatureArmyUnitPayloadOptions):
  | { success: true; data: Record<string, string | number | boolean | null> }
  | { success: false; error: string } {
  if (!catalogId) return { success: false, error: "Miniature is not a canonical catalog result" }
  if (!army?.id) return { success: false, error: "Army context is required" }
  if (!canonicalUnit) return { success: false, error: "Miniature catalog unit not found" }
  if (canonicalUnit.faction_id !== army.factionId) {
    return { success: false, error: "Selected Army faction is incompatible with this Miniature" }
  }
  const productionPaintStatus = mapMiniaturePaintStatus(paintStatus)
  if (!productionPaintStatus) return { success: false, error: "Invalid miniature paint status" }

  return {
    success: true,
    data: {
      army_id: army.id,
      unit_id: canonicalUnit.id,
      user_id: userId,
      model_count: modelCount,
      points_total: canonicalUnit.base_points,
      owned: true,
      paint_status: productionPaintStatus,
      custom_name: null,
      upgrades: null,
      is_warlord: false,
    },
  }
}
