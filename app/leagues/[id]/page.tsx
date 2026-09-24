"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getLeague, addLeagueSeason, linkSeasonEvent } from "@/app/actions/league-hub"
import { ArchiveFrame, ArchiveCard, ArchiveCardHeader, ArchiveCardTitle, ArchiveCardContent, ArchiveCardButton } from "@/components/archive-frame"

type Hub = Awaited<ReturnType<typeof getLeague>>
export default function LeaguePage() {
 const { id } = useParams<{ id: string }>()
 const router = useRouter()
 const [hub, setHub] = useState<Hub | null>(null)
 const [newSeason, setNewSeason] = useState("")
 const [selected, setSelected] = useState<Record<string,string>>({})
 const [busy, setBusy] = useState(false)
 const [error, setError] = useState("")
 const refresh = async () => setHub(await getLeague(id))
 useEffect(() => { void refresh() }, [id])
 if (!hub) return <div className="p-8">Ladataan liigaa...</div>
 if (!hub.league) return <div className="p-8">{hub.error || "Liigaa ei löytynyt."}</div>
 return <ArchiveFrame className="mx-auto max-w-5xl">
  <div className="space-y-6 p-3 sm:p-6">
   <button type="button" className="text-sm text-accent-gold" onClick={() => router.push("/events")}>← Tapahtumat</button>
   <div className="space-y-2">
    <p className="text-sm uppercase tracking-widest text-accent-gold">GameTable · Liiga</p>
    <h1 className="font-heading text-3xl">{hub.league.name}</h1>
    {hub.league.game && <p className="text-accent-gold">{hub.league.game}</p>}
    {hub.league.description && <p className="text-muted-foreground">{hub.league.description}</p>}
   </div>
   {error && <p role="alert" className="text-red-400">{error}</p>}
   {hub.seasons.map((season) => <ArchiveCard key={season.id}>
    <ArchiveCardHeader><ArchiveCardTitle>{season.name}</ArchiveCardTitle></ArchiveCardHeader>
    <ArchiveCardContent className="space-y-4">
     <p className="text-sm text-muted-foreground">{season.starts_on || "Alku avoin"} – {season.ends_on || "Loppu avoin"}</p>
     <h3 className="font-heading text-lg text-accent-gold">Kauden kilpailut ja tapahtumat</h3>
     {hub.events.filter((event) => event.season_id === season.id).length === 0 && <p className="text-sm text-muted-foreground">Tähän kauteen ei ole vielä liitetty tapahtumia.</p>}
     {hub.events.filter((event) => event.season_id === season.id).map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent-gold/20 p-3">
      <button type="button" onClick={() => router.push("/events/" + event.id)} className="text-left text-accent-gold hover:underline">{event.title} <span className="text-xs text-muted-foreground">· {event.event_type === "tournament" ? "Turnaus" : "Peli-ilta"}</span></button>
      {hub.available.length >= 0 && <ArchiveCardButton disabled={busy} onClick={async () => {
       setBusy(true); const result = await linkSeasonEvent(id, season.id, event.id, false)
       if (result.error) setError(result.error); else await refresh(); setBusy(false)
      }}>Irrota</ArchiveCardButton>}
     </div>)}
     <div className="flex flex-wrap gap-2">
      <select aria-label="Liitettävä tapahtuma" className="min-w-0 flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm" value={selected[season.id] || ""} onChange={(e) => setSelected({ ...selected, [season.id]: e.target.value })}>
       <option value="">Valitse olemassa oleva turnaus tai peli-ilta</option>
       {hub.available.map((event) => <option key={event.id} value={event.id}>{event.title} ({event.event_type === "tournament" ? "turnaus" : "peli-ilta"})</option>)}
      </select>
      <ArchiveCardButton disabled={busy || !selected[season.id]} onClick={async () => {
       setBusy(true); setError("")
       const result = await linkSeasonEvent(id, season.id, selected[season.id], true)
       if (result.error) setError(result.error); else { setSelected({ ...selected, [season.id]: "" }); await refresh() }
       setBusy(false)
      }}>Liitä kauteen</ArchiveCardButton>
     </div>
     <p className="text-xs text-muted-foreground">Voit luoda uusia turnauksia ja peli-iltoja tavallisella tapahtuman luontisivulla ja liittää ne tänne.</p>
     <ArchiveCardButton onClick={() => router.push("/events/create")}>Luo uusi tapahtuma</ArchiveCardButton>
    </ArchiveCardContent>
   </ArchiveCard>)}
   <ArchiveCard><ArchiveCardHeader><ArchiveCardTitle>Uusi kausi</ArchiveCardTitle></ArchiveCardHeader>
    <ArchiveCardContent className="flex flex-wrap gap-2">
     <input aria-label="Uuden kauden nimi" className="min-w-0 flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm" value={newSeason} onChange={(e) => setNewSeason(e.target.value)} placeholder="Esim. Kausi 2028" />
     <ArchiveCardButton disabled={busy || !newSeason.trim()} onClick={async () => {
      setBusy(true); setError("")
      const result = await addLeagueSeason(id, newSeason)
      if (result.error) setError(result.error); else { setNewSeason(""); await refresh() }
      setBusy(false)
     }}>Lisää kausi</ArchiveCardButton>
    </ArchiveCardContent>
   </ArchiveCard>
  </div>
 </ArchiveFrame>
}
