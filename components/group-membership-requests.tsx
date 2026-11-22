"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Loader2, Users } from "lucide-react"
import Link from "next/link"
import { reviewGroupMembership } from "@/app/actions/groups"
import { ArchiveCard, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle, ArchiveButton } from "@/components/archive-frame"

export function GroupMembershipRequests({
  groupId,
  requests,
}: {
  groupId: string
  requests: { user_id: string; joined_at: string; username: string | null; display_name: string | null; avatar_url: string | null }[]
}) {
  const router = useRouter()
  const [pendingUser, setPendingUser] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function review(userId: string, approve: boolean) {
    setError("")
    setPendingUser(userId)
    startTransition(async () => {
      const result = await reviewGroupMembership(groupId, userId, approve)
      setPendingUser("")
      if (result.error) {
        setError("Jäsenpyynnön käsittely epäonnistui. Päivitä sivu ja yritä uudelleen.")
        return
      }
      router.refresh()
    })
  }

  if (!requests.length) return null

  return (
    <ArchiveCard className="mb-6">
      <ArchiveCardHeader>
        <ArchiveCardTitle><Users className="mr-2 inline h-5 w-5 text-accent-gold" />Jäsenpyynnöt ({requests.length})</ArchiveCardTitle>
      </ArchiveCardHeader>
      <ArchiveCardContent className="space-y-3">
        {requests.map((request) => (
          <div key={request.user_id} className="flex flex-col gap-3 rounded-lg border border-accent-gold/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {request.avatar_url ? <img src={request.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-gold/10 text-accent-gold"><Users className="h-5 w-5" /></div>}
                <div className="min-w-0">
                  <p className="font-medium">{request.display_name || request.username || "Pelaaja"}</p>
                  {request.username ? <Link href={`/users/${request.username}`} className="text-xs text-muted-foreground hover:text-accent-gold">@{request.username}</Link> : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Pyyntö {new Date(request.joined_at).toLocaleDateString()}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <ArchiveButton type="button" active disabled={isPending} onClick={() => review(request.user_id, true)}>
                {isPending && pendingUser === request.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Hyväksy
              </ArchiveButton>
              <ArchiveButton type="button" disabled={isPending} onClick={() => review(request.user_id, false)}>
                {isPending && pendingUser === request.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Hylkää
              </ArchiveButton>
            </div>
          </div>
        ))}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
