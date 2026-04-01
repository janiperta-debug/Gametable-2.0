import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

// Initialize Firebase Admin
async function getFirebaseAdmin() {
  if (getApps().length > 0) {
    const app = getApps()[0]
    return { admin: { firestore: () => getFirestore(app), auth: () => getAuth(app) } }
  }
  
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set")
  }
  
  const serviceAccount = JSON.parse(serviceAccountJson)
  const app = initializeApp({
    credential: cert(serviceAccount)
  })
  
  return { admin: { firestore: () => getFirestore(app), auth: () => getAuth(app) } }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get("secret")
  const userId = searchParams.get("user_id") // Optional: specific user to inspect
  
  if (secret !== "gametable-migrate-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { admin } = await getFirebaseAdmin()
    const firestore = admin.firestore()
    const auth = admin.auth()
    
    const result: Record<string, unknown> = {
      collections: [],
      sampleUser: null,
      sampleProfile: null,
      sampleGames: null,
      profileFields: [],
      gameFields: [],
    }
    
    // List all root collections
    const collections = await firestore.listCollections()
    result.collections = collections.map(c => c.id)
    
    // Get a sample user from Firebase Auth
    const usersList = await auth.listUsers(1)
    if (usersList.users.length > 0) {
      const sampleUser = userId 
        ? await auth.getUser(userId).catch(() => usersList.users[0])
        : usersList.users[0]
      
      result.sampleUser = {
        uid: sampleUser.uid,
        email: sampleUser.email,
        displayName: sampleUser.displayName,
        photoURL: sampleUser.photoURL,
        metadata: sampleUser.metadata,
      }
      
      // Try to find profile for this user in various possible collection names
      const possibleProfileCollections = [
        "userProfiles",
        "users",
        "profiles",
        "UserProfiles",
        "Users",
        "Profiles",
      ]
      
      for (const collName of possibleProfileCollections) {
        try {
          const profileDoc = await firestore.collection(collName).doc(sampleUser.uid).get()
          if (profileDoc.exists) {
            const data = profileDoc.data()
            result.sampleProfile = {
              collection: collName,
              documentId: profileDoc.id,
              data: data,
              fields: data ? Object.keys(data) : [],
            }
            result.profileFields = data ? Object.keys(data) : []
            
            // Try to find games subcollection
            const gameSubcollections = await profileDoc.ref.listCollections()
            result.gameSubcollections = gameSubcollections.map(c => c.id)
            
            // Try various game subcollection names
            const possibleGameCollections = [
              "games",
              "Games",
              "collection",
              "Collection",
              "userGames",
              "UserGames",
              "boardgames",
              "BoardGames",
            ]
            
            for (const gameCollName of possibleGameCollections) {
              try {
                const gamesSnapshot = await profileDoc.ref.collection(gameCollName).limit(3).get()
                if (!gamesSnapshot.empty) {
                  const games = gamesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    data: doc.data(),
                    fields: Object.keys(doc.data()),
                  }))
                  result.sampleGames = {
                    subcollection: gameCollName,
                    count: gamesSnapshot.size,
                    games: games,
                  }
                  result.gameFields = games.length > 0 ? Object.keys(games[0].data) : []
                  break
                }
              } catch (e) {
                // Collection doesn't exist, continue
              }
            }
            
            break
          }
        } catch (e) {
          // Collection doesn't exist, continue
        }
      }
      
      // Also check for a separate games collection at root level
      const rootGameCollections = [
        "games",
        "Games",
        "boardgames",
        "BoardGames",
      ]
      
      for (const gameCollName of rootGameCollections) {
        try {
          const gamesSnapshot = await firestore.collection(gameCollName).limit(3).get()
          if (!gamesSnapshot.empty) {
            result.rootGamesCollection = {
              collection: gameCollName,
              count: gamesSnapshot.size,
              games: gamesSnapshot.docs.map(doc => ({
                id: doc.id,
                data: doc.data(),
                fields: Object.keys(doc.data()),
              })),
            }
            break
          }
        } catch (e) {
          // Collection doesn't exist
        }
      }
    }
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
