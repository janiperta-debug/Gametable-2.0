"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface DiscoverGroup {
  id: string
  name: string
  short_description: string
  category: string
  game_interests: string[]
  location: string | null
  visibility: "public" | "private" | "invite_only"
  cover_image_url: string | null
  member_count: number
}

export async function getDiscoverGroups(): Promise<{ data: DiscoverGroup[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "unauthorized" }

  const { data, error } = await supabase
    .from("groups")
    .select("id, name, short_description, category, game_interests, location, visibility, cover_image_url, group_memberships(count)")
    .in("visibility", ["public", "private"])
    .order("created_at", { ascending: false })
    .eq("group_memberships.status", "active")
    .limit(50)

  if (error) {
    console.error("Error loading groups:", error)
    return { data: [], error: "failed" }
  }

  return {
    data: (data ?? []).map((group: any) => ({
      id: group.id,
      name: group.name,
      short_description: group.short_description,
      category: group.category,
      game_interests: group.game_interests ?? [],
      location: group.location,
      visibility: group.visibility,
      cover_image_url: group.cover_image_url,
      member_count: group.group_memberships?.[0]?.count ?? 0,
    })),
  }
}


export type GroupCategory = "board_game" | "miniature" | "rpg" | "trading_card" | "other"
export type GroupVisibility = "public" | "private" | "invite_only"

export async function createGroup(input: {
  name: string
  short_description: string
  description?: string
  category: GroupCategory
  game_interests?: string[]
  location?: string
  visibility: GroupVisibility
  join_policy: "open" | "approval" | "invite_only"
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "unauthorized" }

  const name = input.name.trim()
  const shortDescription = input.short_description.trim()
  if (name.length < 2 || name.length > 100 || shortDescription.length < 1 || shortDescription.length > 180) {
    return { error: "invalid_input" }
  }
  if (!["board_game", "miniature", "rpg", "trading_card", "other"].includes(input.category)) return { error: "invalid_category" }
  if (!["public", "private", "invite_only"].includes(input.visibility)) return { error: "invalid_visibility" }

  const joinPolicy = input.visibility === "invite_only"
    ? "invite_only"
    : input.join_policy === "approval" ? "approval" : "open"
  const gameInterests = [...new Set((input.game_interests ?? []).map(value => value.trim()).filter(Boolean).slice(0, 20))]

  const { data, error } = await supabase.from("groups").insert({
    created_by: user.id,
    name,
    short_description: shortDescription,
    description: input.description?.trim() || null,
    category: input.category,
    game_interests: gameInterests,
    location: input.location?.trim() || null,
    visibility: input.visibility,
    join_policy: joinPolicy,
  }).select("id").single()

  if (error || !data) {
    console.error("Error creating group:", error)
    return { error: "create_failed" }
  }
  revalidatePath("/discover")
  revalidatePath(`/groups/${data.id}`)
  return { id: data.id }
}
