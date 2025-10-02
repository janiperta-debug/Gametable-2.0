import { db } from "./firebase"
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "firebase/firestore"
import type { Event } from "./types"

// Convert Firestore timestamp to Date
function convertTimestamp(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  return new Date(timestamp)
}

// Get all public events
export async function getPublicEvents(): Promise<Event[]> {
  console.log("[v0] Fetching public events")
  try {
    const eventsRef = collection(db, "events")
    const q = query(eventsRef, where("privacyLevel", "==", "public"), orderBy("startTime", "desc"))
    const snapshot = await getDocs(q)

    const events = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        date: convertTimestamp(data.startTime),
        location: data.location,
        maxAttendees: data.maxPlayers,
        attendees: data.rsvps || [],
        createdBy: data.organizerId,
        isPublic: data.privacyLevel === "public",
        status: data.status,
        gameType: data.gameTitle,
      } as Event
    })

    console.log(`[v0] Found ${events.length} public events`)
    return events
  } catch (error) {
    console.error("[v0] Error fetching public events:", error)
    return []
  }
}

// Get events for a specific user (created by them or RSVP'd)
export async function getUserEvents(userId: string): Promise<Event[]> {
  console.log("[v0] Fetching events for user:", userId)
  try {
    const eventsRef = collection(db, "events")
    const q = query(eventsRef, where("organizerId", "==", userId), orderBy("startTime", "desc"))
    const snapshot = await getDocs(q)

    const events = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        date: convertTimestamp(data.startTime),
        location: data.location,
        maxAttendees: data.maxPlayers,
        attendees: data.rsvps || [],
        createdBy: data.organizerId,
        isPublic: data.privacyLevel === "public",
        status: data.status,
        gameType: data.gameTitle,
      } as Event
    })

    console.log(`[v0] Found ${events.length} events for user`)
    return events
  } catch (error) {
    console.error("[v0] Error fetching user events:", error)
    return []
  }
}

// Get a single event by ID
export async function getEventById(eventId: string): Promise<Event | null> {
  console.log("[v0] Fetching event:", eventId)
  try {
    const eventRef = doc(db, "events", eventId)
    const eventDoc = await getDoc(eventRef)

    if (!eventDoc.exists()) {
      console.log("[v0] Event not found")
      return null
    }

    const data = eventDoc.data()
    return {
      id: eventDoc.id,
      title: data.title,
      description: data.description,
      date: convertTimestamp(data.startTime),
      location: data.location,
      maxAttendees: data.maxPlayers,
      attendees: data.rsvps || [],
      createdBy: data.organizerId,
      isPublic: data.privacyLevel === "public",
      status: data.status,
      gameType: data.gameTitle,
    } as Event
  } catch (error) {
    console.error("[v0] Error fetching event:", error)
    return null
  }
}
