"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArchiveCard, ArchiveCardButton, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle } from "@/components/archive-frame"
import { CampaignImportPanel } from "@/components/campaign-import-panel"
import { createCampaignImportDraft } from "@/app/actions/campaign-import"
import { ArrowLeft, BookOpen, FilePlus2, Loader2 } from "lucide-react"

export default function CreateCampaignFromMaterialPage() {
  const router = useRouter()
  const [eventId, setEventId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const startImport = async () => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const result = await createCampaignImportDraft()
      if (!result.success) throw new Error(result.error)
      setEventId(result.eventId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kampanjan valmistelun aloitus epäonnistui.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <ArchiveCardButton onClick={() => router.back()} icon={<ArrowLeft className="h-4 w-4" />}>
            Takaisin
          </ArchiveCardButton>
        </div>

        {!eventId ? (
          <ArchiveCard>
            <ArchiveCardHeader>
              <ArchiveCardTitle className="text-2xl normal-case">Luo kampanja materiaalista</ArchiveCardTitle>
            </ArchiveCardHeader>
            <ArchiveCardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Lisää valmis kampanjamateriaali. GameTable tunnistaa siitä kampanjan tiedot ja auttaa muodostamaan
                nimen, kuvauksen, pelijärjestelmän, henkilöt, paikat, tehtävät ja sessiorungon.
              </p>
              <div className="rounded-md border border-accent-gold/20 bg-background/20 p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-1 h-5 w-5 shrink-0 text-accent-gold" />
                  <div className="space-y-1">
                    <p className="font-medium text-accent-gold">Ensin aineisto, sitten kampanja</p>
                    <p className="text-sm text-muted-foreground">
                      Aluksi luodaan vain yksityinen valmistelupohja, jotta tiedostot voidaan tallentaa turvallisesti.
                      Kampanjan varsinaiset tiedot muodostetaan myöhemmin tunnistetun aineiston ja sinun hyväksyntäsi perusteella.
                    </p>
                  </div>
                </div>
              </div>
              <ArchiveCardButton onClick={startImport} active fullWidth disabled={busy} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}>
                {busy ? "Valmistellaan…" : "Aloita ja lisää kampanjamateriaali"}
              </ArchiveCardButton>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </ArchiveCardContent>
          </ArchiveCard>
        ) : (
          <CampaignImportPanel eventId={eventId} />
        )}
      </main>
    </div>
  )
}
