// Mock user progress data for badge system (before Firebase integration)
// This simulates what will eventually come from Firebase

export interface UserBadgeProgress {
  earnedBadges: string[] // Array of earned badge IDs
  badgeProgress: Record<string, number> // Current progress for each badge
}

// Mock data for multiple users
const MOCK_USER_DATA: Record<string, UserBadgeProgress> = {
  // Current user (user1)
  user1: {
    earnedBadges: [
      "collection-bronze",
      "explorer-bronze",
      "explorer-silver",
      "social-bronze",
      "hosting-bronze",
      "portal-bronze",
      "portal-silver",
      "portal-gold",
    ],
    badgeProgress: {
      "collection-bronze": 5,
      "collection-silver": 12,
      "collection-gold": 12,
      "explorer-bronze": 2,
      "explorer-silver": 3,
      "explorer-gold": 3,
      "social-bronze": 3,
      "social-silver": 5,
      "social-gold": 5,
      "hosting-bronze": 1,
      "hosting-silver": 2,
      "hosting-gold": 2,
      "manor-bronze": 1,
      "manor-silver": 1,
      "manor-gold": 1,
      "portal-bronze": 1,
      "portal-silver": 10,
      "portal-gold": 50,
      "attendance-bronze": 0,
      "attendance-silver": 0,
      "attendance-gold": 0,
    },
  },
  // Another user example (user2)
  user2: {
    earnedBadges: ["collection-bronze", "collection-silver", "social-bronze", "attendance-bronze"],
    badgeProgress: {
      "collection-bronze": 5,
      "collection-silver": 25,
      "collection-gold": 25,
      "social-bronze": 3,
      "social-silver": 8,
      "attendance-bronze": 3,
      "attendance-silver": 5,
    },
  },
}

// Helper function to get user badge progress by userId
export function getUserBadgeProgress(userId?: string): UserBadgeProgress {
  // Default to user1 if no userId provided (for current user)
  const user = userId || "user1"
  return (
    MOCK_USER_DATA[user] || {
      earnedBadges: [],
      badgeProgress: {},
    }
  )
}

// Helper function to check if user has earned a badge
export function hasEarnedBadge(userId: string, badgeId: string): boolean {
  const progress = getUserBadgeProgress(userId)
  return progress.earnedBadges.includes(badgeId)
}

// Helper function to get total earned badges count
export function getTotalEarnedBadges(userId: string): number {
  const progress = getUserBadgeProgress(userId)
  return progress.earnedBadges.length
}

// Helper function to get total XP earned from badges
export function getTotalBadgeXP(userId: string): number {
  // This would calculate based on earned badges and their XP values
  // For now, returning a mock value based on number of badges
  const earnedCount = getTotalEarnedBadges(userId)
  return earnedCount * 150 // Approximate average XP per badge
}

export const MOCK_USER_PROGRESS = MOCK_USER_DATA

// Helper function to get total badge credits for backward compatibility (returns 0 since we removed credits)
export function getTotalBadgeCredits(userId?: string): number {
  // Credits feature removed - returning 0 for backward compatibility
  return 0
}
