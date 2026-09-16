import { notFound } from "next/navigation"
import { ArtifactPageTemplate } from "@/components/artifact-page-template"
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
import { THEATER_ROOM_ARTIFACT_PAGE } from "@/lib/theater-room-artifact-page"
import { WAR_ROOM_ARTIFACT_PAGE } from "@/lib/war-room-artifact-page"
import { CLOCK_TOWER_ARTIFACT_PAGE } from "@/lib/clock-tower-artifact-page"
import { ALCHEMIST_LABORATORY_ARTIFACT_PAGE } from "@/lib/alchemist-laboratory-artifact-page"
import { DUNGEON_ARTIFACT_PAGE } from "@/lib/dungeon-artifact-page"
import { getArtifactPage, ARTIFACT_PAGES } from "@/lib/artifact-pages"

export function generateStaticParams() {
  return [...new Set([...Object.keys(ARTIFACT_PAGES), "theater-room", "war-room", "clock-tower", "alchemist-laboratory", "dungeon"])].map((room) => ({ room }))
}

export default async function ArtifactPageRoute({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  const page =
    room === "theater-room"
      ? THEATER_ROOM_ARTIFACT_PAGE
      : room === "war-room"
        ? WAR_ROOM_ARTIFACT_PAGE
        : room === "clock-tower"
          ? CLOCK_TOWER_ARTIFACT_PAGE
          : room === "alchemist-laboratory"
            ? ALCHEMIST_LABORATORY_ARTIFACT_PAGE
            : room === "dungeon"
              ? DUNGEON_ARTIFACT_PAGE
              : getArtifactPage(room)
  const theme =
    getRoomThemePage(room) ??
    (room === "conservatory"
      ? CONSERVATORY_THEME_PAGE
      : room === "fireside-lounge"
        ? FIRESIDE_LOUNGE_THEME_PAGE
        : room === "bar"
          ? BAR_THEME_PAGE
          : room === "spa"
            ? SPA_THEME_PAGE
            : room === "gallery"
              ? GALLERY_THEME_PAGE
              : room === "artroom"
                ? ART_ROOM_THEME_PAGE
                : room === "map-room"
                  ? MAP_ROOM_THEME_PAGE
                  : room === "ballroom"
                    ? BALLROOM_THEME_PAGE
                    : room === "theater-room"
                      ? THEATER_ROOM_THEME_PAGE
                      : undefined)
  if (!page || !theme) {
    notFound()
  }
  return <ArtifactPageTemplate theme={theme} page={page} />
}
