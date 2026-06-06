import type { AppThemeName } from "@/components/app-theme-provider"

/**
 * THEME RE-IMAGINE — centralized image asset resolver.
 *
 * Moves the per-theme visual identity from flat CSS colors to imagery.
 * All hero/button-frame path logic lives here so rolling the pattern out to a
 * new page is just: add image files + pass a new `page` key.
 *
 * Fallback philosophy mirrors the existing nav frame logic in navigation.tsx:
 * an unknown/missing theme falls back to "main-hall", and a missing per-page
 * hero falls back to that theme's main/home hero, then to a known-good image.
 */

// Existing main/home heroes live at /images/heroes/{theme}-hero.jpg.
// These currently exist on disk (others fall back to library).
const EXISTING_MAIN_HEROES = new Set<string>([
  "bar",
  "conservatory",
  "fireside-lounge",
  "gallery",
  "library",
  "spa",
])

// Final safety net — an image we know exists in the repo.
const FALLBACK_HERO = "/images/heroes/library-hero.jpg"

/**
 * Resolve the hero image for a given page + theme.
 *
 * Resolution order:
 *  1. /images/heroes/{page}/{theme}.jpg     (new per-page, per-theme hero)
 *  2. /images/heroes/{theme}-hero.jpg       (existing main/home hero for theme)
 *  3. /images/heroes/library-hero.jpg       (known-good fallback)
 *
 * NOTE: Because the browser can't "try the next file on 404" without an
 * onError handler, callers that want graceful per-page fallback should pass the
 * result of `getPageHeroCandidates` to an <img onError> chain. `getPageHero`
 * returns the single best *known-to-exist* path for SSR/no-JS safety.
 */
export function getPageHeroCandidates(page: string, theme: AppThemeName | string): string[] {
  const safeTheme = (theme || "main-hall") as string
  const candidates = [
    `/images/heroes/${page}/${safeTheme}.jpg`,
    EXISTING_MAIN_HEROES.has(safeTheme) ? `/images/heroes/${safeTheme}-hero.jpg` : "",
    FALLBACK_HERO,
  ].filter(Boolean) as string[]
  // De-duplicate while preserving order
  return Array.from(new Set(candidates))
}

/**
 * Single best-known path for a page hero. Use together with an onError handler
 * (see ThemeHero) so the per-page image is attempted first and we degrade to a
 * file that definitely exists.
 */
export function getPageHero(page: string, theme: AppThemeName | string): string {
  return getPageHeroCandidates(page, theme)[0]
}

// Per-theme button frame art. Only main-hall art exists today; every theme
// falls back to it, matching current navigation behavior. Extend this map as
// per-theme button PNGs are supplied.
const BUTTON_FRAMES: Record<string, string> = {
  "main-hall": "/images/nav-frames/main-hall-button.png",
}

const BUTTON_FRAMES_ROUND: Record<string, string> = {
  "main-hall": "/images/nav-frames/main-hall-button-round.png",
}

/** Rectangular gold frame for label buttons (matches desktop nav). */
export function getButtonFrame(theme: AppThemeName | string): string {
  return BUTTON_FRAMES[theme as string] || BUTTON_FRAMES["main-hall"]
}

/** Round/square gold frame for icon buttons (matches desktop nav). */
export function getButtonRoundFrame(theme: AppThemeName | string): string {
  return BUTTON_FRAMES_ROUND[theme as string] || BUTTON_FRAMES_ROUND["main-hall"]
}
