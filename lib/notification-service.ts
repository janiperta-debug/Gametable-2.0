import { db } from "./firebase"
import { collection, doc, getDocs, query, where, orderBy, updateDoc } from "firebase/firestore"
import type { Notification } from "./types"

// Convert Firestore timestamp to Date
function convertTimestamp(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  return new Date(timestamp)
}

// Get notifications for a user
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  console.log("[v0] Fetching notifications for user:", userId)
  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)

    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        userId: data.userId,
        type: data.type,
        message: data.message,
        read: data.read || false,
        createdAt: convertTimestamp(data.createdAt),
        relatedId: data.relatedId,
      } as Notification
    })

    console.log(`[v0] Found ${notifications.length} notifications`)
    return notifications
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return []
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  console.log("[v0] Fetching unread notification count for user:", userId)
  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "==", userId), where("read", "==", false))
    const snapshot = await getDocs(q)

    console.log(`[v0] Found ${snapshot.size} unread notifications`)
    return snapshot.size
  } catch (error) {
    console.error("[v0] Error fetching unread count:", error)
    return 0
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  console.log("[v0] Marking notification as read:", notificationId)
  try {
    const notificationRef = doc(db, "notifications", notificationId)
    await updateDoc(notificationRef, { read: true })
    console.log("[v0] Notification marked as read")
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error)
  }
}
