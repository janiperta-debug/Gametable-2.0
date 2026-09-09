"use server"

import { createClient } from "@/lib/supabase/server"
import type { MiniatureSearchResult } from "@/app/api/miniatures/search/route"

export async function addMiniatureToWishlist(unit: MiniatureSearchResult) {
  if (!unit.catalogId) {
    return { success: false, error: "Miniature is not a canonical catalog result" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: canonicalUnit, error: canonicalError } = await supabase
    .from("mini_units")
    .select("id")
    .eq("id", unit.catalogId)
    .maybeSingle()

  if (canonicalError) return { success: false, error: canonicalError.message }
  if (!canonicalUnit) return { success: false, error: "Miniature catalog unit not found" }

  const { error } = await supabase
    .from("miniature_wishlist")
    .upsert(
      { user_id: user.id, unit_id: canonicalUnit.id },
      { onConflict: "user_id,unit_id", ignoreDuplicates: true },
    )

  if (error) {
    console.error("Error adding miniature to wishlist:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function removeMiniatureFromWishlist(catalogId: string) {
  if (!catalogId) return { success: false, error: "Miniature catalog unit is required" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase
    .from("miniature_wishlist")
    .delete()
    .eq("user_id", user.id)
    .eq("unit_id", catalogId)

  if (error) {
    console.error("Error removing miniature from wishlist:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getMiniatureWishlist() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated", data: [] }

  const { data, error } = await supabase
    .from("miniature_wishlist")
    .select(`
      id,
      created_at,
      unit:mini_units (
        id,
        name,
        unit_type,
        base_points,
        faction:mini_factions (
          id,
          name,
          system:mini_systems (
            id,
            code,
            name,
            edition
          )
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching miniature wishlist:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data ?? [] }
}
