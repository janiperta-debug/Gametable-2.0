import type { UserProfile } from "./types"

// Mock users for development
const mockUsers: UserProfile[] = [
  {
    oderId: "user-1",
    displayName: "Dragon Knight",
    email: "dragon@example.com",
    bio: "Veteran wargamer and dungeon master. 20+ years of tabletop experience.",
    location: "Helsinki, Finland",
    photoURL: undefined,
    currentLevel: 15,
    prefersBoardGames: true,
    prefersRPGs: true,
    prefersOtherMiniatures: false,
    prefersWarhammer: true,
  },
  {
    oderId: "user-2",
    displayName: "Dice Goblin",
    email: "dice@example.com",
    bio: "Board game enthusiast. Always looking for new gaming groups!",
    location: "Tampere, Finland",
    photoURL: undefined,
    currentLevel: 8,
    prefersBoardGames: true,
    prefersRPGs: true,
    prefersOtherMiniatures: false,
    prefersWarhammer: false,
  },
  {
    oderId: "user-3",
    displayName: "Miniature Master",
    email: "mini@example.com",
    bio: "Painting miniatures is my passion. Warhammer 40k and Age of Sigmar player.",
    location: "Turku, Finland",
    photoURL: undefined,
    currentLevel: 22,
    prefersBoardGames: false,
    prefersRPGs: false,
    prefersOtherMiniatures: true,
    prefersWarhammer: true,
  },
]

// Get user profile by ID
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log("[v0] getUserProfile called (mock):", userId)
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockUsers.find((u) => u.oderId === userId) || mockUsers[0]
}

// Search for users by location or preferences
export async function searchUsers(searchTerm: string): Promise<UserProfile[]> {
  console.log("[v0] searchUsers called (mock):", searchTerm)
  await new Promise((resolve) => setTimeout(resolve, 100))

  const term = searchTerm.toLowerCase()
  return mockUsers.filter(
    (user) =>
      user.displayName.toLowerCase().includes(term) ||
      user.location?.toLowerCase().includes(term) ||
      user.bio?.toLowerCase().includes(term)
  )
}

// Get users by gaming preference
export async function getUsersByPreference(
  preference: "boardgames" | "rpgs" | "miniatures" | "warhammer"
): Promise<UserProfile[]> {
  console.log("[v0] getUsersByPreference called (mock):", preference)
  await new Promise((resolve) => setTimeout(resolve, 100))

  const preferenceMap = {
    boardgames: "prefersBoardGames",
    rpgs: "prefersRPGs",
    miniatures: "prefersOtherMiniatures",
    warhammer: "prefersWarhammer",
  } as const

  const field = preferenceMap[preference]
  return mockUsers.filter((user) => user[field])
}
