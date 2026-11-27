"use client"

import { useState } from "react"
import { ArchiveCard, ArchiveCardButton, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2, Users } from "lucide-react"
import { confirmCampaign } from "@/app/actions/campaign-lifecycle"

export function CampaignSetupPanel({
  eventId,
  status,
  onConfirmed,
}: {
  eventId: string
  status: "setup" | "confirmed" | null | undefined
  onConfirmed: (confirmedAt?: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const isConfirmed = status === "confirmed"

  const handleConfirm = async () => {
    if (busy || isConfirmed) return
    if (!window.confirm("Vahvistetaanko kampanja? Kampanja tulee näkyviin osallistujille, ja kutsutut voivat liittyä mukaan.")) return
    setBusy(true)
    setError("")
    try {
      const result = await confirmCampaign(eventId)
      if (!result.success) throw new Error(result.error || "Kampanjan vahvistaminen epäonnistui.")
      onConfirmed(result.confirmedAt)
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Kampanjan vahvistaminen epäonnistui.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <ArchiveCard>
      <ArchiveCardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ArchiveCardTitle className="text-xl normal-case">Kampanjan perustaminen</ArchiveCardTitle>
          <Badge variant="outline" className={isConfirmed ? "border-green-600/40 text-green-500" : "border-accent-gold/30 text-accent-gold"}>
            {isConfirmed ? "Vahvistettu" : "Luonnos"}
          </Badge>
        </div>
      </ArchiveCardHeader>
      <ArchiveCardContent className="space-y-3">
        {isConfirmed ? (
          <>
            <div className="flex items-start gap-2 text-sm text-green-500">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Kampanja on vahvistettu. Se näkyy osallistujille, ja kampanjan työskentely voi alkaa.</p>
            </div>
            {status === "confirmed" && (
              <p className="text-xs text-muted-foreground">Voit edelleen hallita osallistujia, pelikertoja ja kampanjan tietopankkia.</p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Kampanja on vielä luonnos. Tarkista perustiedot, kutsu osallistujat ja vahvista kampanja, kun olet valmis aloittamaan.
            </p>
            <ArchiveCardButton fullWidth onClick={() => document.getElementById("campaign-participants")?.scrollIntoView({ behavior: "smooth", block: "center" })} icon={<Users className="h-4 w-4" />}>
              Siirry kutsumaan osallistujia
            </ArchiveCardButton>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <ArchiveCardButton fullWidth active disabled={busy} onClick={handleConfirm} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}>
              {busy ? "Vahvistetaan…" : "Vahvista kampanja"}
            </ArchiveCardButton>
            <p className="text-xs text-muted-foreground">Vahvistaminen ei päätä kampanjaa. Se ainoastaan julkaisee sen osallistujille.</p>
          </>
        )}
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
