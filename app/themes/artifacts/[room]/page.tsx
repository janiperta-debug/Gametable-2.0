import { notFound } from "next/navigation"
import { ArtifactPageTemplate } from "@/components/artifact-page-template"
import { getRoomThemePage } from "@/lib/room-theme-pages"
import { getArtifactPage, ARTIFACT_PAGES } from "@/lib/artifact-pages"

export function generateStaticParams() {
  return Object.keys(ARTIFACT_PAGES).map((room) => ({ room }))
}

export default async function ArtifactPageRoute({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  const page = getArtifactPage(room)
  const theme = getRoomThemePage(room)
  if (!page || !theme) {
    notFound()
  }
  return <ArtifactPageTemplate theme={theme} page={page} />
}
