import { db, auth } from "./firebase"
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import type { Game } from "./types"

export class GameService {
  // Get user's games from userProfiles/{userId}/games subcollection
  static async getUserGames(userId?: string): Promise<Game[]> {
    try {
      const uid = userId || auth.currentUser?.uid
      if (!uid) {
        console.log("[v0] No user ID available for fetching games")
        return []
      }

      console.log("[v0] Fetching games for user:", uid)

      // Query the games subcollection under the user's profile
      const gamesRef = collection(db, "userProfiles", uid, "games")
      const q = query(gamesRef, orderBy("addedAt", "desc"))

      const snapshot = await getDocs(q)
      const games = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        addedAt: doc.data().addedAt?.toDate() || new Date(),
      })) as Game[]

      console.log("[v0] Fetched games count:", games.length)
      return games
    } catch (error) {
      console.error("[v0] Error fetching games:", error)
      return []
    }
  }

  // Get games by category
  static async getGamesByCategory(category: Game["category"], userId?: string): Promise<Game[]> {
    try {
      const uid = userId || auth.currentUser?.uid
      if (!uid) return []

      const gamesRef = collection(db, "userProfiles", uid, "games")
      const q = query(gamesRef, where("category", "==", category), orderBy("addedAt", "desc"))

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        addedAt: doc.data().addedAt?.toDate() || new Date(),
      })) as Game[]
    } catch (error) {
      console.error("[v0] Error fetching games by category:", error)
      return []
    }
  }

  // Add a new game
  static async addGame(gameData: Omit<Game, "id" | "addedAt" | "userId">): Promise<string | null> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) {
        console.error("[v0] No authenticated user")
        return null
      }

      const gamesRef = collection(db, "userProfiles", uid, "games")
      const docRef = await addDoc(gamesRef, {
        ...gameData,
        userId: uid,
        addedAt: new Date(),
      })

      console.log("[v0] Game added with ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("[v0] Error adding game:", error)
      return null
    }
  }

  // Update a game
  static async updateGame(gameId: string, updates: Partial<Game>): Promise<boolean> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) return false

      const gameRef = doc(db, "userProfiles", uid, "games", gameId)
      await updateDoc(gameRef, updates)

      console.log("[v0] Game updated:", gameId)
      return true
    } catch (error) {
      console.error("[v0] Error updating game:", error)
      return false
    }
  }

  // Delete a game
  static async deleteGame(gameId: string): Promise<boolean> {
    try {
      const uid = auth.currentUser?.uid
      if (!uid) return false

      const gameRef = doc(db, "userProfiles", uid, "games", gameId)
      await deleteDoc(gameRef)

      console.log("[v0] Game deleted:", gameId)
      return true
    } catch (error) {
      console.error("[v0] Error deleting game:", error)
      return false
    }
  }
}
