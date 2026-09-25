"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { checkAndAwardBadges } from "./badges"

export type ImportCategory = "board_game" | "rpg" | "tcg" | "miniatures"

// Read the canonical owned collection IDs on the server, never trust client
// supplied counts. Wishlist items and duplicate-only imports do not qualify.
async function ownedIds(userId: string, category: ImportCategory): Promise<string[]> {
  const db = createServiceClient()
  if (category === "tcg") {
    const { data, error } = await db.from("tcg_collection").select("card_id").eq("user_id", userId)
    if (error) throw new Error(error.message)
    return [...new Set((data ?? []).map((row) => row.card_id))]
  }
  if (category === "miniatures") {
    const { data, error } = await db.from("mini_army_units").select("unit_id").eq("user_id", userId).eq("owned", true)
    if (error) throw new Error(error.message)
    return [...new Set((data ?? []).map((row) => row.unit_id))]
  }
  const { data, error } = await db.from("user_games").select("game_id, games!inner(category)").eq("user_id", userId).eq("status", "owned").eq("games.category", category)
  if (error) throw new Error(error.message)
  return [...new Set((data ?? []).map((row) => row.game_id))]
}

export async function beginCollectionImport(category: ImportCategory): Promise<{ operationId?: string; error?: string }> {
  if (!["board_game", "rpg", "tcg", "miniatures"].includes(category)) return { error: "Invalid import category" }
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: "Not authenticated" }
  try {
    const db = createServiceClient()
    // A failed browser request must not permanently block subsequent imports.
    await db.from("collection_import_operations").update({ status: "empty", finished_at: new Date().toISOString() })
      .eq("user_id", user.id).eq("category", category).eq("status", "pending")
      .lt("started_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
    const baseline = await ownedIds(user.id, category)
    const { data, error } = await db.from("collection_import_operations")
      .insert({ user_id: user.id, category, baseline_ids: baseline }).select("id").single()
    if (error) return { error: error.code === "23505" ? "An import is already in progress for this category" : error.message }
    return { operationId: data.id }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not start import" }
  }
}

export async function finishCollectionImport(operationId: string): Promise<{ recorded: boolean; newItems: number; error?: string }> {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { recorded: false, newItems: 0, error: "Not authenticated" }
  try {
    const db = createServiceClient()
    const { data: operation, error } = await db.from("collection_import_operations")
      .select("id,category,baseline_ids,status").eq("id", operationId).eq("user_id", user.id).maybeSingle()
    if (error || !operation) return { recorded: false, newItems: 0, error: error?.message || "Import operation not found" }
    if (operation.status !== "pending") return { recorded: false, newItems: 0 }
    const before = new Set<string>(Array.isArray(operation.baseline_ids) ? operation.baseline_ids : [])
    const after = await ownedIds(user.id, operation.category as ImportCategory)
    const newItems = after.filter((id) => !before.has(id)).length
    const { data: finished, error: updateError } = await db.from("collection_import_operations")
      .update({ new_items: newItems, status: newItems > 0 ? "completed" : "empty", finished_at: new Date().toISOString() })
      .eq("id", operationId).eq("user_id", user.id).eq("status", "pending").select("id").maybeSingle()
    if (updateError) return { recorded: false, newItems: 0, error: updateError.message }
    if (!finished) return { recorded: false, newItems: 0 }
    if (newItems > 0) {
      const result = await checkAndAwardBadges(user.id)
      if (result.error) console.error("Import badge reconciliation failed:", result.error)
    }
    return { recorded: newItems > 0, newItems }
  } catch (error) {
    return { recorded: false, newItems: 0, error: error instanceof Error ? error.message : "Could not finish import" }
  }
}
