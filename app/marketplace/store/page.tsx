"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ShoppingBag, ThumbsDown, ThumbsUp, Loader2 } from "lucide-react"
import { ThemeHero } from "@/components/theme-hero"
import { ArchiveCard, ArchiveCardContent } from "@/components/archive-frame"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/useUser"

type Vote = -1 | 1

export default function OfficialStorePreview() {
  const { user, loading: userLoading } = useUser()
  const [vote, setVote] = useState<Vote | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const loadVote = useCallback(async () => {
    if (!user) {
      setVote(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await createClient()
      .from("marketplace_store_interest")
      .select("vote")
      .eq("user_id", user.id)
      .maybeSingle()
    if (loadError) setError("Palautteen lataaminen ei onnistunut. Yritä myöhemmin uudelleen.")
    else setVote(data?.vote === 1 ? 1 : data?.vote === -1 ? -1 : null)
    setLoading(false)
  }, [user])

  useEffect(() => { void loadVote() }, [loadVote])

  async function submitVote(next: Vote) {
    if (!user || saving) return
    setSaving(true)
    setError("")
    setSaved(false)
    const client = createClient()
    const result = vote === next
      ? await client.from("marketplace_store_interest").delete().eq("user_id", user.id)
      : await client.from("marketplace_store_interest").upsert({
          user_id: user.id,
          vote: next,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
    if (result.error) {
      setError("Äänen tallentaminen ei onnistunut. Yritä uudelleen.")
    } else {
      setVote(vote === next ? null : next)
      setSaved(true)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen room-environment">
      <main className="container mx-auto px-4 py-8">
        <ThemeHero page="marketplace" mode="backdrop">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-gold/50 bg-black/50 px-4 py-1.5 text-sm tracking-widest text-accent-gold">
              <ShoppingBag className="h-4 w-4" /> SUUNNITTEILLA
            </span>
            <h1 className="logo-text mt-5 text-4xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] md:text-6xl">
              GameTable Official Store
            </h1>
            <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-foreground/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              Kartanon oma kauppa on suunnitteilla.
            </p>
          </div>
        </ThemeHero>

        <div className="mx-auto mt-8 max-w-3xl space-y-6">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-accent-gold hover:underline">
            <ArrowLeft className="h-4 w-4" /> Takaisin kauppapaikalle
          </Link>

          <ArchiveCard>
            <ArchiveCardContent className="space-y-6 p-6 md:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-accent-gold/40 bg-accent-gold/10">
                <ShoppingBag className="h-10 w-10 text-accent-gold" aria-hidden="true" />
              </div>
              <div className="space-y-4 text-center">
                <h2 className="font-heading text-3xl text-accent-gold">Kartanon aarteet ovat tulossa</h2>
                <p className="mx-auto max-w-xl font-body leading-relaxed text-foreground/90">
                  Suunnittelemme GameTablelle omaa tuotevalikoimaa: vaatteita, pelitarvikkeita
                  ja kartanon maailmasta inspiroituneita tuotteita. Ensimmäisiä tuotteita
                  on tarkoitus esitellä tulevissa tapahtumissa.
                </p>
                <p className="text-sm text-muted-foreground">
                  Kauppa ei ole vielä avoinna, eikä avauspäivää ole päätetty.
                </p>
              </div>

              <div className="border-t border-accent-gold/20 pt-7 text-center">
                <h3 className="font-heading text-2xl">Mitä pidät ajatuksesta?</h3>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  Kerro mielipiteesi yhdellä klikkauksella. Voit vaihtaa valintaasi tai perua sen myöhemmin.
                </p>

                {userLoading || loading ? (
                  <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-accent-gold" aria-label="Ladataan palautetta" />
                ) : user ? (
                  <div className="mx-auto mt-6 max-w-md space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => void submitVote(1)} disabled={saving}
                        aria-pressed={vote === 1}
                        className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-colors disabled:opacity-60 ${vote === 1 ? "border-accent-gold bg-accent-gold/20 text-accent-gold" : "border-accent-gold/30 hover:border-accent-gold/70"}`}>
                        <ThumbsUp className="h-8 w-8" />
                        <span className="font-heading">Kiinnostaa!</span>
                      </button>
                      <button type="button" onClick={() => void submitVote(-1)} disabled={saving}
                        aria-pressed={vote === -1}
                        className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-colors disabled:opacity-60 ${vote === -1 ? "border-accent-gold bg-accent-gold/20 text-accent-gold" : "border-accent-gold/30 hover:border-accent-gold/70"}`}>
                        <ThumbsDown className="h-8 w-8" />
                        <span className="font-heading">Ei minulle</span>
                      </button>
                    </div>
                    {saving && <p role="status" className="text-sm text-muted-foreground">Tallennetaan...</p>}
                    {saved && !error && <p role="status" className="text-sm text-accent-gold">{vote === null ? "Valintasi on peruttu." : "Kiitos palautteestasi!"}</p>}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-muted-foreground">
                    <Link href="/auth/login" className="text-accent-gold underline">Kirjaudu sisään</Link> antaaksesi palautetta.
                  </p>
                )}
                {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
              </div>
            </ArchiveCardContent>
          </ArchiveCard>
        </div>
      </main>
    </div>
  )
}
