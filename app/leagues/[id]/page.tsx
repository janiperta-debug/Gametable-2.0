"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getLeague, addLeagueSeason, linkSeasonEvent, updateLeague, updateLeagueSeason, deleteLeague, joinLeague, leaveLeague, addLeagueMember, removeLeagueMember } from "@/app/actions/league-hub"
import { ArchiveFrame, ArchiveButton, ArchiveCard, ArchiveCardHeader, ArchiveCardTitle, ArchiveCardContent, ArchiveCardButton } from "@/components/archive-frame"

type Hub = Awaited<ReturnType<typeof getLeague>>
export default function LeaguePage() {
 const { id } = useParams<{ id: string }>()
 const router = useRouter()
 const [hub, setHub] = useState<Hub | null>(null)
 const [newSeason, setNewSeason] = useState("")
 const [newMember, setNewMember] = useState("")
 const [selected, setSelected] = useState<Record<string,string>>({})
 const [busy, setBusy] = useState(false)
 const [editing, setEditing] = useState(false)
 const [leagueDraft, setLeagueDraft] = useState({ name: "", game: "", description: "", privacy: "public" as "public" | "private" })
 const [editingSeason, setEditingSeason] = useState<string | null>(null)
 const [seasonDraft, setSeasonDraft] = useState({ name: "", startsOn: "", endsOn: "" })
 const [error, setError] = useState("")
 const refresh = async () => setHub(await getLeague(id))
 useEffect(() => { void refresh() }, [id])
 if (!hub) return <div className="p-8">Ladataan liigaa...</div>
 if (!hub.league) return <div className="p-8">{hub.error || "Liigaa ei löytynyt."}</div>
 return <ArchiveFrame className="mx-auto max-w-5xl">
  <div className="space-y-6 p-3 sm:p-6">
   <ArchiveCardButton type="button" onClick={() => router.push("/events")}>← Tapahtumat</ArchiveCardButton>
   <div className="space-y-4 text-center">
    <div className="relative mx-auto flex w-full max-w-xl items-center justify-center py-3">
     <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[calc(50%-5rem)] bg-contain bg-left bg-no-repeat sm:w-[calc(50%-6rem)]" style={{backgroundImage:'url("/images/events/ornate-left.png")'}} />
     <img src="/images/events/league.png" alt="Liiga" className="relative z-10 aspect-square w-32 rounded-lg border border-accent-gold/30 object-cover sm:w-40" />
     <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[calc(50%-5rem)] bg-contain bg-right bg-no-repeat sm:w-[calc(50%-6rem)]" style={{backgroundImage:'url("/images/events/ornate-right.png")'}} />
    </div>
    <p className="text-sm uppercase tracking-widest text-accent-gold">GameTable · Liiga</p>
    <h1 className="font-heading text-3xl break-words">{hub.league.name}</h1>
    <p className="text-sm text-muted-foreground">{hub.league.privacy==="public"?"Julkinen liiga":"Yksityinen liiga"}</p>
    {hub.league.game && <p className="text-accent-gold">{hub.league.game}</p>}
    {hub.league.description && <p className="whitespace-pre-wrap text-muted-foreground">{hub.league.description}</p>}
   </div>

   {hub.isOwner && <div className="flex flex-wrap gap-3">
    <ArchiveCardButton disabled={busy} onClick={() => {
     setLeagueDraft({ name: hub.league!.name, game: hub.league!.game || "", description: hub.league!.description || "", privacy: hub.league!.privacy as "public" | "private" })
     setEditing(!editing); setError("")
    }}>{editing ? "Sulje muokkaus" : "Muokkaa liigaa"}</ArchiveCardButton>
    <ArchiveCardButton disabled={busy} onClick={async () => {
     if (!window.confirm(`Poistetaanko liiga "${hub.league!.name}" ja kaikki sen kaudet? Liitetyt turnaukset ja peli-illat säilyvät. Tätä ei voi perua.`)) return
     setBusy(true); setError("")
     try { const result = await deleteLeague(id); if (result.error) setError(result.error); else router.push("/events") }
     catch { setError("Liigan poistaminen epäonnistui.") }
     finally { setBusy(false) }
    }}>Poista liiga</ArchiveCardButton>
   </div>}
   {editing && hub.isOwner && <ArchiveCard corners={false} centerOrnaments={false}><ArchiveCardContent className="space-y-4 p-4">
    <h2 className="font-heading text-xl text-accent-gold">Muokkaa liigaa</h2>
    <label className="block space-y-1">Liigan nimi<input maxLength={120} value={leagueDraft.name} onChange={e => setLeagueDraft({ ...leagueDraft, name: e.target.value })} className="w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
    <label className="block space-y-1">Peli tai pelilaji<input value={leagueDraft.game} onChange={e => setLeagueDraft({ ...leagueDraft, game: e.target.value })} className="w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
    <label className="block space-y-1">Esittely<textarea value={leagueDraft.description} onChange={e => setLeagueDraft({ ...leagueDraft, description: e.target.value })} rows={4} className="w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
    <label className="block space-y-1">Näkyvyys<select value={leagueDraft.privacy} onChange={e => setLeagueDraft({ ...leagueDraft, privacy: e.target.value as "public" | "private" })} className="w-full rounded-md border border-accent-gold/30 bg-background p-3"><option value="public">Julkinen</option><option value="private">Yksityinen</option></select></label>
    <ArchiveCardButton disabled={busy || leagueDraft.name.trim().length < 2} onClick={async () => {
     setBusy(true); setError("")
     try { const result = await updateLeague(id, leagueDraft); if (result.error) setError(result.error); else { setEditing(false); await refresh() } }
     catch { setError("Tallennus epäonnistui.") }
     finally { setBusy(false) }
    }}>Tallenna muutokset</ArchiveCardButton>
   </ArchiveCardContent></ArchiveCard>}
   {error && <p role="alert" className="text-red-400">{error}</p>}
   <ArchiveCard corners={false} centerOrnaments={false}>
    <ArchiveCardHeader><ArchiveCardTitle>Liigan osallistujat ({hub.members.length})</ArchiveCardTitle></ArchiveCardHeader>
    <ArchiveCardContent className="space-y-4">
     <div className="flex flex-wrap gap-3">
      {hub.members.map(member=><div key={member.user_id} className="flex items-center gap-2 rounded-lg border border-accent-gold/20 p-2">
       {member.avatar_url?<img src={member.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover"/>:<div className="h-9 w-9 rounded-full bg-accent-gold/20"/>}
       <span>{member.display_name}{member.isOwner?" · Järjestäjä":""}</span>
       {hub.isOwner && !member.isOwner && <button type="button" disabled={busy} className="text-xs text-red-300 underline" onClick={async()=>{
        if(!window.confirm("Poistetaanko osallistuja liigasta?"))return
        setBusy(true);setError("")
        try{const result=await removeLeagueMember(id,member.user_id);if(result.error)setError(result.error);else await refresh()}
        finally{setBusy(false)}
       }}>Poista</button>}
      </div>)}
     </div>
     {!hub.isOwner && hub.league.privacy==="public" && <ArchiveCardButton disabled={busy} onClick={async()=>{
      setBusy(true);setError("")
      try{const result=hub.isMember?await leaveLeague(id):await joinLeague(id);if(result.error)setError(result.error);else await refresh()}
      finally{setBusy(false)}
     }}>{hub.isMember?"Poistu liigasta":"Liity liigaan"}</ArchiveCardButton>}
     {hub.isOwner && <div className="flex flex-wrap gap-2">
      <input aria-label="Lisättävän pelaajan käyttäjätunnus" placeholder="Pelaajan käyttäjätunnus" value={newMember} onChange={e=>setNewMember(e.target.value)}
       className="min-w-0 flex-1 rounded-md border border-accent-gold/30 bg-background px-3 py-2"/>
      <ArchiveCardButton disabled={busy||!newMember.trim()} onClick={async()=>{
       setBusy(true);setError("")
       try{const result=await addLeagueMember(id,newMember);if(result.error)setError(result.error);else{setNewMember("");await refresh()}}
       finally{setBusy(false)}
      }}>Lisää osallistuja</ArchiveCardButton>
     </div>}
    </ArchiveCardContent>
   </ArchiveCard>}
   {hub.league.legacy_event_id && <div className="rounded-lg border border-accent-gold/25 p-4 space-y-2">
     <p className="text-sm text-muted-foreground">Tämä liiga on siirretty vanhasta tapahtumamallista. Aiemmat sarjaottelut, osallistujat ja tulokset säilyvät alkuperäisellä sivulla, kunnes niiden kausikohtainen siirto on valmis.</p>
     <ArchiveCardButton onClick={() => router.push("/events/" + hub.league.legacy_event_id)}>Avaa aiemmat ottelut ja tulokset</ArchiveCardButton>
   </div>}
   {hub.seasons.map((season) => <ArchiveCard key={season.id} corners={false} centerOrnaments={false}>
    <ArchiveCardHeader><ArchiveCardTitle>{season.name}</ArchiveCardTitle></ArchiveCardHeader>
    <ArchiveCardContent className="space-y-4">
     <p className="text-sm text-muted-foreground">{season.starts_on || "Alku avoin"} – {season.ends_on || "Loppu avoin"}</p>

     {hub.isOwner && <div className="space-y-3">
      <ArchiveCardButton disabled={busy} onClick={() => {
       setEditingSeason(editingSeason === season.id ? null : season.id)
       setSeasonDraft({ name: season.name, startsOn: season.starts_on || "", endsOn: season.ends_on || "" })
       setError("")
      }}>{editingSeason === season.id ? "Sulje kauden muokkaus" : "Muokkaa kautta"}</ArchiveCardButton>
      {editingSeason === season.id && <div className="space-y-3 rounded-md border border-accent-gold/20 p-3">
       <label className="block space-y-1">Kauden nimi<input maxLength={120} value={seasonDraft.name} onChange={e => setSeasonDraft({ ...seasonDraft, name: e.target.value })} className="w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
       <label className="block space-y-1">Alkaa<input type="date" value={seasonDraft.startsOn} onChange={e => setSeasonDraft({ ...seasonDraft, startsOn: e.target.value })} className="w-full min-w-0 max-w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
       <label className="block space-y-1">Päättyy<input type="date" value={seasonDraft.endsOn} onChange={e => setSeasonDraft({ ...seasonDraft, endsOn: e.target.value })} className="w-full min-w-0 max-w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
       <ArchiveCardButton disabled={busy || !seasonDraft.name.trim()} onClick={async () => {
        setBusy(true); setError("")
        try { const result = await updateLeagueSeason(id, season.id, seasonDraft); if (result.error) setError(result.error); else { setEditingSeason(null); await refresh() } }
        catch { setError("Kauden tallennus epäonnistui.") }
        finally { setBusy(false) }
       }}>Tallenna kausi</ArchiveCardButton>
      </div>}
     </div>}
     <section className="space-y-3">
      <h3 className="font-heading text-xl text-accent-gold">Kauden sarjataulukko</h3>
      {hub.standings.filter(row=>row.season_id===season.id).length===0
       ? <p className="text-sm text-muted-foreground">Sarjataulukko muodostuu, kun kauteen liitetyissä turnauksissa kirjataan ottelutuloksia.</p>
       : <div className="overflow-x-auto rounded-md border border-accent-gold/25">
        <table className="w-full min-w-[490px] text-left text-sm">
         <thead className="border-b border-accent-gold/25 bg-accent-gold/10 text-accent-gold">
          <tr><th className="p-2">Sija</th><th className="p-2">Pelaaja</th><th className="p-2 text-center" title="Turnauksia">T</th><th className="p-2 text-center" title="Otteluita">O</th><th className="p-2 text-center" title="Voitot">V</th><th className="p-2 text-center" title="Tasapelit">TAS</th><th className="p-2 text-center" title="Tappiot">H</th><th className="p-2 text-right">Pisteet</th></tr>
         </thead>
         <tbody>{hub.standings.filter(row=>row.season_id===season.id).map((row,index)=><tr key={row.key} className="border-b border-accent-gold/10 last:border-0">
          <td className="p-2">{index+1}.</td><td className="p-2 font-medium break-words">{row.name}</td><td className="p-2 text-center">{row.tournaments}</td><td className="p-2 text-center">{row.played}</td><td className="p-2 text-center">{row.wins}</td><td className="p-2 text-center">{row.draws}</td><td className="p-2 text-center">{row.losses}</td><td className="p-2 text-right font-bold text-accent-gold">{row.points}</td>
         </tr>)}</tbody>
        </table>
       </div>}
      <p className="text-xs text-muted-foreground">Pisteet lasketaan kirjatuista otteluista. Jos turnauksessa ei ole määritetty ottelupisteitä, voitosta saa 3 ja tasapelistä 1 pisteen. Tasapisteissä ratkaisevat voitot ja maaliero.</p>
     </section>
     {hub.results.filter(result=>result.season_id===season.id).length>0 && <div className="space-y-2">
      <h3 className="font-heading text-lg text-accent-gold">Kirjatut ottelutulokset</h3>
      {hub.results.filter(result=>result.season_id===season.id).map(result=><div key={result.id} className="rounded-md border border-accent-gold/20 p-3">
       <p className="text-xs text-muted-foreground">{result.event_title}</p>
       <p className="break-words">{result.player_a} {result.score_a!==null?result.score_a:"–"} – {result.score_b!==null?result.score_b:"–"} {result.player_b}</p>
       {result.result && <p className="text-xs text-muted-foreground">{result.result}</p>}
      </div>)}
     </div>}
     <h3 className="font-heading text-lg text-accent-gold">Kauden kilpailut ja tapahtumat</h3>
     {hub.events.filter((event) => event.season_id === season.id).length === 0 && <p className="text-sm text-muted-foreground">Tähän kauteen ei ole vielä liitetty tapahtumia.</p>}
     {hub.events.filter((event) => event.season_id === season.id).map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent-gold/20 p-3">
      <button type="button" onClick={() => router.push("/events/" + event.id)} className="text-left text-accent-gold hover:underline">{event.title} <span className="text-xs text-muted-foreground">· {event.event_type === "tournament" ? "Turnaus" : "Peli-ilta"}</span></button>
      {hub.isOwner && <ArchiveCardButton disabled={busy} onClick={async () => {
       setBusy(true); const result = await linkSeasonEvent(id, season.id, event.id, false)
       if (result.error) setError(result.error); else await refresh(); setBusy(false)
      }}>Irrota</ArchiveCardButton>}
     </div>)}
     {hub.isOwner && <div className="flex flex-wrap gap-2">
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
     </div>}
     {hub.isOwner && <p className="text-xs text-muted-foreground">Voit luoda uusia turnauksia ja peli-iltoja tavallisella tapahtuman luontisivulla ja liittää ne tänne.</p>}
     {hub.isOwner && <ArchiveCardButton onClick={() => router.push("/events/create")}>Luo uusi tapahtuma</ArchiveCardButton>}
    </ArchiveCardContent>
   </ArchiveCard>)}
   {hub.isOwner && <ArchiveCard corners={false} centerOrnaments={false}><ArchiveCardHeader><ArchiveCardTitle>Uusi kausi</ArchiveCardTitle></ArchiveCardHeader>
    <ArchiveCardContent className="flex flex-wrap gap-2">
     <input aria-label="Uuden kauden nimi" className="min-w-0 flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm" value={newSeason} onChange={(e) => setNewSeason(e.target.value)} placeholder="Esim. Kausi 2028" />
     <ArchiveCardButton disabled={busy || !newSeason.trim()} onClick={async () => {
      setBusy(true); setError("")
      const result = await addLeagueSeason(id, newSeason)
      if (result.error) setError(result.error); else { setNewSeason(""); await refresh() }
      setBusy(false)
     }}>Lisää kausi</ArchiveCardButton>
    </ArchiveCardContent>
   </ArchiveCard>}
  </div>
 </ArchiveFrame>
}
