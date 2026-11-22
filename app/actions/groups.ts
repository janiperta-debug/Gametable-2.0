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
    .select("id, name, short_description, category, game_interests, location, visibility, cover_image_url")
    .in("visibility", ["public", "private"])
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error loading groups:", error)
    return { data: [], error: "failed" }
  }

  const groups = data ?? []
  const { data: counts, error: countError } = groups.length
    ? await supabase.rpc("get_group_member_counts", { p_group_ids: groups.map(group => group.id) })
    : { data: [], error: null }

  if (countError) {
    console.error("Error loading group member counts:", countError)
    return { data: [], error: "failed" }
  }
  const countByGroup = new Map((counts ?? []).map((row: { group_id: string; member_count: number }) => [row.group_id, row.member_count]))

  return {
    data: groups.map((group) => ({
      id: group.id,
      name: group.name,
      short_description: group.short_description,
      category: group.category,
      game_interests: group.game_interests ?? [],
      location: group.location,
      visibility: group.visibility,
      cover_image_url: group.cover_image_url,
      member_count: countByGroup.get(group.id) ?? 0,
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
    : input.visibility === "private" || input.join_policy === "approval" ? "approval" : "open"
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


export async function joinGroup(groupId: string): Promise<{ status?: "active" | "pending"; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "unauthorized" }
  if (!/^[0-9a-f-]{36}$/i.test(groupId)) return { error: "invalid_group" }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, visibility, join_policy")
    .eq("id", groupId)
    .maybeSingle()

  if (groupError || !group) return { error: "group_not_found" }
  if (group.visibility === "invite_only") return { error: "invite_only" }

  const status = group.visibility === "public" && group.join_policy === "open"
    ? "active"
    : "pending"

  const { error } = await supabase.from("group_memberships").insert({
    group_id: groupId,
    user_id: user.id,
    role: "member",
    status,
  })

  if (error) {
    if (error.code === "23505") return { error: "already_member" }
    console.error("Error joining group:", error)
    return { error: "join_failed" }
  }

  revalidatePath("/discover")
  revalidatePath(`/groups/${groupId}`)
  return { status }
}

export async function leaveGroup(groupId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "unauthorized" }
  if (!/^[0-9a-f-]{36}$/i.test(groupId)) return { error: "invalid_group" }

  const { data: membership, error: membershipError } = await supabase
    .from("group_memberships")
    .select("id, role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError || !membership) return { error: "not_member" }
  if (membership.role === "founder") return { error: "founder_cannot_leave" }

  const { error } = await supabase
    .from("group_memberships")
    .delete()
    .eq("id", membership.id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error leaving group:", error)
    return { error: "leave_failed" }
  }

  revalidatePath("/discover")
  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}


export async function createGroupInviteLink(groupId: string): Promise<{ token?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "unauthorized" }
  if (!/^[0-9a-f-]{36}$/i.test(groupId)) return { error: "invalid_group" }

  const { data: membership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()
  if (!membership || !["founder", "admin"].includes(membership.role)) return { error: "forbidden" }

  const token = crypto.randomUUID()
  const { error } = await supabase.from("groups")
    .update({ invite_token: token })
    .eq("id", groupId)
    .eq("visibility", "invite_only")
  if (error) {
    console.error("Error creating group invite link:", error)
    return { error: "create_failed" }
  }
  revalidatePath(`/groups/${groupId}`)
  return { token }
}

export async function acceptGroupInvite(token: string): Promise<{ groupId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "unauthorized" }
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { error: "invalid_invite" }

  const { data, error } = await supabase.rpc("accept_group_invite", { p_token: token })
  if (error || !data) {
    console.error("Error accepting group invite:", error)
    return { error: "invalid_invite" }
  }
  revalidatePath("/discover")
  revalidatePath(`/groups/${data}`)
  return { groupId: data }
}
