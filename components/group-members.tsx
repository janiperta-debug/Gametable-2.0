"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Crown, Shield, Users, UserMinus, Loader2 } from "lucide-react"
import { manageGroupMember } from "@/app/actions/groups"
import { ArchiveCard, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle, ArchiveButton } from "@/components/archive-frame"

type Member = {
  user_id: string
  role: "founder" | "admin" | "member"
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export function GroupMembers({
  groupId,
  members,
  viewerRole,
}: {
  groupId: string
  members: Member[]
  viewerRole: "founder" | "admin" | "member" | null
}) {
  const router = useRouter()
  const [busyUser, setBusyUser] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const isFounder = viewerRole === "founder"
  const canManage = viewerRole === "founder" || viewerRole === "admin"

  function run(userId: string, action: "remove" | "set_role", role?: "admin" | "member") {
    const confirmation = action === "remove"
      ? window.confirm("Haluatko varmasti poistaa tämän jäsenen ryhmästä?")
      : true
    if (!confirmation) return
    setError("")
    setBusyUser(userId)
    startTransition(async () => {
      const result = await manageGroupMember(groupId, userId, action, role)
      setBusyUser("")
      if (result.error) {
        setError("Jäsenen hallinta epäonnistui. Päivitä sivu ja yritä uudelleen.")
        return
      }
      router.refresh()
    })
  }

  return (
    <ArchiveCard className="mb-6">
      <ArchiveCardHeader>
        <ArchiveCardTitle><Users className="mr-2 inline h-5 w-5 text-accent-gold" />Jäsenet ({members.length})</ArchiveCardTitle>
      </ArchiveCardHeader>
      <ArchiveCardContent className="space-y-3">
        {members.map(member => (
          <div key={member.user_id} className="flex flex-col gap-3 rounded-lg border border-accent-gold/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {member.avatar_url
                ? <img src={member.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-gold/10 text-accent-gold"><Users className="h-5 w-5" /></div>}
              <div className="min-w-0">
                <p className="truncate font-medium">{member.display_name || member.username || "Pelaaja"}</p>
                {member.username ? <Link href={`/users/${member.username}`} className="text-xs text-muted-foreground hover:text-accent-gold">@{member.username}</Link> : null}
                <p className="mt-1 text-xs text-accent-gold">
                  {member.role === "founder" ? <><Crown className="mr-1 inline h-3 w-3" />Perustaja</> :
                    member.role === "admin" ? <><Shield className="mr-1 inline h-3 w-3" />Ylläpitäjä</> : "Jäsen"}
                </p>
              </div>
            </div>
            {canManage && member.role !== "founder" ? (
              <div className="flex flex-wrap gap-2">
                {isFounder ? (
                  member.role === "admin"
                    ? <ArchiveButton type="button" disabled={pending} onClick={() => run(member.user_id, "set_role", "member")}>Poista ylläpitäjän oikeudet</ArchiveButton>
                    : <ArchiveButton type="button" active disabled={pending} onClick={() => run(member.user_id, "set_role", "admin")}><Shield className="h-4 w-4" />Nosta ylläpitäjäksi</ArchiveButton>
                ) : null}
                {(!isFounder && member.role === "admin") ? null : (
                  <ArchiveButton type="button" disabled={pending} onClick={() => run(member.user_id, "remove")}>
                    {pending && busyUser === member.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                    Poista ryhmästä
                  </ArchiveButton>
                )}
              </div>
            ) : null}
          </div>
        ))}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
