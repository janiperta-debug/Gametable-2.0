"use client"

import Link from "next/link"
import { Shield, ArrowRight } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { ArchiveCard, ArchiveCardContent } from "@/components/archive-frame"

/** Display only for profiles with the admin role; server actions enforce access independently. */
export function ProfileAdminLink() {
  const { user, profile, loading } = useUser()
  if (loading || !user || profile?.role !== "admin") return null

  return (
    <ArchiveCard>
      <ArchiveCardContent className="p-5 sm:p-7">
        <Link href="/admin" className="group flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-accent-gold/10">
          <Shield className="h-9 w-9 shrink-0 text-accent-gold" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <strong className="block font-heading text-xl text-accent-gold">Kartanon ylläpito</strong>
            <span className="mt-1 block text-sm text-muted-foreground">Kirjeenvaihto, Official Storen kiinnostusmittari ja muut ylläpidon työkalut.</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-accent-gold" aria-hidden="true" />
        </Link>
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
