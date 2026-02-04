import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { UserProfile } from "./types"

const PROFILES_COLLECTION = "profiles"

export async function createUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const profileRef = doc(db, PROFILES_COLLECTION, userId)
  await setDoc(profileRef, {
    ...profile,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const profileRef = doc(db, PROFILES_COLLECTION, userId)
  const snapshot = await getDoc(profileRef)
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const profileRef = doc(db, PROFILES_COLLECTION, userId)
  await updateDoc(profileRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}
