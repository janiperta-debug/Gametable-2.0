"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { ArchiveCard, ArchiveCardContent } from "@/components/archive-frame"
import { checkIsAdmin, getStoreInterestStats, type StoreInterestStats } from "@/app/actions/admin"
import { useUser } from "@/hooks/useUser"

export default function StoreInterestAdminPage() {
  const { user, loading: userLoading } = useUser()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [stats, setStats] = useState<StoreInterestStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    const result = await getStoreInterestStats()
    if (result.error) setError(result.error)
    else setStats(result.stats ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      setAuthorized(false)
      setLoading(false)
      return
    }
    let active = true
    void (async () => {
      const result = await checkIsAdmin()
      if (!active) return
      setAuthorized(result.isAdmin)
      if (result.isAdmin) await refresh()
      else setLoading(false)
    })()
    return () => { active = false }
  }, [user, userLoading, refresh])

  if (userLoading || authorized === null) {
    return <main className="min-h-screen page-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent-gold" aria-label="Ladataan" /></main>
  }

  if (!authorized) {
    return <main className="min-h-screen page-background p-6"><ArchiveCard><ArchiveCardContent className="space-y-4 p-8 text-center"><h1 className="font-heading text-2xl text-accent-gold">Vain ylläpidolle</h1><p>Äänestystulokset näkyvät vain ylläpitäjille.</p><Link href="/marketplace" className="text-accent-gold underline">Takaisin kauppapaikalle</Link></ArchiveCardContent></ArchiveCard></main>
  }

  const positiveShare = stats?.total ? Math.round(stats.interested / stats.total * 100) : 0

  return (
    <main className="min-h-screen page-background px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/admin/announcements" className="inline-flex items-center gap-2 text-accent-gold hover:underline"><ArrowLeft className="h-4 w-4" /> Ylläpidon tiedotteet</Link>
        <ArchiveCard>
          <ArchiveCardContent className="space-y-7 p-6 sm:p-9">
            <header className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-8 w-8 shrink-0 text-accent-gold" />
              <div>
                <h1 className="font-heading text-2xl text-accent-gold sm:text-3xl">Official Store – kiinnostusmittari</h1>
                <p className="mt-2 text-sm text-muted-foreground">Kirjautuneiden käyttäjien tämänhetkiset äänet. Vain yksi voimassa oleva ääni käyttäjää kohden.</p>
              </div>
            </header>
            {loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-gold" aria-label="Ladataan tuloksia" /> : error ? <p role="alert" className="text-red-400">{error}</p> : stats && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-accent-gold/30 bg-black/20 p-5 text-center"><p className="text-sm text-muted-foreground">Kiinnostaa</p><p className="mt-2 font-heading text-4xl text-accent-gold tabular-nums">{stats.interested}</p></div>
                  <div className="rounded-xl border border-accent-gold/30 bg-black/20 p-5 text-center"><p className="text-sm text-muted-foreground">Ei minulle</p><p className="mt-2 font-heading text-4xl tabular-nums">{stats.notInterested}</p></div>
                  <div className="rounded-xl border border-accent-gold/30 bg-black/20 p-5 text-center"><p className="text-sm text-muted-foreground">Ääniä yhteensä</p><p className="mt-2 font-heading text-4xl tabular-nums">{stats.total}</p></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-3 text-sm"><span>Kiinnostuneiden osuus annetuista äänistä</span><strong className="tabular-nums">{positiveShare} %</strong></div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`Kiinnostuneiden osuus ${positiveShare} prosenttia`}><div className="h-full rounded-full bg-accent-gold" style={{ width: `${positiveShare}%` }} /></div>
                  <p className="text-xs text-muted-foreground">Luku kuvaa äänestäneitä, ei kaikkia kauppapaikan kävijöitä.</p>
                </div>
                <p className="text-xs text-muted-foreground">{stats.updatedAt ? `Viimeisin äänen päivitys: ${new Date(stats.updatedAt).toLocaleString("fi-FI")}` : "Ääniä ei ole vielä annettu."}</p>
              </>
            )}
            <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-accent-gold/50 px-4 py-2 text-sm text-accent-gold hover:bg-accent-gold/10 disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Päivitä tulokset</button>
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    </main>
  )
}
