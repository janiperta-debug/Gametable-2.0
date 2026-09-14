import "../conservatory-materials.module.css"
import "../theme-page-background.css"
import { notFound } from "next/navigation"
import { RoomThemeTemplate } from "@/components/room-theme-template"
import { getRoomThemePage, ROOM_THEME_PAGES } from "@/lib/room-theme-pages"
import { CONSERVATORY_THEME_PAGE } from "@/lib/conservatory-theme-page"
import { FIRESIDE_LOUNGE_THEME_PAGE } from "@/lib/fireside-lounge-theme-page"
import { SPA_THEME_PAGE } from "@/lib/spa-theme-page"

export function generateStaticParams() {
  return [...Object.keys(ROOM_THEME_PAGES), "conservatory", "fireside-lounge", "spa"].map((room) => ({ room }))
}

export default async function RoomThemePageRoute({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  const data =
    room === "conservatory"
      ? CONSERVATORY_THEME_PAGE
      : room === "fireside-lounge"
        ? FIRESIDE_LOUNGE_THEME_PAGE
        : room === "spa"
          ? SPA_THEME_PAGE
          : getRoomThemePage(room)
  if (!data) {
    notFound()
  }
  return <RoomThemeTemplate data={data} />
}
