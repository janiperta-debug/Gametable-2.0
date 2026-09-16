import { notFound } from "next/navigation"
import { ArtifactPageTemplate } from "@/components/artifact-page-template"
import { TreasureVaultArtifactPage } from "@/components/treasure-vault-artifact-page"
import { ROOM_IDS } from "@/lib/room-registry"
import { getRegisteredRoomThemePage, getRegisteredArtifactPage } from "@/lib/room-page-registry"

export function generateStaticParams() {
  return ROOM_IDS.map((room) => ({ room }))
}

export default async function ArtifactPageRoute({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  const theme = getRegisteredRoomThemePage(room)

  if (!theme) notFound()

  if (room === "treasure-vault") {
    return <TreasureVaultArtifactPage theme={theme} page={getRegisteredArtifactPage(room)} />
  }

  const page = getRegisteredArtifactPage(room)
  if (!page) notFound()
  return <ArtifactPageTemplate theme={theme} page={page} />
}
