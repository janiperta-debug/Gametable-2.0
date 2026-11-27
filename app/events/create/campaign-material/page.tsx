"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArchiveCard, ArchiveCardButton, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle } from "@/components/archive-frame"
import { CampaignImportPanel } from "@/components/campaign-import-panel"
import { createCampaignImportDraft } from "@/app/actions/campaign-import"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function CreateCampaignFromMaterialPage() {
  const router = useRouter()
  const [eventId, setEventId] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    createCampaignImportDraft().then((result) => {
      if (!active) return
      if (result.success) setEventId(result.eventId)
      else setError(result.error)
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : "Kampanjan valmistelun aloitus epäonnistui.")
    }).finally(() => {
      if (active) setBusy(false)
    })
    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <ArchiveCardButton onClick={() => router.back()} icon={<ArrowLeft className="h-4 w-4" />}>
            Takaisin
          </ArchiveCardButton>
        </div>

        {eventId ? (
          <CampaignImportPanel eventId={eventId} />
        ) : busy ? (
          <ArchiveCard>
            <ArchiveCardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Avataan kampanjan aineiston tuontia…
            </ArchiveCardContent>
          </ArchiveCard>
        ) : (
          <ArchiveCard>
            <ArchiveCardContent className="space-y-3 py-6">
              <p role="alert" className="text-sm text-destructive">{error || "Kampanjan valmistelun avaaminen epäonnistui."}</p>
              <ArchiveCardButton onClick={() => router.back()} icon={<ArrowLeft className="h-4 w-4" />}>Takaisin</ArchiveCardButton>
            </ArchiveCardContent>
          </ArchiveCard>
        )}
      </main>
    </div>
  )
}
