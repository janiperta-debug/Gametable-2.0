"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogIn, LogOut, Clock3, ShieldCheck } from "lucide-react"
import { joinGroup, leaveGroup } from "@/app/actions/groups"
import { ArchiveButton, ArchiveCard, ArchiveCardContent } from "@/components/archive-frame"
import { useTranslations } from "@/lib/i18n"

type Membership = { role: string; status: string } | null

export function GroupMembershipControls({
  groupId,
  visibility,
  joinPolicy,
  membership,
}: {
  groupId: string
  visibility: "public" | "private" | "invite_only"
  joinPolicy: "open" | "approval" | "invite_only"
  membership: Membership
}) {
  const t = useTranslations()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleJoin() {
    setError("")
    startTransition(async () => {
      const result = await joinGroup(groupId)
      if (result.error) {
        setError(result.error === "already_member" ? t("community.alreadyMember") : t("community.joinFailed"))
        router.refresh()
        return
      }
      router.refresh()
    })
  }

  function handleLeave() {
    setError("")
    startTransition(async () => {
      const result = await leaveGroup(groupId)
      if (result.error) {
        setError(result.error === "founder_cannot_leave" ? t("community.founderCannotLeave") : t("community.leaveFailed"))
        return
      }
      router.refresh()
    })
  }

  let statusMessage: string | null = null
  if (membership?.status === "pending") statusMessage = t("community.membershipPending")
  else if (membership?.status === "active" && membership.role === "founder") statusMessage = t("community.founderNotice")
  else if (membership?.status === "active") statusMessage = t("community.membershipActive")

  return (
    <ArchiveCard>
      <ArchiveCardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm">
          {membership?.status === "pending" ? <Clock3 className="h-5 w-5 text-accent-gold" /> :
            membership?.status === "active" ? <ShieldCheck className="h-5 w-5 text-accent-gold" /> :
            <LogIn className="h-5 w-5 text-accent-gold" />}
          <span>{statusMessage ?? (visibility === "invite_only" ? t("community.inviteOnlyNotice") : "")}</span>
        </div>

        {membership?.status === "pending" ? (
          <ArchiveButton type="button" disabled variant="secondary">{t("community.membershipPending")}</ArchiveButton>
        ) : membership?.status === "active" ? (
          membership.role === "founder" ? null : (
            <ArchiveButton type="button" disabled={isPending} onClick={handleLeave}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {t("community.leaveGroup")}
            </ArchiveButton>
          )
        ) : visibility === "invite_only" ? null : (
          <ArchiveButton type="button" disabled={isPending} active onClick={handleJoin}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {visibility === "public" && joinPolicy === "open" ? t("community.joinGroup") : t("community.requestMembership")}
          </ArchiveButton>
        )}
        {error ? <p role="alert" className="text-sm text-destructive sm:basis-full">{error}</p> : null}
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
