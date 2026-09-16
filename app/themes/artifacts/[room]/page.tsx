import { notFound } from "next/navigation"
import { ArtifactPageTemplate } from "@/components/artifact-page-template"
import { TreasureVaultArtifactPage } from "@/components/treasure-vault-artifact-page"
import { getRoomThemePage } from "@/lib/room-theme-pages"
import { CONSERVATORY_THEME_PAGE } from "@/lib/conservatory-theme-page"
import { FIRESIDE_LOUNGE_THEME_PAGE } from "@/lib/fireside-lounge-theme-page"
import { BAR_THEME_PAGE } from "@/lib/bar-theme-page"
import { SPA_THEME_PAGE } from "@/lib/spa-theme-page"
import { GALLERY_THEME_PAGE } from "@/lib/gallery-theme-page"
import { ART_ROOM_THEME_PAGE } from "@/lib/art-room-theme-page"
import { MAP_ROOM_THEME_PAGE } from "@/lib/map-room-theme-page"
import { BALLROOM_THEME_PAGE } from "@/lib/ballroom-theme-page"
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
import { getArtifactPage, ARTIFACT_PAGES } from "@/lib/artifact-pages"

export function generateStaticParams() {
  return [...new Set([
    ...Object.keys(ARTIFACT_PAGES),
    "theater-room", "war-room", "clock-tower", "alchemist-laboratory", "dungeon", "crystal-cavern", "underground-temple", "treasure-vault",
  ])].map((room) => ({ room }))
}

export default async function ArtifactPageRoute({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  const theme = getRoomThemePage(room) ??
    (room === "conservatory" ? CONSERVATORY_THEME_PAGE : room === "fireside-lounge" ? FIRESIDE_LOUNGE_THEME_PAGE : room === "bar" ? BAR_THEME_PAGE : room === "spa" ? SPA_THEME_PAGE : room === "gallery" ? GALLERY_THEME_PAGE : room === "artroom" ? ART_ROOM_THEME_PAGE : room === "map-room" ? MAP_ROOM_THEME_PAGE : room === "ballroom" ? BALLROOM_THEME_PAGE : room === "theater-room" ? THEATER_ROOM_THEME_PAGE : room === "war-room" ? WAR_ROOM_THEME_PAGE : room === "clock-tower" ? CLOCK_TOWER_THEME_PAGE : room === "dungeon" ? DUNGEON_ROOM_THEME_PAGE : room === "crystal-cavern" ? CRYSTAL_CAVERN_ROOM_THEME_PAGE : room === "alchemist-laboratory" ? ALCHEMIST_LABORATORY_THEME_PAGE : room === "underground-temple" ? UNDERGROUND_TEMPLE_ROOM_THEME_PAGE : room === "treasure-vault" ? TREASURE_VAULT_ROOM_THEME_PAGE : undefined)
  if (!theme) notFound()

  if (room === "treasure-vault") {
    return <TreasureVaultArtifactPage theme={theme} page={TREASURE_VAULT_ARTIFACT_PAGE} />
  }

  const page = room === "theater-room" ? THEATER_ROOM_ARTIFACT_PAGE : room === "war-room" ? WAR_ROOM_ARTIFACT_PAGE : room === "clock-tower" ? CLOCK_TOWER_ARTIFACT_PAGE : room === "alchemist-laboratory" ? ALCHEMIST_LABORATORY_ARTIFACT_PAGE : room === "dungeon" ? DUNGEON_ARTIFACT_PAGE : room === "crystal-cavern" ? CRYSTAL_CAVERN_ARTIFACT_PAGE : room === "underground-temple" ? UNDERGROUND_TEMPLE_ARTIFACT_PAGE : getArtifactPage(room)
  if (!page) notFound()
  return <ArtifactPageTemplate theme={theme} page={page} />
}
