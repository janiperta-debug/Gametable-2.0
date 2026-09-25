"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Shield, Mail, BarChart3, ArrowRight } from "lucide-react"
import { ArchiveCard, ArchiveCardContent } from "@/components/archive-frame"
import { checkIsAdmin } from "@/app/actions/admin"
import { useUser } from "@/hooks/useUser"

export default function AdminHomePage() {
  const { user, loading: userLoading } = useUser()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (userLoading) return
    if (!user) { setIsAdmin(false); return }
    let active = true
    void checkIsAdmin().then(({ isAdmin }) => { if (active) setIsAdmin(isAdmin) })
      .catch(() => { if (active) setIsAdmin(false) })
    return () => { active = false }
  }, [user, userLoading])

  if (userLoading || isAdmin === null) {
    return <main className="min-h-screen page-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent-gold" aria-label="Ladataan" /></main>
  }

  if (!isAdmin) {
    return <main className="min-h-screen page-background px-4 py-8"><div className="mx-auto max-w-xl"><ArchiveCard><ArchiveCardContent className="space-y-4 p-8 text-center"><Shield className="mx-auto h-12 w-12 text-accent-gold" /><h1 className="font-heading text-2xl text-accent-gold">Ylläpito</h1><p className="text-muted-foreground">Tämä sivu on vain ylläpitäjille.</p><Link href="/profile" className="text-accent-gold underline">Takaisin profiiliin</Link></ArchiveCardContent></ArchiveCard></div></main>
  }

  return <main className="min-h-screen page-background px-4 py-8">
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/profile" className="text-sm text-accent-gold hover:underline">← Takaisin profiiliin</Link>
      <ArchiveCard><ArchiveCardContent className="space-y-6 p-6 sm:p-9">
        <header className="flex items-start gap-3"><Shield className="mt-1 h-8 w-8 shrink-0 text-accent-gold" /><div><h1 className="font-heading text-3xl text-accent-gold">Kartanon ylläpito</h1><p className="mt-2 text-sm text-muted-foreground">Ylläpidon työkalut yhdessä paikassa.</p></div></header>
        <nav aria-label="Ylläpidon työkalut" className="grid gap-4 sm:grid-cols-2">
          <Link href="/admin/announcements" className="group flex items-start gap-4 rounded-xl border border-accent-gold/40 bg-black/20 p-5 transition-colors hover:border-accent-gold hover:bg-accent-gold/10"><Mail className="mt-1 h-7 w-7 shrink-0 text-accent-gold" /><span className="flex-1"><strong className="block font-heading text-xl text-accent-gold">Kartanon kirjeenvaihto</strong><span className="mt-2 block text-sm text-muted-foreground">Tiedotteet, uutiskirjeet ja lähetyshistoria.</span></span><ArrowRight className="h-5 w-5 shrink-0 text-accent-gold" /></Link>
          <Link href="/admin/store-interest" className="group flex items-start gap-4 rounded-xl border border-accent-gold/40 bg-black/20 p-5 transition-colors hover:border-accent-gold hover:bg-accent-gold/10"><BarChart3 className="mt-1 h-7 w-7 shrink-0 text-accent-gold" /><span className="flex-1"><strong className="block font-heading text-xl text-accent-gold">Official Store – kiinnostusmittari</strong><span className="mt-2 block text-sm text-muted-foreground">Kaupan ennakkosivun kiinnostusäänestyksen tulokset.</span></span><ArrowRight className="h-5 w-5 shrink-0 text-accent-gold" /></Link>
        </nav>
      </ArchiveCardContent></ArchiveCard>
    </div>
  </main>
}
