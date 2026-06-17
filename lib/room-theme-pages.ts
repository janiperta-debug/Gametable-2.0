/**
 * ROOM THEME PAGES — content data for the per-room theme pages.
 *
 * The VISUAL template is FIXED (see components/room-theme-template.tsx) and is
 * modeled on the Bar mockup — the only mockup that includes an Artefact section.
 * Every room reuses that exact structure; rooms that have no unique artifact
 * copy simply reuse the mention from their artifact page.
 *
 * "Copying & filling a theme" = adding one entry to ROOM_THEME_PAGES below.
 * The base/template never changes.
 *
 * Asset rules (no new art needed):
 *  - crest  = the room's nav home-button crest
 *  - hero   = the room's start-page hero
 *  - glimpses = the room's collection / events / discover heroes
 *  - artifact = /themes/artifacts/{id}.png
 */

export interface JourneyStep {
  /** Short step label, e.g. "Arrival". */
  title: string
  /** One-line description of the step. */
  description: string
}

export interface GlimpseImage {
  /** Image path (reuses an existing hero asset). */
  image: string
  /** Bold caption under the image. */
  caption: string
}

export interface UnlockItem {
  /** What is unlocked, e.g. "Bar Theme". */
  label: string
  /** Short explanation. */
  description: string
}

export interface RoomThemePage {
  /** Room id, matches roomThemes / artifact slot id. */
  id: string
  /** Nav home-button crest for the room. */
  crest: string
  /** Start-page hero image. */
  hero: string
  /** Display title, e.g. "Main Hall". */
  title: string
  /** Italic tagline beneath the title. */
  tagline: string

  /** Left column heading, e.g. "The Main Hall". */
  storyTitle: string
  /** Story paragraphs (each rendered as its own block). */
  storyParagraphs: string[]
  /** "The Essence" one-line italic theme. */
  essenceTagline: string
  /** "The Essence" body lines. */
  essenceText: string[]

  /** "Your Journey in This Room" — exactly 10 steps. */
  journey: JourneyStep[]

  /** "A Glimpse Inside" — exactly 3 images. */
  glimpses: GlimpseImage[]

  /** Artefact section (mention pulled from the room's artifact page). */
  artifact: {
    name: string
    image: string
    description: string[]
  }

  /** "What Unlocks" list. */
  unlocks: UnlockItem[]

  /** Themed closing line shown in the footer band. */
  footerLine: string
}

export const ROOM_THEME_PAGES: Record<string, RoomThemePage> = {
  "main-hall": {
    id: "main-hall",
    crest: "/images/mainhall-crest-original.png",
    hero: "/images/themes/main-hall-hero.jpg",
    title: "Main Hall",
    tagline: "Every journey begins where you first step in.",

    storyTitle: "The Main Hall",
    storyParagraphs: [
      "Every door you open. Every room you enter. Every choice you make. It all begins here.",
      "This is the heart of the Manor. From here, your path unfolds in countless ways.",
      "Take a moment. Look around. Your story is ready to begin.",
    ],
    essenceTagline: "Choice creates your journey.",
    essenceText: ["The Main Hall is not just a place.", "It is a beginning.", "It is your invitation."],

    journey: [
      { title: "Arrival", description: "You step into something greater." },
      { title: "Orientation", description: "You take it all in." },
      { title: "Possibility", description: "Paths reveal themselves." },
      { title: "Intention", description: "You set your direction." },
      { title: "First Steps", description: "You begin your journey." },
      { title: "Exploration", description: "You discover new doors." },
      { title: "Growth", description: "You change along the way." },
      { title: "Purpose", description: "You understand why you came." },
      { title: "Impact", description: "Your journey shapes you." },
      { title: "Legacy", description: "Your story becomes part of the Manor." },
    ],

    glimpses: [
      { image: "/images/heroes/collection/main-hall.jpg", caption: "The Grand Staircase" },
      { image: "/images/heroes/events/main-hall.jpg", caption: "The Welcome Gallery" },
      { image: "/images/heroes/discover/main-hall.jpg", caption: "The Central Foyer" },
    ],

    artifact: {
      name: "The First Fragment",
      image: "/themes/artifacts/main-hall.png",
      description: [
        "A small metal fragment bearing the seal of the Manor.",
        "Its purpose is unknown.",
        "Every guest receives one upon entering.",
      ],
    },

    unlocks: [
      { label: "Main Hall Theme", description: "Full visual theme for the GameTable" },
      { label: "10 Unique Room Screens", description: "A complete journey through the Manor" },
      { label: "Story Chronicle", description: "Your story becomes part of the Manor" },
      { label: "Achievement Path", description: "Milestones, challenges & rewards" },
      { label: "Lore Entry", description: "Added to your Manor Library" },
    ],

    footerLine: "No two journeys are the same. But every journey starts here.",
  },
}

export function getRoomThemePage(roomId: string): RoomThemePage | undefined {
  return ROOM_THEME_PAGES[roomId]
}
