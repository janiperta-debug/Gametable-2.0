import type { RoomTheme } from "@/lib/room-themes"

export interface ThemeEntitlementProfile {
  level?: number | null
  unlocked_themes?: string[] | null
}

// Temporary QA switch for the theme/background verification pass.
// Set this back to false when visual testing is complete to restore XP-based access.
export const THEME_ACCESS_TEST_MODE = true

/**
 * One source of truth for visual-theme access.
 * During QA every theme is selectable; normal XP and explicit grants remain
 * below and are restored by switching THEME_ACCESS_TEST_MODE to false.
 */
export function isThemeUnlocked(theme: RoomTheme, profile?: ThemeEntitlementProfile | null): boolean {
  if (THEME_ACCESS_TEST_MODE) return true
  if (theme.id === "main-hall") return true

  const explicitGrants = profile?.unlocked_themes ?? []
  if (explicitGrants.includes(theme.id)) return true

  return (profile?.level ?? 1) >= theme.unlockLevel
}

export function getUnlockedThemeIds(
  themes: RoomTheme[],
  profile?: ThemeEntitlementProfile | null,
): string[] {
  return themes.filter((theme) => isThemeUnlocked(theme, profile)).map((theme) => theme.id)
}
