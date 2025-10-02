import { db } from "./firebase"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import type { Conversation, Message } from "./types"

// Convert Firestore timestamp to Date
function convertTimestamp(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  return new Date(timestamp)
}

// Get conversations for a user
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  console.log("[v0] Fetching conversations for user:", userId)
  try {
    const conversationsRef = collection(db, "conversations")
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId),
      orderBy("lastMessageTime", "desc"),
    )
    const snapshot = await getDocs(q)

    const conversations = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        participants: data.participants,
        lastMessage: data.lastMessage,
        lastMessageTime: convertTimestamp(data.lastMessageTime),
        unreadBy: data.unreadBy || [],
      } as Conversation
    })

    console.log(`[v0] Found ${conversations.length} conversations`)
    return conversations
  } catch (error) {
    console.error("[v0] Error fetching conversations:", error)
    return []
  }
}

// Get messages for a conversation
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  console.log("[v0] Fetching messages for conversation:", conversationId)
  try {
    const messagesRef = collection(db, "conversations", conversationId, "messages")
    const q = query(messagesRef, orderBy("timestamp", "asc"))
    const snapshot = await getDocs(q)

    const messages = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        senderId: data.senderId,
        content: data.content,
        timestamp: convertTimestamp(data.timestamp),
        read: data.read || false,
      } as Message
    })

    console.log(`[v0] Found ${messages.length} messages`)
    return messages
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return []
  }
}
