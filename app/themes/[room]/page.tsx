import { notFound } from "next/navigation"
import { RoomThemeTemplate } from "@/components/room-theme-template"
import { getRoomThemePage, ROOM_THEME_PAGES } from "@/lib/room-theme-pages"

export function generateStaticParams() {
  return Object.keys(ROOM_THEME_PAGES).map((room) => ({ room }))
}

export default async function RoomThemePageRoute({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  const data = getRoomThemePage(room)
  if (!data) {
    notFound()
  }
  return <RoomThemeTemplate data={data} />
}
