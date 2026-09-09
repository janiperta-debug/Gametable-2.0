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
  /** Optional future Army Builder context. Collection ownership does not require it. */
  army?: { id: string; factionId: string }
  canonicalUnit?: CanonicalMiniatureUnit
  userId: string
  modelCount: number
  paintStatus: string
}

/**
 * Builds the production ownership row for a Miniatures Collection entry.
 *
 * The table is still named `mini_army_units` for historical reasons, but an
 * ownership row is not an Army Builder row. `army_id` is therefore optional.
 * If an army is supplied, its faction must match the catalog unit; otherwise
 * the row remains unassigned and can later be used by the Army Builder.
 */
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
  if (!canonicalUnit) return { success: false, error: "Miniature catalog unit not found" }
  if (army && canonicalUnit.faction_id !== army.factionId) {
    return { success: false, error: "Selected Army faction is incompatible with this Miniature" }
  }
  const productionPaintStatus = mapMiniaturePaintStatus(paintStatus)
  if (!productionPaintStatus) return { success: false, error: "Invalid miniature paint status" }

  return {
    success: true,
    data: {
      army_id: army?.id ?? null,
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
