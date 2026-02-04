import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where } from "firebase/firestore"
import { db } from "./firebase"
import type { Game } from "./types"

const GAMES_COLLECTION = "games"

export async function addGameToCollection(userId: string, game: Game): Promise<void> {
  const gameRef = doc(db, GAMES_COLLECTION, `${userId}_${game.id}`)
  await setDoc(gameRef, {
    ...game,
    userId,
    createdAt: new Date().toISOString(),
  })
}

export async function removeGameFromCollection(userId: string, gameId: string): Promise<void> {
  const gameRef = doc(db, GAMES_COLLECTION, `${userId}_${gameId}`)
  await deleteDoc(gameRef)
}

export async function getUserGames(userId: string): Promise<Game[]> {
  const gamesQuery = query(collection(db, GAMES_COLLECTION), where("userId", "==", userId))
  const snapshot = await getDocs(gamesQuery)
  return snapshot.docs.map((doc) => doc.data() as Game)
}

export async function getGameById(userId: string, gameId: string): Promise<Game | null> {
  const gameRef = doc(db, GAMES_COLLECTION, `${userId}_${gameId}`)
  const snapshot = await getDoc(gameRef)
  return snapshot.exists() ? (snapshot.data() as Game) : null
}
