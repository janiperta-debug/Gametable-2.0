"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Users } from "lucide-react"
import { acceptGroupInvite } from "@/app/actions/groups"
import { ArchiveCardButton } from "@/components/archive-frame"

export function GroupInviteAccept({ token }: { token: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  function accept() {
    setError("")
    startTransition(async () => {
      const result = await acceptGroupInvite(token)
      if (result.error || !result.groupId) {
        setError("Kutsu ei ole enää voimassa. Pyydä ryhmän ylläpitäjältä uusi linkki.")
        return
      }
      router.push(`/groups/${result.groupId}`)
      router.refresh()
    })
  }
  return (
    <div className="space-y-2">
      <ArchiveCardButton active onClick={accept} disabled={pending}>
        {pending ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <Users className="mr-2 inline h-4 w-4" />}
        Liity ryhmään
      </ArchiveCardButton>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
