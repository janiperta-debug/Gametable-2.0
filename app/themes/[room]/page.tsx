import "../conservatory-materials.module.css"
import { notFound } from "next/navigation"
import { RoomThemeTemplate } from "@/components/room-theme-template"
import { ROOM_IDS } from "@/lib/room-registry"
import { getRegisteredRoomThemePage } from "@/lib/room-page-registry"

export function generateStaticParams() {
  return ROOM_IDS.map((room) => ({ room }))
}

export default async function RoomThemePageRoute({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  const data = getRegisteredRoomThemePage(room)

  if (!data) notFound()
  return <RoomThemeTemplate data={data} />
}
