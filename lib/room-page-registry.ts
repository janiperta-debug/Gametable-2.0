import { ROOM_IDS, type RoomId } from "@/lib/room-registry"
import { ROOM_THEME_PAGES } from "@/lib/room-theme-pages"
import { ART_ROOM_THEME_PAGE } from "@/lib/art-room-theme-page"
import { CONSERVATORY_THEME_PAGE } from "@/lib/conservatory-theme-page"
import { FIRESIDE_LOUNGE_THEME_PAGE } from "@/lib/fireside-lounge-theme-page"
import { SPA_THEME_PAGE } from "@/lib/spa-theme-page"
import { BAR_THEME_PAGE } from "@/lib/bar-theme-page"
import { GALLERY_THEME_PAGE } from "@/lib/gallery-theme-page"
import { BALLROOM_THEME_PAGE } from "@/lib/ballroom-theme-page"
import { MAP_ROOM_THEME_PAGE } from "@/lib/map-room-theme-page"
import { THEATER_ROOM_THEME_PAGE } from "@/lib/theater-room-theme-page"
import { WAR_ROOM_THEME_PAGE } from "@/lib/war-room-theme-page"
import { CLOCK_TOWER_THEME_PAGE } from "@/lib/clock-tower-theme-page"
import { DUNGEON_ROOM_THEME_PAGE } from "@/lib/dungeon-room-theme-page"
import { CRYSTAL_CAVERN_ROOM_THEME_PAGE } from "@/lib/crystal-cavern-room-theme-page"
import { ALCHEMIST_LABORATORY_THEME_PAGE } from "@/lib/alchemist-laboratory-theme-page"
import { UNDERGROUND_TEMPLE_ROOM_THEME_PAGE } from "@/lib/underground-temple-room-theme-page"
import { TREASURE_VAULT_ROOM_THEME_PAGE } from "@/lib/treasure-vault-room-theme-page"
import { THEATER_ROOM_ARTIFACT_PAGE } from "@/lib/theater-room-artifact-page"
import { WAR_ROOM_ARTIFACT_PAGE } from "@/lib/war-room-artifact-page"
import { CLOCK_TOWER_ARTIFACT_PAGE } from "@/lib/clock-tower-artifact-page"
import { ALCHEMIST_LABORATORY_ARTIFACT_PAGE } from "@/lib/alchemist-laboratory-artifact-page"
import { DUNGEON_ARTIFACT_PAGE } from "@/lib/dungeon-artifact-page"
import { CRYSTAL_CAVERN_ARTIFACT_PAGE } from "@/lib/crystal-cavern-artifact-page"
import { UNDERGROUND_TEMPLE_ARTIFACT_PAGE } from "@/lib/underground-temple-artifact-page"
import { TREASURE_VAULT_ARTIFACT_PAGE } from "@/lib/treasure-vault-artifact-page"
import { getArtifactPage } from "@/lib/artifact-pages"

const withArtifactName = (page: (typeof ROOM_THEME_PAGES)[keyof typeof ROOM_THEME_PAGES], name: { fi: string; en: string }) => ({
  ...page,
  artifact: {
    ...page.artifact,
    name,
  },
})

export const ROOM_THEME_PAGE_BY_ID = {
  ...ROOM_THEME_PAGES,
  artroom: ART_ROOM_THEME_PAGE,
  conservatory: CONSERVATORY_THEME_PAGE,
  "fireside-lounge": FIRESIDE_LOUNGE_THEME_PAGE,
  spa: SPA_THEME_PAGE,
  bar: BAR_THEME_PAGE,
  gallery: GALLERY_THEME_PAGE,
  ballroom: BALLROOM_THEME_PAGE,
  "map-room": MAP_ROOM_THEME_PAGE,
  "theater-room": THEATER_ROOM_THEME_PAGE,
  "war-room": withArtifactName(WAR_ROOM_THEME_PAGE, { fi: "Komentajan muistio", en: "Commander’s Brief" }),
  "clock-tower": withArtifactName(CLOCK_TOWER_THEME_PAGE, { fi: "Kellosepän muistiinpanot", en: "Clockmaker’s Notes" }),
  dungeon: withArtifactName(DUNGEON_ROOM_THEME_PAGE, { fi: "Seikkailijan vala", en: "Adventurer's Oath" }),
  "crystal-cavern": withArtifactName(CRYSTAL_CAVERN_ROOM_THEME_PAGE, { fi: "Tutkijan päiväkirja", en: "Explorer's Journal" }),
  "alchemist-laboratory": ALCHEMIST_LABORATORY_THEME_PAGE,
  "underground-temple": withArtifactName(UNDERGROUND_TEMPLE_ROOM_THEME_PAGE, { fi: "Temppelin kirjoitus", en: "Temple Inscription" }),
  "treasure-vault": withArtifactName(TREASURE_VAULT_ROOM_THEME_PAGE, { fi: "Palautettu holvin avain", en: "The Restored Vault Key" }),
} as const

export const ARTIFACT_PAGE_BY_ID = {
  "theater-room": THEATER_ROOM_ARTIFACT_PAGE,
  "war-room": WAR_ROOM_ARTIFACT_PAGE,
  "clock-tower": CLOCK_TOWER_ARTIFACT_PAGE,
  "alchemist-laboratory": ALCHEMIST_LABORATORY_ARTIFACT_PAGE,
  dungeon: DUNGEON_ARTIFACT_PAGE,
  "crystal-cavern": CRYSTAL_CAVERN_ARTIFACT_PAGE,
  "underground-temple": UNDERGROUND_TEMPLE_ARTIFACT_PAGE,
  "treasure-vault": TREASURE_VAULT_ARTIFACT_PAGE,
} as const

export function getRegisteredRoomThemePage(roomId: string) {
  return ROOM_THEME_PAGE_BY_ID[roomId as keyof typeof ROOM_THEME_PAGE_BY_ID]
}

export function getRegisteredArtifactPage(roomId: string) {
  return ARTIFACT_PAGE_BY_ID[roomId as keyof typeof ARTIFACT_PAGE_BY_ID] ?? getArtifactPage(roomId)
}

/** Centralized hero and crest asset access for every registered room. */
export function getRoomThemeAssets(roomId: string) {
  const page = getRegisteredRoomThemePage(roomId)
  return {
    hero: page?.hero ?? "/placeholder.svg",
    crest: page?.crest ?? "/placeholder.svg",
  }
}

/** Review helpers: expose incomplete registrations without changing runtime behavior. */
export function getMissingRoomThemePageIds(): RoomId[] {
  return ROOM_IDS.filter((roomId) => !getRegisteredRoomThemePage(roomId))
}

export function getMissingArtifactPageIds(): RoomId[] {
  return ROOM_IDS.filter((roomId) => !getRegisteredArtifactPage(roomId))
}
