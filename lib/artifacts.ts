import { roomThemes } from "@/lib/room-themes"

/**
 * Artifacts board: a 19-slot grid where each slot is permanently bound to one
 * room. When a room is unlocked, its artifact appears in that slot. The slot
 * order is deliberately scrambled relative to the manor map's floor order so the
 * board feels like a mysterious cabinet of curiosities, not a 1:1 mirror of the
 * map. (e.g. the Main Hall artifact — granted to everyone by default — sits in
 * an "odd" spot rather than first.)
 *
 * Slot order is FIXED (not random at runtime) so every visit looks identical and
 * a given artifact never jumps around between renders.
 */
export const ARTIFACT_SLOT_ORDER: string[] = [
  "observatory",
  "library",
  "treasure-vault",
  "ballroom",
  "conservatory",
  "dungeon",
  "war-room",
  "main-hall", // default artifact, intentionally placed off-center / "strangely"
  "spa",
  "clock-tower",
  "underground-temple",
  "gallery",
  "map-room",
  "alchemist-laboratory",
  "fireside-lounge",
  "theater-room",
  "crystal-cavern",
  "bar",
  "artroom",
]

export interface ArtifactSlot {
  roomId: string
  /** Localized room name fallback (English) — used for alt text/titles. */
  roomName: string
  /** Path to the artifact artwork. */
  image: string
}

/** Returns the 19 artifact slots in their fixed display order. */
export function getArtifactSlots(): ArtifactSlot[] {
  return ARTIFACT_SLOT_ORDER.map((roomId) => {
    const room = roomThemes.find((r) => r.id === roomId)
    return {
      roomId,
      roomName: room?.name ?? roomId,
      image: `/themes/artifacts/${roomId}.png`,
    }
  })
}
