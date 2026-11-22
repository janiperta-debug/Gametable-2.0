"use server"

import { createClient } from "@/lib/supabase/server"

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
