/**
 * Canonical room IDs used by theme preview and artifact routes.
 * Keep this list as the single source of truth for route generation.
 */
export const ROOM_IDS = [
  "main-hall",
  "library",
  "conservatory",
  "fireside-lounge",
  "spa",
  "bar",
  "gallery",
  "ballroom",
  "map-room",
  "observatory",
  "theater-room",
  "clock-tower",
  "war-room",
  "artroom",
  "alchemist-laboratory",
  "dungeon",
  "underground-temple",
  "crystal-cavern",
  "treasure-vault",
] as const

export type RoomId = (typeof ROOM_IDS)[number]
