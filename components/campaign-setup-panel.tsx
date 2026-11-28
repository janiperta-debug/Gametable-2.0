"use client"

import { useState } from "react"
import { ArchiveCardButton } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2, Users, Flag } from "lucide-react"
import { confirmCampaign, finishCampaign } from "@/app/actions/campaign-lifecycle"

export function CampaignSetupPanel({
  eventId,
  status,
  eventStatus,
  onConfirmed,
  onCompleted,
}: {
  eventId: string
  status: "setup" | "confirmed" | null | undefined
  eventStatus: string
  onConfirmed: (confirmedAt?: string) => void
  onCompleted: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const isConfirmed = status === "confirmed"
  const isCompleted = eventStatus === "completed"

  const handleConfirm = async () => {
    if (busy || isConfirmed || isCompleted) return
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

  const handleFinish = async () => {
    if (busy || isCompleted) return
    if (!window.confirm("Päätetäänkö kampanja? Kampanja merkitään päättyneeksi, mutta sen tiedot, hahmot ja pelikerrat säilyvät tarkasteltavina.")) return
    setBusy(true)
    setError("")
    try {
      const result = await finishCampaign(eventId)
      if (!result.success) throw new Error(result.error || "Kampanjan päättäminen epäonnistui.")
      onCompleted()
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : "Kampanjan päättäminen epäonnistui.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      {isCompleted ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Kampanja on päättynyt. Sen tiedot ja pelikerrat säilyvät tarkasteltavina.</p>
          </div>
          <Badge variant="outline">Päättynyt</Badge>
        </div>
      ) : isConfirmed ? (
        <>
          <div className="flex items-start gap-2 text-sm text-green-500">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Kampanja on vahvistettu. Se näkyy osallistujille, ja kampanjan työskentely voi alkaa.</p>
          </div>
          <p className="text-xs text-muted-foreground">Voit edelleen hallita osallistujia, pelikertoja ja kampanjan tietopankkia.</p>
          <div className="border-t border-accent-gold/20 pt-3">
            <p className="mb-2 text-sm text-muted-foreground">Kun kampanja on pelattu loppuun, voit päättää sen tästä. Päättäminen ei poista kampanjan tietoja.</p>
            <ArchiveCardButton fullWidth active disabled={busy} onClick={handleFinish} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}>
              {busy ? "Päätetään…" : "Päätä kampanja"}
            </ArchiveCardButton>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Kampanja on vielä luonnos. Tarkista perustiedot, kutsu osallistujat ja vahvista kampanja, kun olet valmis aloittamaan.
          </p>
          <ArchiveCardButton fullWidth onClick={() => document.getElementById("campaign-participants")?.scrollIntoView({ behavior: "smooth", block: "center" })} icon={<Users className="h-4 w-4" />}>
            Siirry kutsumaan osallistujia
          </ArchiveCardButton>
          <ArchiveCardButton fullWidth active disabled={busy} onClick={handleConfirm} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}>
            {busy ? "Vahvistetaan…" : "Vahvista kampanja"}
          </ArchiveCardButton>
          <p className="text-xs text-muted-foreground">Vahvistaminen ei päätä kampanjaa. Se ainoastaan julkaisee sen osallistujille.</p>
        </>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
