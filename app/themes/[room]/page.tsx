import "../conservatory-materials.module.css"
import "../theme-page-background.css"
import "../main-hall-materials.css"
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
import "../treasure-vault-room-materials.css"
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
