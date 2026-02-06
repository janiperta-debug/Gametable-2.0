import { supabase } from "./supabase"
import type { Conversation, Message } from "./types"

// Get conversations for a user
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  if (!supabase) return []
  console.log("[v0] Fetching conversations for user:", userId)
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .contains("participants", [userId])
      .order("last_message_time", { ascending: false })

    if (error) throw error
    return (data || []).map((conv) => ({
      id: conv.id,
      participants: conv.participants,
      lastMessage: conv.last_message,
      lastMessageTime: new Date(conv.last_message_time),
      unreadBy: conv.unread_by || [],
    })) as Conversation[]
  } catch (error) {
    console.error("[v0] Error fetching conversations:", error)
    return []
  }
}

// Get messages for a conversation
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  if (!supabase) return []
  console.log("[v0] Fetching messages for conversation:", conversationId)
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("timestamp", { ascending: true })

    if (error) throw error
    return (data || []).map((msg) => ({
      id: msg.id,
      senderId: msg.sender_id,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      read: msg.read || false,
    })) as Message[]
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return []
  }
}
