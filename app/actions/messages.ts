"use server"

import { createClient } from "@/lib/supabase/server"

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
  sender?: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

export interface Conversation {
  id: string
  participants: string[]
  updated_at: string
  created_at: string
  other_participant?: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }
  last_message?: Message
  unread_count?: number
}

// Get all conversations for the current user
export async function getConversations(): Promise<{ data: Conversation[]; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  // Get conversations where user is a participant
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .contains("participants", [user.id])
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching conversations:", error)
    return { data: [], error: error.message }
  }

  if (!conversations || conversations.length === 0) {
    return { data: [], error: null }
  }

  // Get other participants' profiles
  const otherParticipantIds = conversations.flatMap(c => 
    c.participants.filter((p: string) => p !== user.id)
  )
  
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", otherParticipantIds)

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // Get last message and unread count for each conversation
  const conversationsWithDetails = await Promise.all(
    conversations.map(async (conv) => {
      const otherId = conv.participants.find((p: string) => p !== user.id)
      
      // Get last message
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)

      // Get unread count
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .is("read_at", null)

      return {
        ...conv,
        other_participant: otherId ? profileMap.get(otherId) : undefined,
        last_message: lastMessages?.[0] || undefined,
        unread_count: count || 0
      }
    })
  )

  return { data: conversationsWithDetails, error: null }
}

// Get messages for a specific conversation
export async function getMessages(conversationId: string): Promise<{ data: Message[]; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: [], error: "Not authenticated" }
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, display_name, username, avatar_url)
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return { data: [], error: error.message }
  }

  return { data: messages || [], error: null }
}

// Send a message
export async function sendMessage(conversationId: string, content: string): Promise<{ data: Message | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  if (!content.trim()) {
    return { data: null, error: "Message cannot be empty" }
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim()
    })
    .select()
    .single()

  if (error) {
    console.error("Error sending message:", error)
    return { data: null, error: error.message }
  }

  return { data: message, error: null }
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null)

  if (error) {
    console.error("Error marking messages as read:", error)
    return { error: error.message }
  }

  return { error: null }
}

// Get or create a conversation with another user
export async function getOrCreateConversation(otherUserId: string): Promise<{ data: Conversation | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  if (user.id === otherUserId) {
    return { data: null, error: "Cannot create conversation with yourself" }
  }

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .contains("participants", [user.id, otherUserId])

  // Find a conversation that has exactly these two participants
  const existingConv = existing?.find(c => 
    c.participants.length === 2 &&
    c.participants.includes(user.id) &&
    c.participants.includes(otherUserId)
  )

  if (existingConv) {
    return { data: existingConv, error: null }
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      participants: [user.id, otherUserId]
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating conversation:", error)
    return { data: null, error: error.message }
  }

  return { data: newConv, error: null }
}

// Get total unread message count for navbar badge
export async function getUnreadCount(): Promise<{ count: number; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { count: 0, error: null }
  }

  // Get all conversations for this user
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .contains("participants", [user.id])

  if (!conversations || conversations.length === 0) {
    return { count: 0, error: null }
  }

  const conversationIds = conversations.map(c => c.id)

  // Count unread messages
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .neq("sender_id", user.id)
    .is("read_at", null)

  if (error) {
    console.error("Error counting unread messages:", error)
    return { count: 0, error: error.message }
  }

  return { count: count || 0, error: null }
}
