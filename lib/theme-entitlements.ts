import type { RoomTheme } from "@/lib/room-themes"

export interface ThemeEntitlementProfile {
  level?: number | null
  unlocked_themes?: string[] | null
}

/**
 * One source of truth for visual-theme access.
 * Explicit profile grants are respected; otherwise the existing level gate
 * from the room registry is used. Registration alone never grants access.
 */
export function isThemeUnlocked(theme: RoomTheme, profile?: ThemeEntitlementProfile | null): boolean {
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
