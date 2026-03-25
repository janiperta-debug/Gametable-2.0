/**
 * XP and Level calculation utilities
 * These are pure functions that can be used on both client and server
 */

/**
 * Calculate level from XP
 * Level 1: 0-99 XP
 * Level 2: 100-199 XP
 * etc.
 */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1
}

/**
 * Get XP required for next level
 */
export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * 100
}

/**
 * Get XP required for current level start
 */
export function xpForCurrentLevel(currentLevel: number): number {
  return (currentLevel - 1) * 100
}

/**
 * Get XP progress percentage within current level
 */
export function xpProgressPercent(xp: number, level: number): number {
  const currentLevelXP = xpForCurrentLevel(level)
  const nextLevelXP = xpForNextLevel(level)
  const xpInCurrentLevel = xp - currentLevelXP
  const xpNeededForLevel = nextLevelXP - currentLevelXP
  return xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 0
}
