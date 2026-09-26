"use server"

import { createClient } from "@/lib/supabase/server"

export type EventGameCategory = "board_game" | "rpg" | "trading_card" | "miniature"
export type EventCollectionGame = {
 id: string | null
 name: string
 category: EventGameCategory
 image_url: string | null
 source: "user_games" | "tcg_collection" | "mini_armies"
 system?: string
}

const categories: EventGameCategory[] = ["board_game", "rpg", "trading_card", "miniature"]

/** A unified, read-only event picker. Character/deck/army selections can
 * later attach to the catalog game ID without changing the event form.
 * Only the signed-in user's own collection is queried.
 */
export async function getEventCollectionGames(): Promise<{games: EventCollectionGame[]; error?: string}> {
 const db = await createClient()
 const {data:{user}} = await db.auth.getUser()
 if (!user) return {games:[],error:"Unauthorized"}
 const [owned, cards, armies] = await Promise.all([
  db.from("user_games").select("game:games(id,name,category,image_url,game_system)").eq("user_id",user.id).eq("status","owned"),
  db.from("tcg_collection").select("card:tcg_cards(tcg_system)").eq("user_id",user.id).gt("quantity",0),
  db.from("mini_armies").select("game:games(id,name,category,image_url,game_system)").eq("user_id",user.id),
 ])
 if (owned.error) return {games:[],error:owned.error.message}
 const result = new Map<string,EventCollectionGame>()
 const add = (g: EventCollectionGame) => result.set(g.id ? "id:"+g.id : g.category+":"+g.system, g)
 const unpack = (value:unknown): Record<string,unknown> | null =>
  Array.isArray(value) ? (value[0] as Record<string,unknown> || null) : (value as Record<string,unknown> | null)
 for (const row of owned.data || []) {
  const g=unpack(row.game)
  if (g && categories.includes(g.category as EventGameCategory))
   add({id:String(g.id),name:String(g.name),category:g.category as EventGameCategory,image_url:typeof g.image_url==="string"?g.image_url:null,source:"user_games",system:typeof g.game_system==="string"?g.game_system:undefined})
 }
 for (const row of armies.data || []) {
  const g=unpack(row.game)
  if (g && g.category==="miniature")
   add({id:String(g.id),name:String(g.name),category:"miniature",image_url:typeof g.image_url==="string"?g.image_url:null,source:"mini_armies",system:typeof g.game_system==="string"?g.game_system:undefined})
 }
 // TCG users may own cards without a corresponding user_games row.
 const systems=new Set<string>()
 for (const row of cards.data || []) {
  const card=unpack(row.card)
  if (typeof card?.tcg_system==="string") systems.add(card.tcg_system.toLowerCase())
 }
 const labels:Record<string,string>={mtg:"Magic: The Gathering",pokemon:"Pokémon TCG",lorcana:"Disney Lorcana",yugioh:"Yu-Gi-Oh!"}
 if (systems.size) {
  const {data:catalog}=await db.from("games").select("id,name,category,image_url,game_system").eq("category","trading_card")
  for (const system of systems) {
   const game=(catalog || []).find(g=>g.game_system?.toLowerCase()===system || g.name?.toLowerCase()===(labels[system]||system).toLowerCase())
   if (game) add({id:game.id,name:game.name,category:"trading_card",image_url:game.image_url,source:"tcg_collection",system})
   else add({id:null,name:labels[system]||system,category:"trading_card",image_url:null,source:"tcg_collection",system})
  }
 }
 return {games:[...result.values()].sort((a,b)=>a.name.localeCompare(b.name,"fi"))}
}
