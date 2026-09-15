import { notFound } from "next/navigation"
import { ArtifactPageTemplate } from "@/components/artifact-page-template"
import { getRoomThemePage } from "@/lib/room-theme-pages"
import { CONSERVATORY_THEME_PAGE } from "@/lib/conservatory-theme-page"
import { FIRESIDE_LOUNGE_THEME_PAGE } from "@/lib/fireside-lounge-theme-page"
import { BAR_THEME_PAGE } from "@/lib/bar-theme-page"
import { SPA_THEME_PAGE } from "@/lib/spa-theme-page"
import { GALLERY_THEME_PAGE } from "@/lib/gallery-theme-page"
import { ART_ROOM_THEME_PAGE } from "@/lib/art-room-theme-page"
import { getArtifactPage, ARTIFACT_PAGES } from "@/lib/artifact-pages"

export function generateStaticParams() {
  return Object.keys(ARTIFACT_PAGES).map((room) => ({ room }))
}

export default async function ArtifactPageRoute({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  const page = getArtifactPage(room)
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
                : undefined)
  if (!page || !theme) {
    notFound()
  }
  return <ArtifactPageTemplate theme={theme} page={page} />
}
