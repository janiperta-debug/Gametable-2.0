import type { RoomTheme } from "@/lib/room-themes"
import {
  canUnlockManorRoom,
  getManorUnlockedRoomIds,
  isManorRoomUnlocked,
  type ManorEntitlementProfile,
} from "@/lib/manor-progression"

export interface ThemeEntitlementProfile extends ManorEntitlementProfile {
  level?: number | null
  unlocked_themes?: string[] | null
  preferred_theme?: string | null
}

// Temporary QA switch for the theme/background verification pass.
// Set this back to false when visual testing is complete to restore normal access.
export const THEME_ACCESS_TEST_MODE = true

/**
 * One source of truth for visual-theme access.
 *
 * During QA every theme is selectable; normal entitlement remains below and
 * is restored by switching THEME_ACCESS_TEST_MODE to false.
 */
export function isThemeUnlocked(
  theme: RoomTheme,
  profile?: ThemeEntitlementProfile | null,
): boolean {
  if (THEME_ACCESS_TEST_MODE) return true
  return isManorRoomUnlocked(theme.id, profile)
}

/**
 * True when XP has reached the room threshold and the user can open/select
 * the room. This does not make the room active.
 */
export function canUnlockTheme(
  theme: RoomTheme,
  profile?: ThemeEntitlementProfile | null,
): boolean {
  if (THEME_ACCESS_TEST_MODE) return false
  return canUnlockManorRoom(theme.id, profile)
}

/**
 * Returns explicitly opened rooms. Main Hall is always included.
 */
export function getUnlockedThemeIds(
  themes: RoomTheme[],
  profile?: ThemeEntitlementProfile | null,
): string[] {
  const unlocked = new Set(getManorUnlockedRoomIds(profile))
  return themes.filter((theme) => unlocked.has(theme.id)).map((theme) => theme.id)
}

/**
 * Active theme is deliberately separate from entitlement.
 */
export function isThemeActive(
  theme: RoomTheme,
  profile?: ThemeEntitlementProfile | null,
): boolean {
  return profile?.preferred_theme === theme.id
}
