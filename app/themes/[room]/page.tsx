import "../conservatory-materials.module.css"
import "../theme-page-background.css"
import "../gallery-materials.css"
import "../artroom-materials.css"
import "../ballroom-materials.css"
import "../map-room-materials.css"
import "../theater-room-materials.css"
import "../war-room-materials.css"
import "../clock-tower-materials.css"
import "../dungeon-room-materials.css"
import "../crystal-cavern-room-materials.css"
import "../alchemist-laboratory-materials.css"
import "../underground-temple-room-materials.css"
import { notFound } from "next/navigation"
import { RoomThemeTemplate } from "@/components/room-theme-template"
import { getRoomThemePage, ROOM_THEME_PAGES } from "@/lib/room-theme-pages"
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

export function generateStaticParams() {
  return [...Object.keys(ROOM_THEME_PAGES), "conservatory", "fireside-lounge", "spa", "bar", "gallery", "artroom", "ballroom", "map-room", "theater-room", "war-room", "clock-tower", "dungeon", "crystal-cavern", "alchemist-laboratory", "underground-temple"].map((room) => ({ room }))
}

export default async function RoomThemePageRoute({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  const data =
    room === "artroom"
      ? ART_ROOM_THEME_PAGE
      : room === "conservatory"
        ? CONSERVATORY_THEME_PAGE
        : room === "fireside-lounge"
          ? FIRESIDE_LOUNGE_THEME_PAGE
          : room === "spa"
            ? SPA_THEME_PAGE
            : room === "bar"
              ? BAR_THEME_PAGE
              : room === "gallery"
                ? GALLERY_THEME_PAGE
                : room === "ballroom"
                  ? BALLROOM_THEME_PAGE
                  : room === "map-room"
                    ? MAP_ROOM_THEME_PAGE
                    : room === "theater-room"
                      ? THEATER_ROOM_THEME_PAGE
                      : room === "war-room"
                        ? WAR_ROOM_THEME_PAGE
                        : room === "clock-tower"
                          ? CLOCK_TOWER_THEME_PAGE
                          : room === "dungeon"
                            ? DUNGEON_ROOM_THEME_PAGE
                            : room === "crystal-cavern"
                              ? CRYSTAL_CAVERN_ROOM_THEME_PAGE
                              : room === "alchemist-laboratory"
                                ? ALCHEMIST_LABORATORY_THEME_PAGE
                                : room === "underground-temple"
                                  ? UNDERGROUND_TEMPLE_ROOM_THEME_PAGE
                                  : getRoomThemePage(room)
  if (!data) notFound()
  return <RoomThemeTemplate data={data} />
}
