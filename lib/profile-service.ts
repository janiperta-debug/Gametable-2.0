import { db } from "./firebase"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import type { UserProfile } from "./types"

// Convert Firestore timestamp to Date
function convertTimestamp(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  return new Date(timestamp)
}

// Get user profile by ID
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log("[v0] Fetching user profile:", userId)
  try {
    const userRef = doc(db, "userProfiles", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      console.log("[v0] User profile not found")
      return null
    }

    const data = userDoc.data()
    return {
      userId: userDoc.id,
      displayName: data.displayName,
      email: data.email,
      bio: data.bio,
      location: data.location,
      photoURL: data.photoURL,
      currentLevel: data.level || 1,
      prefersBoardGames: data.prefersBoardGames || false,
      prefersRPGs: data.prefersRPGs || false,
      prefersOtherMiniatures: data.prefersOtherMiniatures || false,
      prefersWarhammer: data.prefersWarhammer || false,
      lastXPUpdate: data.lastXPUpdate ? convertTimestamp(data.lastXPUpdate) : undefined,
    } as UserProfile
  } catch (error) {
    console.error("[v0] Error fetching user profile:", error)
    return null
  }
}

// Search for users by location or preferences
export async function searchUsers(searchTerm: string): Promise<UserProfile[]> {
  console.log("[v0] Searching users with term:", searchTerm)
  try {
    const usersRef = collection(db, "userProfiles")
    const snapshot = await getDocs(usersRef)

    const users = snapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          userId: doc.id,
          displayName: data.displayName,
          email: data.email,
          bio: data.bio,
          location: data.location,
          photoURL: data.photoURL,
          currentLevel: data.level || 1,
          prefersBoardGames: data.prefersBoardGames || false,
          prefersRPGs: data.prefersRPGs || false,
          prefersOtherMiniatures: data.prefersOtherMiniatures || false,
          prefersWarhammer: data.prefersWarhammer || false,
        } as UserProfile
      })
      .filter((user) => {
        const term = searchTerm.toLowerCase()
        return (
          user.displayName.toLowerCase().includes(term) ||
          user.location?.toLowerCase().includes(term) ||
          user.bio?.toLowerCase().includes(term)
        )
      })

    console.log(`[v0] Found ${users.length} matching users`)
    return users
  } catch (error) {
    console.error("[v0] Error searching users:", error)
    return []
  }
}

// Get users by gaming preference
export async function getUsersByPreference(
  preference: "boardgames" | "rpgs" | "miniatures" | "warhammer",
): Promise<UserProfile[]> {
  console.log("[v0] Fetching users with preference:", preference)
  try {
    const usersRef = collection(db, "userProfiles")
    const fieldMap = {
      boardgames: "prefersBoardGames",
      rpgs: "prefersRPGs",
      miniatures: "prefersOtherMiniatures",
      warhammer: "prefersWarhammer",
    }

    const q = query(usersRef, where(fieldMap[preference], "==", true))
    const snapshot = await getDocs(q)

    const users = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        userId: doc.id,
        displayName: data.displayName,
        email: data.email,
        bio: data.bio,
        location: data.location,
        photoURL: data.photoURL,
        currentLevel: data.level || 1,
        prefersBoardGames: data.prefersBoardGames || false,
        prefersRPGs: data.prefersRPGs || false,
        prefersOtherMiniatures: data.prefersOtherMiniatures || false,
        prefersWarhammer: data.prefersWarhammer || false,
      } as UserProfile
    })

    console.log(`[v0] Found ${users.length} users with ${preference} preference`)
    return users
  } catch (error) {
    console.error("[v0] Error fetching users by preference:", error)
    return []
  }
}
