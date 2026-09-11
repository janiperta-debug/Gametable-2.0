"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ListingType = "sell" | "trade" | "give"
export type ListingCondition = "new" | "like_new" | "good" | "fair" | "poor"
export type ListingStatus = "active" | "sold" | "reserved" | "cancelled"

export interface MarketplaceListing {
  id: string
  seller_id: string
  user_game_id: string | null
  game_id: string
  listing_type: ListingType
  condition: ListingCondition
  price: number | null
  description: string | null
  status: ListingStatus
  created_at: string
  updated_at: string
  game?: { id: string; name: string; thumbnail_url: string | null }
  seller?: { id: string; display_name: string | null; username: string | null; avatar_url: string | null; location: string | null }
}

export interface WishlistItem {
  id: string
  user_id: string
  game_id: string
  priority: number
  notes: string | null
  created_at: string
  game?: { id: string; name: string; thumbnail_url: string | null; image_url?: string | null }
  user?: { id: string; display_name: string | null; username: string | null; avatar_url: string | null; location: string | null }
}

export type WishlistEntry = WishlistItem

export interface UserGameForListing {
  id: string
  game_id: string
  game: { id: string; name: string; thumbnail_url: string | null }
}

export async function getMarketplaceListings(filters?: { listingType?: ListingType; search?: string }) {
  const supabase = await createClient()
  let query = supabase.from("marketplace_listings").select(`*, game:games(id, name, thumbnail_url), seller:profiles(id, display_name, username, avatar_url, location)`).eq("status", "active").order("created_at", { ascending: false })
  if (filters?.listingType) query = query.eq("listing_type", filters.listingType)
  const { data, error } = await query
  if (error) { console.error("Error fetching marketplace listings:", error); return { data: [], error: error.message } }
  let listings = data as MarketplaceListing[]
  if (filters?.search) { const searchLower = filters.search.toLowerCase(); listings = listings.filter(l => l.game?.name?.toLowerCase().includes(searchLower)) }
  return { data: listings, error: null }
}

export async function getMyListings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }
  const { data, error } = await supabase.from("marketplace_listings").select(`*, game:games(id, name, thumbnail_url), seller:profiles(id, display_name, username, avatar_url, location)`).eq("seller_id", user.id).order("created_at", { ascending: false })
  if (error) { console.error("Error fetching my listings:", error); return { data: [], error: error.message } }
  return { data: data as MarketplaceListing[], error: null }
}

export async function getMyGamesForListing() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }
  const { data, error } = await supabase.from("user_games").select(`id, game_id, status, game:games(id, name, thumbnail_url)`).eq("user_id", user.id).order("created_at", { ascending: false })
  if (error) { console.error("Error fetching user games:", error); return { data: [], error: error.message } }
  const ownedGames = data?.filter(g => !g.status || g.status === "owned") || []
  return { data: ownedGames as UserGameForListing[], error: null }
}

export const getUserGamesForListing = getMyGamesForListing

export async function createListing(input: { user_game_id: string; listing_type: ListingType; condition: ListingCondition; price?: number; description?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: userGame, error: userGameError } = await supabase
    .from("user_games")
    .select("id, game_id")
    .eq("id", input.user_game_id)
    .eq("user_id", user.id)
    .eq("status", "owned")
    .single()

  if (userGameError || !userGame) {
    console.error("Error fetching user game:", userGameError)
    return { success: false, error: "Game not found in your collection" }
  }

  const { error } = await supabase.from("marketplace_listings").insert({
    seller_id: user.id,
    user_game_id: userGame.id,
    game_id: userGame.game_id,
    listing_type: input.listing_type,
    condition: input.condition,
    price: input.price || null,
    description: input.description || null,
    status: "active",
  })

  if (error) {
    console.error("Error creating listing:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/marketplace")
  return { success: true }
}

export async function updateListing(listingId: string, updates: { listing_type?: ListingType; condition?: ListingCondition; price?: number | null; description?: string | null; status?: ListingStatus }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const { error } = await supabase.from("marketplace_listings").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", listingId).eq("seller_id", user.id)
  if (error) { console.error("Error updating listing:", error); return { success: false, error: error.message } }
  revalidatePath("/marketplace")
  return { success: true }
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const { error } = await supabase.from("marketplace_listings").delete().eq("id", listingId).eq("seller_id", user.id)
  if (error) { console.error("Error deleting listing:", error); return { success: false, error: error.message } }
  revalidatePath("/marketplace")
  return { success: true }
}

export async function getWishlists() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("user_games").select(`id, user_id, game_id, created_at, game:games(id, name, thumbnail_url, image_url), user:profiles(id, display_name, username, avatar_url, location)`).eq("status", "wishlist").order("created_at", { ascending: false })
  if (error) { console.error("Error fetching wishlists:", error); return { data: [], error: error.message } }
  const wishlists = (data || []).map(item => ({ id: item.id, user_id: item.user_id, game_id: item.game_id, priority: 3, notes: null, created_at: item.created_at, game: item.game, user: item.user }))
  return { data: wishlists as WishlistEntry[], error: null }
}

export async function addToWishlist(input: { game_id: string; priority?: number; notes?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: existing } = await supabase
    .from("user_games")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("game_id", input.game_id)
    .maybeSingle()

  if (existing) {
    if (existing.status === "wishlist") return { success: true }
    const { error } = await supabase.from("user_games").update({ status: "wishlist" }).eq("id", existing.id).eq("user_id", user.id)
    if (error) { console.error("Error updating game to wishlist:", error); return { success: false, error: error.message } }
  } else {
    const { error } = await supabase.from("user_games").insert({ user_id: user.id, game_id: input.game_id, status: "wishlist" })
    if (error) { console.error("Error adding game to wishlist:", error); return { success: false, error: error.message } }
  }

  revalidatePath("/marketplace")
  return { success: true }
}

export async function removeFromWishlist(wishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  const { error } = await supabase.from("user_games").delete().eq("id", wishlistId).eq("user_id", user.id).eq("status", "wishlist")
  if (error) { console.error("Error removing game from wishlist:", error); return { success: false, error: error.message } }
  revalidatePath("/marketplace")
  return { success: true }
}

export async function getOrCreateConversation(otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: existing } = await supabase.from("conversations").select("id, participants").contains("participants", [user.id])
  const existingConvo = existing?.find(conv => { const participants = conv.participants as string[]; return participants.length === 2 && participants.includes(user.id) && participants.includes(otherUserId) })
  if (existingConvo) return existingConvo.id
  const { data: created } = await supabase.from("conversations").insert({ participants: [user.id, otherUserId] }).select("id").single()
  return created?.id
}

export async function contactSeller(sellerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated", conversationId: null }
  if (user.id === sellerId) return { success: false, error: "Cannot message yourself", conversationId: null }
  const { data: existingConversations } = await supabase.from("conversations").select("id, participants").contains("participants", [user.id])
  const existingConvo = existingConversations?.find(conv => { const participants = conv.participants as string[]; return participants.length === 2 && participants.includes(user.id) && participants.includes(sellerId) })
  if (existingConvo) return { success: true, conversationId: existingConvo.id }
  const { data: newConvo, error } = await supabase.from("conversations").insert({ participants: [user.id, sellerId] }).select("id").single()
  if (error) { console.error("Error creating conversation:", error); return { success: false, error: error.message, conversationId: null } }
  return { success: true, conversationId: newConvo.id }
}
