"use client"

import { useState, useTransition } from "react"
import { Link2, Copy, RefreshCw, Loader2 } from "lucide-react"
import { createGroupInviteLink } from "@/app/actions/groups"
import { ArchiveCard, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle, ArchiveCardButton } from "@/components/archive-frame"

export function GroupInviteLink({ groupId, initialToken }: { groupId: string; initialToken: string | null }) {
  const [token, setToken] = useState(initialToken)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const inviteUrl = token && typeof window !== "undefined"
    ? `${window.location.origin}/groups/invite/${token}`
    : ""

  function createLink() {
    setError("")
    startTransition(async () => {
      const result = await createGroupInviteLink(groupId)
      if (result.error || !result.token) {
        setError("Kutsulinkin luominen epäonnistui.")
        return
      }
      setToken(result.token)
    })
  }

  async function copyLink() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
    } catch {
      setError("Linkin kopiointi ei onnistunut. Yritä uudelleen.")
    }
  }

  return (
    <ArchiveCard className="mb-6">
      <ArchiveCardHeader><ArchiveCardTitle>Kutsu uusia jäseniä</ArchiveCardTitle></ArchiveCardHeader>
      <ArchiveCardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Luo ryhmälle jaettava kutsulinkki. Kuka tahansa linkin saanut voi liittyä ryhmään GameTable-tilillä.</p>
        {token ? (
          <div className="space-y-2">
            <div className="break-all rounded-md border border-accent-gold/20 bg-background/40 p-3 text-sm">{inviteUrl}</div>
            <div className="flex flex-wrap gap-2">
              <ArchiveCardButton active onClick={copyLink}><Copy className="mr-2 h-4 w-4 inline" />{copied ? "Kopioitu" : "Kopioi linkki"}</ArchiveCardButton>
              <ArchiveCardButton onClick={createLink} disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 inline animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4 inline" />}
                Uusi linkki
              </ArchiveCardButton>
            </div>
            <p className="text-xs text-muted-foreground">Uuden linkin luominen mitätöi aiemman linkin.</p>
          </div>
        ) : (
          <ArchiveCardButton active onClick={createLink} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 inline animate-spin" /> : <Link2 className="mr-2 h-4 w-4 inline" />}
            Luo kutsulinkki
          </ArchiveCardButton>
        )}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
