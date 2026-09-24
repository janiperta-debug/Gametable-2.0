"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createLeague } from "@/app/actions/league-hub"
import { ArchiveFrame, ArchiveCard, ArchiveCardHeader, ArchiveCardTitle, ArchiveCardContent, ArchiveCardButton } from "@/components/archive-frame"

export default function CreateLeaguePage() {
 const router = useRouter()
 const [form, setForm] = useState({ name: "", game: "", description: "", privacy: "public" as "public" | "private", seasonName: "", startsOn: "", endsOn: "" })
 const [saving, setSaving] = useState(false)
 const [error, setError] = useState("")
 const field = "w-full rounded-md border border-accent-gold/25 bg-background px-3 py-2 text-sm"
 return <ArchiveFrame>
  <div className="mx-auto max-w-3xl space-y-6">
   <button type="button" onClick={() => router.push("/events/create")} className="text-sm text-accent-gold">← Takaisin</button>
   <div className="space-y-2">
    <p className="text-sm uppercase tracking-widest text-accent-gold">GameTable · Kilpailuyhteisöt</p>
    <h1 className="font-heading text-3xl">Perusta uusi liiga</h1>
    <p className="text-muted-foreground">Luo pysyvä kilpailuyhteisö. Sen alle voit perustaa useita kausia ja liittää niihin nykyisiä tai uusia turnauksia ja peli-iltoja.</p>
   </div>
   <form onSubmit={async (e) => {
    e.preventDefault()
    setSaving(true); setError("")
    try {
     const result = await createLeague(form)
     if (result.error) setError(result.error)
     else if (result.id) router.push("/leagues/" + result.id)
    } catch { setError("Liigan perustaminen epäonnistui.") }
    finally { setSaving(false) }
   }} className="space-y-5">
    <ArchiveCard><ArchiveCardHeader><ArchiveCardTitle>Liigan identiteetti</ArchiveCardTitle></ArchiveCardHeader>
     <ArchiveCardContent className="space-y-4">
      <label className="block space-y-2"><span className="text-sm text-accent-gold">Liigan nimi *</span><input required minLength={2} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} placeholder="Esim. Hyvinkään Blood Bowl -liiga" /></label>
      <label className="block space-y-2"><span className="text-sm text-accent-gold">Peli tai pelilaji</span><input value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })} className={field} placeholder="Esim. Blood Bowl" /></label>
      <label className="block space-y-2"><span className="text-sm text-accent-gold">Liigan esittely</span><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={field} placeholder="Kenelle liiga on tarkoitettu ja miten toimintaan pääsee mukaan?" /></label>
      <label className="block space-y-2"><span className="text-sm text-accent-gold">Näkyvyys</span><select value={form.privacy} onChange={(e) => setForm({ ...form, privacy: e.target.value as "public" | "private" })} className={field}><option value="public">Julkinen liiga</option><option value="private">Yksityinen liiga</option></select></label>
     </ArchiveCardContent>
    </ArchiveCard>
    <ArchiveCard><ArchiveCardHeader><ArchiveCardTitle>Ensimmäinen kausi</ArchiveCardTitle></ArchiveCardHeader>
     <ArchiveCardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">Liiga säilyy vuodesta toiseen. Kaudet, niiden kilpailut ja tulokset muodostavat liigan historian.</p>
      <label className="block space-y-2"><span className="text-sm text-accent-gold">Kauden nimi *</span><input required maxLength={120} value={form.seasonName} onChange={(e) => setForm({ ...form, seasonName: e.target.value })} className={field} placeholder="Esim. Kausi 2027" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
       <label className="block space-y-2"><span className="text-sm text-accent-gold">Alkaa (valinnainen)</span><input type="date" value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} className={field} /></label>
       <label className="block space-y-2"><span className="text-sm text-accent-gold">Päättyy (valinnainen)</span><input type="date" min={form.startsOn || undefined} value={form.endsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })} className={field} /></label>
      </div>
      <p className="text-sm text-muted-foreground">Turnaukset, peli-illat, osallistujat ja kauden pisteytys lisätään myöhemmin. Mitään kilpailuohjelmaa ei tarvitse suunnitella valmiiksi.</p>
     </ArchiveCardContent>
    </ArchiveCard>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <ArchiveCardButton type="submit" disabled={saving || !form.name.trim() || !form.seasonName.trim()}>{saving ? "Perustetaan..." : "Perusta liiga ja ensimmäinen kausi"}</ArchiveCardButton>
   </form>
  </div>
 </ArchiveFrame>
}
