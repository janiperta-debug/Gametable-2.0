"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getLeague, addLeagueSeason, linkSeasonEvent, updateLeague, setLeagueSeasonTrophy, updateLeagueSeason, deleteLeague, joinLeague, leaveLeague, addLeagueMemberById, searchLeaguePlayers, removeLeagueMember } from "@/app/actions/league-hub"
import { useTranslation } from "@/lib/i18n"
import { completeLeagueSeason } from "@/app/actions/league-season-completion"
import { awardLeagueWinnerTrophy, getSourcePersonalTrophies } from "@/app/actions/personal-trophies"
import { Gem, FlagTriangleRight, Award, Trophy } from "lucide-react"
import { ArchiveFrame, ArchiveButton, ArchiveCard, ArchiveCardHeader, ArchiveCardTitle, ArchiveCardContent, ArchiveCardButton } from "@/components/archive-frame"

type Hub = Awaited<ReturnType<typeof getLeague>>
export default function LeaguePage() {
 const { id } = useParams<{ id: string }>()
 const router = useRouter()
 const { t, locale } = useTranslation()
 const [hub, setHub] = useState<Hub | null>(null)
 const [newSeason, setNewSeason] = useState("")
 const [newMember, setNewMember] = useState("")
 const [playerResults, setPlayerResults] = useState<{id:string;username:string|null;display_name:string|null;avatar_url:string|null}[]>([])
 const [searchingPlayers, setSearchingPlayers] = useState(false)
 const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
 const [selected, setSelected] = useState<Record<string,string>>({})
 const [busy, setBusy] = useState(false)
 const [editing, setEditing] = useState(false)
 const [leagueDraft, setLeagueDraft] = useState({ name: "", game: "", description: "", privacy: "public" as "public" | "private" })
 const [editingSeason, setEditingSeason] = useState<string | null>(null)
 const [showCompletedSeasons, setShowCompletedSeasons] = useState(false)
 const [awardSelections, setAwardSelections] = useState<Record<string, string>>({})
 const [choosingTrophy, setChoosingTrophy] = useState<string | null>(null)
 const [awardedSeasons, setAwardedSeasons] = useState<Record<string, boolean>>({})
 const [seasonDraft, setSeasonDraft] = useState({ name: "", startsOn: "", endsOn: "" })
 const [error, setError] = useState("")
 const refresh = async () => {
  try {
   const next = await getLeague(id)
   setHub(next)
   setError("")
   if (next.isOwner) {
    const awardStates = await Promise.all(next.seasons.filter((season: any) => (season.award_config as any)?.category && (season.award_config as any)?.category !== "none").map(async (season: any) => [season.id, (await getSourcePersonalTrophies("league_season", season.id)).awarded] as const))
    setAwardedSeasons(Object.fromEntries(awardStates))
   }
  } catch (cause) {
   console.error("League data loading failed:", cause)
   setError(locale === "fi" ? "Liigan tietojen lataaminen epäonnistui. Päivitä sivu ja yritä uudelleen." : "Could not load league data. Refresh and try again.")
  }
 }
 useEffect(() => { void refresh() }, [id])
 useEffect(() => {
  let active=true
  if(newMember.trim().length<2){setPlayerResults([]);setSearchingPlayers(false);return}
  setSearchingPlayers(true)
  const timer=setTimeout(async()=>{
   try{
    const result=await searchLeaguePlayers(id,newMember)
    if(active){setPlayerResults(result.players||[]);setSearchingPlayers(false);if(result.error)setError(result.error)}
   }catch{if(active){setSearchingPlayers(false);setError(t("leagueUi.s55"))}}
  },300)
  return()=>{active=false;clearTimeout(timer)}
 },[id,newMember])
 if (!hub) return <div className="space-y-4 p-8">{error || t("leagueUi.s0")}{error && <button className="block rounded border px-4 py-2" onClick={() => void refresh()}>{locale === "fi" ? "Yritä uudelleen" : "Retry"}</button>}</div>
 if (!hub.league) return <div className="p-8">{hub.error || t("leagueUi.s1")}</div>
 const showcaseSeason = hub.seasons.find(season => season.status !== "completed") || hub.seasons[0]
 const showcaseConfig = (showcaseSeason?.award_config || {}) as {category?:string;variant?:"crystal"|"pennant"|"sculpture"}
 const showcaseEnabled = !!showcaseSeason && !!showcaseConfig.category && showcaseConfig.category !== "none"
 const showcaseWinner = hub.seasonTrophies?.find(trophy => trophy.season_id === showcaseSeason?.id)
 const trophyNames = { crystal: locale === "fi" ? "Kristalli" : "Crystal", pennant: locale === "fi" ? "Viiri" : "Pennant", sculpture: locale === "fi" ? "Veistos" : "Sculpture" }
 const TrophyArt = ({variant,size="large"}:{variant:"crystal"|"pennant"|"sculpture";size?:"large"|"small"}) => {
  const Icon = variant === "crystal" ? Gem : variant === "pennant" ? FlagTriangleRight : Award
  return <Icon aria-hidden="true" strokeWidth={1.15} className={size==="large" ? "h-28 w-28 text-accent-gold drop-shadow-[0_0_22px_rgba(212,175,95,0.42)] sm:h-36 sm:w-36" : "h-10 w-10 text-accent-gold"} />
 }
 return <ArchiveFrame className="mx-auto max-w-5xl">
  <div className="space-y-6 p-3 sm:p-6">
   <ArchiveCardButton type="button" onClick={() => router.push("/events")}>{t("leagueUi.s2")}</ArchiveCardButton>
   <div className="space-y-4 text-center">
    <div className="relative mx-auto flex w-full max-w-xl items-center justify-center py-3">
     <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[calc(50%-5rem)] bg-contain bg-left bg-no-repeat sm:w-[calc(50%-6rem)]" style={{backgroundImage:'url("/images/events/ornate-left.png")'}} />
     {showcaseEnabled ? <div className="relative z-10 flex min-h-48 w-full max-w-72 flex-col items-center justify-center gap-3 rounded-xl border border-accent-gold/35 bg-gradient-to-b from-accent-gold/10 to-transparent px-4 py-6 sm:min-h-64 sm:max-w-80">
       <span className="font-heading text-xs uppercase tracking-[0.2em] text-accent-gold">{locale === "fi" ? "Liigakauden pääpalkinto" : "Season grand prize"}</span>
       {showcaseConfig.variant ? <TrophyArt variant={showcaseConfig.variant} /> : <Trophy className="h-24 w-24 text-accent-gold/65" strokeWidth={1} />}
       <span className="font-heading text-lg text-accent-gold">{showcaseConfig.variant ? trophyNames[showcaseConfig.variant] : (locale === "fi" ? "Palkinto valitsematta" : "Prize not selected")}</span>
       <span className="text-center text-xs text-muted-foreground">{showcaseWinner ? (locale === "fi" ? "Voittaja: " : "Winner: ")+showcaseWinner.winner_name : (locale === "fi" ? "Palkinto odottaa voittajaansa" : "Awaiting its champion")}</span>
       <span className="text-center text-xs text-muted-foreground">{showcaseSeason.name}</span>
      </div> : <img src="/images/events/league.png" alt={t("leagueUi.s68")} className="relative z-10 aspect-square w-32 rounded-lg border border-accent-gold/30 object-cover sm:w-40" />}
     <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[calc(50%-5rem)] bg-contain bg-right bg-no-repeat sm:w-[calc(50%-6rem)]" style={{backgroundImage:'url("/images/events/ornate-right.png")'}} />
    </div>
    {showcaseEnabled && hub.isOwner && !showcaseWinner && <div className="mx-auto w-full max-w-lg rounded-lg border border-accent-gold/25 bg-background/30 p-3 text-left">
      <button type="button" onClick={() => setChoosingTrophy(choosingTrophy === showcaseSeason.id ? null : showcaseSeason.id)} className="flex w-full items-center justify-between gap-2 text-sm text-accent-gold">
       <span>{showcaseConfig.variant ? (locale === "fi" ? "Vaihda pääpalkintoa" : "Change grand prize") : (locale === "fi" ? "Valitse kauden pääpalkinto" : "Choose the season grand prize")}</span><span aria-hidden="true">{choosingTrophy === showcaseSeason.id ? "−" : "+"}</span>
      </button>
      {choosingTrophy === showcaseSeason.id && <div className="mt-3 grid grid-cols-3 gap-2">
       {(["crystal","pennant","sculpture"] as const).map(variant => <button key={variant} type="button" disabled={busy} aria-pressed={showcaseConfig.variant === variant}
        className={"flex min-w-0 flex-col items-center gap-2 rounded-lg border p-3 text-center text-xs "+(showcaseConfig.variant===variant?"border-accent-gold bg-accent-gold/15":"border-accent-gold/20")}
        onClick={async () => {setBusy(true);setError("");try{const result=await setLeagueSeasonTrophy(id,showcaseSeason.id,variant);if(result.error)setError(result.error);else {setChoosingTrophy(null);await refresh()}}finally{setBusy(false)}}}>
        <TrophyArt variant={variant} size="small"/><span>{trophyNames[variant]}</span>
       </button>)}
      </div>}
     </div>}
    <p className="text-sm uppercase tracking-widest text-accent-gold">{t("leagueUi.s3")}</p>
    <h1 className="font-heading text-3xl break-words">{hub.league.name}</h1>
    <p className="text-sm text-muted-foreground">{hub.league.privacy==="public"?t("leagueUi.s50"):t("leagueUi.s51")}</p>
    {hub.league.game && <p className="text-accent-gold">{hub.league.game}</p>}
    {hub.league.description && <p className="whitespace-pre-wrap text-muted-foreground">{hub.league.description}</p>}
   </div>

   {hub.isOwner && <div className="flex flex-wrap gap-3">
    <ArchiveCardButton disabled={busy} onClick={() => {
     setLeagueDraft({ name: hub.league!.name, game: hub.league!.game || "", description: hub.league!.description || "", privacy: hub.league!.privacy as "public" | "private" })
     setEditing(!editing); setError("")
    }}>{editing ? t("leagueUi.s52") : t("leagueUi.s5")}</ArchiveCardButton>
    <ArchiveCardButton disabled={busy} onClick={async () => {
     if (!window.confirm(t("leagueUi.confirmDelete", { name: hub.league!.name }))) return
     setBusy(true); setError("")
     try { const result = await deleteLeague(id); if (result.error) setError(result.error); else router.push("/events") }
     catch { setError(t("leagueUi.s53")) }
     finally { setBusy(false) }
    }}>{t("leagueUi.s4")}</ArchiveCardButton>
   </div>}
   {editing && hub.isOwner && <ArchiveCard corners={false} centerOrnaments={false}><ArchiveCardContent className="space-y-4 p-4">
    <h2 className="font-heading text-xl text-accent-gold">{t("leagueUi.s5")}</h2>
    <label className="block space-y-1">{t("leagueUi.s6")}<input maxLength={120} value={leagueDraft.name} onChange={e => setLeagueDraft({ ...leagueDraft, name: e.target.value })} className="w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
    <label className="block space-y-1">{t("leagueUi.s7")}<input value={leagueDraft.game} onChange={e => setLeagueDraft({ ...leagueDraft, game: e.target.value })} className="w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
    <label className="block space-y-1">{t("leagueUi.s8")}<textarea value={leagueDraft.description} onChange={e => setLeagueDraft({ ...leagueDraft, description: e.target.value })} rows={4} className="w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
    <label className="block space-y-1">{t("leagueUi.s9")}<select value={leagueDraft.privacy} onChange={e => setLeagueDraft({ ...leagueDraft, privacy: e.target.value as "public" | "private" })} className="w-full rounded-md border border-accent-gold/30 bg-background p-3"><option value="public">{t("leagueUi.s10")}</option><option value="private">{t("leagueUi.s11")}</option></select></label>
    <ArchiveCardButton disabled={busy || leagueDraft.name.trim().length < 2} onClick={async () => {
     setBusy(true); setError("")
     try { const result = await updateLeague(id, leagueDraft); if (result.error) setError(result.error); else { setEditing(false); await refresh() } }
     catch { setError(t("leagueUi.s54")) }
     finally { setBusy(false) }
    }}>{t("leagueUi.s12")}</ArchiveCardButton>
   </ArchiveCardContent></ArchiveCard>}
   {error && <p role="alert" className="text-red-400">{error}</p>}
   <ArchiveCard corners={false} centerOrnaments={false}>
    <ArchiveCardHeader><ArchiveCardTitle>{t("leagueUi.memberCount", { count: hub.members.length })}</ArchiveCardTitle></ArchiveCardHeader>
    <ArchiveCardContent className="space-y-4">
     <div className="flex flex-wrap gap-3">
      {hub.members.map(member=><div key={member.user_id} className="flex items-center gap-2 rounded-lg border border-accent-gold/20 p-2">
       {member.avatar_url?<img src={member.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover"/>:<div className="h-9 w-9 rounded-full bg-accent-gold/20"/>}
       <span>{member.display_name}{member.isOwner ? ` · ${t("leagueUi.host")}` : ""}</span>
       {hub.isOwner && !member.isOwner && <button type="button" disabled={busy} className="text-xs text-red-300 underline" onClick={async()=>{
        if(!window.confirm(t("leagueUi.s57")))return
        setBusy(true);setError("")
        try{const result=await removeLeagueMember(id,member.user_id);if(result.error)setError(result.error);else await refresh()}
        finally{setBusy(false)}
       }}>{t("leagueUi.s13")}</button>}
      </div>)}
     </div>
     {!hub.isOwner && hub.league.privacy==="public" && <ArchiveCardButton disabled={busy} onClick={async()=>{
      setBusy(true);setError("")
      try{const result=hub.isMember?await leaveLeague(id):await joinLeague(id);if(result.error)setError(result.error);else await refresh()}
      finally{setBusy(false)}
     }}>{hub.isMember?t("leagueUi.s58"):t("leagueUi.s59")}</ArchiveCardButton>}
     {hub.isOwner && <div className="space-y-3">
      <label htmlFor="league-player-search" className="block text-sm text-accent-gold">{t("leagueUi.s14")}</label>
      <input id="league-player-search" autoComplete="off" placeholder={t("leagueUi.s40")}
       value={newMember} onChange={e=>{setNewMember(e.target.value);setSelectedPlayer(null)}}
       className="w-full rounded-md border border-accent-gold/30 bg-background px-3 py-2"/>
      {searchingPlayers && <p className="text-sm text-muted-foreground">{t("leagueUi.s15")}</p>}
      {!searchingPlayers && newMember.trim().length>=2 && playerResults.length===0 && <p className="text-sm text-muted-foreground">{t("leagueUi.s16")}</p>}
      {playerResults.length>0 && <div role="group" aria-label={t("leagueUi.s41")} className="space-y-1">
       {playerResults.filter(player=>!hub.members.some(member=>member.user_id===player.id)).map(player=><button key={player.id} type="button"
        onClick={()=>setSelectedPlayer(player.id)}
        className={"flex w-full items-center gap-3 rounded-md border p-2 text-left "+(selectedPlayer===player.id?"border-accent-gold bg-accent-gold/10":"border-accent-gold/20")}>
        {player.avatar_url?<img src={player.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover"/>:<div className="h-9 w-9 rounded-full bg-accent-gold/20"/>}
        <span className="min-w-0"><span className="block truncate">{player.display_name||player.username||t("leagueUi.s27")}</span>
         {player.username && <span className="block truncate text-xs text-muted-foreground">@{player.username}</span>}</span>
        {selectedPlayer===player.id && <span className="ml-auto text-accent-gold">✓</span>}
       </button>)}
      </div>}
      <ArchiveCardButton disabled={busy||!selectedPlayer} onClick={async()=>{
       if(!selectedPlayer)return
       setBusy(true);setError("")
       try{const result=await addLeagueMemberById(id,selectedPlayer);if(result.error)setError(result.error);else{setNewMember("");setSelectedPlayer(null);setPlayerResults([]);await refresh()}}
       catch{setError(t("leagueUi.s56"))}
       finally{setBusy(false)}
      }}>{t("leagueUi.s17")}</ArchiveCardButton>
     </div>}
    </ArchiveCardContent>
   </ArchiveCard>}
   {hub.league.legacy_event_id && <div className="rounded-lg border border-accent-gold/25 p-4 space-y-2">
     <p className="text-sm text-muted-foreground">{t("leagueUi.s18")}</p>
     <ArchiveCardButton onClick={() => router.push("/events/" + hub.league.legacy_event_id)}>{t("leagueUi.s19")}</ArchiveCardButton>
   </div>}
   {hub.seasons.some((season) => season.status === "completed") && <ArchiveCardButton type="button" onClick={() => setShowCompletedSeasons((shown) => !shown)}>{showCompletedSeasons ? (locale === "fi" ? "Piilota päättyneet kaudet" : "Hide completed seasons") : (locale === "fi" ? "Näytä päättyneet kaudet" : "Show completed seasons")}</ArchiveCardButton>}
   {hub.seasons.filter((season) => season.status !== "completed" || showCompletedSeasons).map((season) => <ArchiveCard key={season.id} corners={false} centerOrnaments={false}>
    <ArchiveCardHeader><ArchiveCardTitle>{season.name} {season.status === "completed" && <span className="ml-2 text-sm text-emerald-300">{locale === "fi" ? "Päättynyt" : "Completed"}</span>}</ArchiveCardTitle></ArchiveCardHeader>
    <ArchiveCardContent className="space-y-4">
     <p className="text-sm text-muted-foreground">{season.starts_on ? new Date(`${season.starts_on}T12:00:00`).toLocaleDateString(locale === "fi" ? "fi-FI" : "en-GB") : t("leagueUi.s60")} – {season.ends_on ? new Date(`${season.ends_on}T12:00:00`).toLocaleDateString(locale === "fi" ? "fi-FI" : "en-GB") : t("leagueUi.s61")}</p>

     {hub.isOwner && <div className="space-y-3">
      <ArchiveCardButton disabled={busy} onClick={() => {
       setEditingSeason(editingSeason === season.id ? null : season.id)
       setSeasonDraft({ name: season.name, startsOn: season.starts_on || "", endsOn: season.ends_on || "" })
       setError("")
      }}>{editingSeason === season.id ? t("leagueUi.s62") : t("leagueUi.s63")}</ArchiveCardButton>
      {editingSeason === season.id && <div className="space-y-3 rounded-md border border-accent-gold/20 p-3">
       <label className="block space-y-1">{t("leagueUi.s20")}<input maxLength={120} value={seasonDraft.name} onChange={e => setSeasonDraft({ ...seasonDraft, name: e.target.value })} className="w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
       <label className="block space-y-1">{t("leagueUi.s21")}<input type="date" value={seasonDraft.startsOn} onChange={e => setSeasonDraft({ ...seasonDraft, startsOn: e.target.value })} className="w-full min-w-0 max-w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
       <label className="block space-y-1">{t("leagueUi.s22")}<input type="date" value={seasonDraft.endsOn} onChange={e => setSeasonDraft({ ...seasonDraft, endsOn: e.target.value })} className="w-full min-w-0 max-w-full rounded-md border border-accent-gold/30 bg-background p-3" /></label>
       <ArchiveCardButton disabled={busy || !seasonDraft.name.trim()} onClick={async () => {
        setBusy(true); setError("")
        try { const result = await updateLeagueSeason(id, season.id, seasonDraft); if (result.error) setError(result.error); else { setEditingSeason(null); await refresh() } }
        catch { setError(t("leagueUi.s64")) }
        finally { setBusy(false) }
       }}>{t("leagueUi.s23")}</ArchiveCardButton>
      </div>}
     </div>}
     {(season.award_config as any)?.category && (season.award_config as any)?.category !== "none" && <div className="space-y-3 rounded-lg border border-accent-gold/30 bg-accent-gold/5 p-4">
      <div className="flex items-center gap-3">
       {(season.award_config as any)?.variant ? <TrophyArt variant={(season.award_config as any).variant} size="small"/> : <Trophy className="h-10 w-10 text-accent-gold"/>}
       <div><h3 className="font-heading text-accent-gold">{locale === "fi" ? "Kauden pääpalkinto" : "Season grand prize"}</h3>
        <p className="text-sm text-muted-foreground">{(season.award_config as any)?.variant ? trophyNames[(season.award_config as any).variant as keyof typeof trophyNames] : (locale === "fi" ? "Palkintoa ei ole vielä valittu" : "Prize not yet selected")}</p></div>
      </div>
      {hub.seasonTrophies?.find(trophy => trophy.season_id === season.id) ? <p className="font-heading text-accent-gold">{locale === "fi" ? "Voittaja: " : "Winner: "}{hub.seasonTrophies.find(trophy => trophy.season_id === season.id)?.winner_name}</p> : <>
       {hub.isOwner && <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{locale === "fi" ? "Voit valita tai vaihtaa palkintoa ennen voittajan vahvistamista." : "Choose or change the prize before confirming the winner."}</p>
        <div className="grid grid-cols-3 gap-2">{(["crystal","pennant","sculpture"] as const).map(variant => <button key={variant} type="button" disabled={busy} aria-pressed={(season.award_config as any)?.variant===variant} className={"flex flex-col items-center gap-2 rounded-lg border p-2 text-xs "+((season.award_config as any)?.variant===variant?"border-accent-gold bg-accent-gold/15":"border-accent-gold/20")} onClick={async()=>{setBusy(true);setError("");try{const result=await setLeagueSeasonTrophy(id,season.id,variant);if(result.error)setError(result.error);else await refresh()}finally{setBusy(false)}}}><TrophyArt variant={variant} size="small"/>{trophyNames[variant]}</button>)}</div>
        {season.status === "completed" && <div className="space-y-3">
         <label className="block space-y-1 text-sm"><span>{locale === "fi" ? "Vahvista kauden voittaja" : "Confirm season winner"}</span>
          <select value={awardSelections[season.id] || ""} onChange={e=>setAwardSelections(old=>({...old,[season.id]:e.target.value}))} className="w-full rounded-md border border-accent-gold/30 bg-background p-3">
           <option value="">{locale === "fi" ? "Valitse voittaja" : "Select winner"}</option>
           {hub.standings.filter(row=>row.season_id===season.id&&row.played>0&&row.key.startsWith("user:")).map(row=><option key={row.key} value={row.key.slice(5)}>{row.name} · {row.points} {locale === "fi" ? "pistettä" : "points"}</option>)}
          </select>
         </label>
         <ArchiveCardButton disabled={busy || !awardSelections[season.id] || !(season.award_config as any)?.variant} onClick={async()=>{
          const variant=(season.award_config as any)?.variant as "crystal"|"pennant"|"sculpture"|undefined
          if(!variant||!awardSelections[season.id])return
          if(!window.confirm(locale==="fi"?"Jaetaanko valittu pääpalkinto vahvistetulle voittajalle?":"Award the grand prize to the confirmed winner?"))return
          setBusy(true);setError("")
          try{const result=await awardLeagueWinnerTrophy(season.id,awardSelections[season.id],variant);if(result.success)await refresh();else setError(result.error||"Award failed")}finally{setBusy(false)}
         }}>{locale==="fi"?"Vahvista pääpalkinnon jako":"Confirm grand prize"}</ArchiveCardButton>
        </div>}
       </div>}
      </>}
     </div>}
     {hub.isOwner && season.status !== "completed" && <div className="rounded-md border border-accent-gold/30 bg-accent-gold/5 p-3 space-y-2">
      <p className="text-sm text-muted-foreground">{locale === "fi" ? "Päätä kausi vasta, kun kaikki siihen liitetyt tapahtumat ja ottelut on kirjattu valmiiksi. Päättäminen vahvistaa liigasaavutusten laskennan." : "Complete the season only after all linked events and match results are finalized. Completion confirms league achievement progress."}</p>
      <ArchiveCardButton disabled={busy} onClick={async () => {
       if (!window.confirm(locale === "fi" ? "Vahvistetaanko kauden päättyminen? Tarkista ottelutulokset ensin." : "Complete this season? Check all match results first.")) return
       setBusy(true); setError("")
       try {
        const result = await completeLeagueSeason(season.id)
        if (!result.success) setError(result.error || (locale === "fi" ? "Kauden päättäminen epäonnistui." : "Could not complete season."))
        else { await refresh(); if ((season.award_config as any)?.category && (season.award_config as any)?.category !== "none") setShowCompletedSeasons(true) }
       } catch { setError(locale === "fi" ? "Kauden päättäminen epäonnistui." : "Could not complete season.") }
       finally { setBusy(false) }
      }}>{locale === "fi" ? "Vahvista kauden päättyminen" : "Confirm season completion"}</ArchiveCardButton>
     </div>}
     <section className="space-y-3">
      <h3 className="font-heading text-xl text-accent-gold">{t("leagueUi.s24")}</h3>
      {hub.standings.filter(row=>row.season_id===season.id).length===0
       ? <p className="text-sm text-muted-foreground">{t("leagueUi.s25")}</p>
       : <div className="overflow-x-auto rounded-md border border-accent-gold/25">
        <table className="w-full min-w-[490px] text-left text-sm">
         <thead className="border-b border-accent-gold/25 bg-accent-gold/10 text-accent-gold">
          <tr><th className="p-2">{t("leagueUi.s26")}</th><th className="p-2">{t("leagueUi.s27")}</th><th className="p-2 text-center" title={t("leagueUi.s42")}>T</th><th className="p-2 text-center" title={t("leagueUi.s43")}>O</th><th className="p-2 text-center" title={t("leagueUi.s44")}>{locale === "fi" ? "V" : "W"}</th><th className="p-2 text-center" title={t("leagueUi.s45")}>{locale === "fi" ? "TAS" : "D"}</th><th className="p-2 text-center" title={t("leagueUi.s46")}>{locale === "fi" ? "H" : "L"}</th><th className="p-2 text-right">{t("leagueUi.s28")}</th></tr>
         </thead>
         <tbody>{hub.standings.filter(row=>row.season_id===season.id).map((row,index)=><tr key={row.key} className="border-b border-accent-gold/10 last:border-0">
          <td className="p-2">{index+1}.</td><td className="p-2 font-medium break-words">{row.name}</td><td className="p-2 text-center">{row.tournaments}</td><td className="p-2 text-center">{row.played}</td><td className="p-2 text-center">{row.wins}</td><td className="p-2 text-center">{row.draws}</td><td className="p-2 text-center">{row.losses}</td><td className="p-2 text-right font-bold text-accent-gold">{row.points}</td>
         </tr>)}</tbody>
        </table>
       </div>}
      <p className="text-xs text-muted-foreground">{t("leagueUi.s29")}</p>
     </section>
     {hub.results.filter(result=>result.season_id===season.id).length>0 && <div className="space-y-2">
      <h3 className="font-heading text-lg text-accent-gold">{t("leagueUi.s30")}</h3>
      {hub.results.filter(result=>result.season_id===season.id).map(result=><div key={result.id} className="rounded-md border border-accent-gold/20 p-3">
       <p className="text-xs text-muted-foreground">{result.event_title}</p>
       <p className="break-words">{result.player_a} {result.score_a!==null?result.score_a:"–"} – {result.score_b!==null?result.score_b:"–"} {result.player_b}</p>
       {result.result && <p className="text-xs text-muted-foreground">{result.result}</p>}
      </div>)}
     </div>}
     <h3 className="font-heading text-lg text-accent-gold">{t("leagueUi.s31")}</h3>
     {hub.events.filter((event) => event.season_id === season.id).length === 0 && <p className="text-sm text-muted-foreground">{t("leagueUi.s32")}</p>}
     {hub.events.filter((event) => event.season_id === season.id).map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent-gold/20 p-3">
      <button type="button" onClick={() => router.push("/events/" + event.id)} className="text-left text-accent-gold hover:underline">{event.title} <span className="text-xs text-muted-foreground">· {t(`events.types.${event.event_type === "tournament" ? "tournament" : "game_night"}`)}</span></button>
      {hub.isOwner && season.status !== "completed" && <ArchiveCardButton disabled={busy} onClick={async () => {
       setBusy(true); const result = await linkSeasonEvent(id, season.id, event.id, false)
       if (result.error) setError(result.error); else await refresh(); setBusy(false)
      }}>{t("leagueUi.s33")}</ArchiveCardButton>}
     </div>)}
     {hub.isOwner && season.status !== "completed" && <div className="flex flex-wrap gap-2">
      <select aria-label={t("leagueUi.s47")} className="min-w-0 flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm" value={selected[season.id] || ""} onChange={(e) => setSelected({ ...selected, [season.id]: e.target.value })}>
       <option value="">{t("leagueUi.s34")}</option>
       {hub.available.map((event) => <option key={event.id} value={event.id}>{event.title} ({t(`events.types.${event.event_type === "tournament" ? "tournament" : "game_night"}`)})</option>)}
      </select>
      <ArchiveCardButton disabled={busy || !selected[season.id]} onClick={async () => {
       setBusy(true); setError("")
       const result = await linkSeasonEvent(id, season.id, selected[season.id], true)
       if (result.error) setError(result.error); else { setSelected({ ...selected, [season.id]: "" }); await refresh() }
       setBusy(false)
      }}>{t("leagueUi.s35")}</ArchiveCardButton>
     </div>}
     {hub.isOwner && season.status !== "completed" && <p className="text-xs text-muted-foreground">{t("leagueUi.s36")}</p>}
     {hub.isOwner && season.status !== "completed" && <ArchiveCardButton onClick={() => router.push("/events/create")}>{t("leagueUi.s37")}</ArchiveCardButton>}
    </ArchiveCardContent>
   </ArchiveCard>)}
   {hub.isOwner && <ArchiveCard corners={false} centerOrnaments={false}><ArchiveCardHeader><ArchiveCardTitle>{t("leagueUi.s38")}</ArchiveCardTitle></ArchiveCardHeader>
    <ArchiveCardContent className="flex flex-wrap gap-2">
     <input aria-label={t("leagueUi.s48")} className="min-w-0 flex-1 rounded-md border border-accent-gold/20 bg-background px-3 py-2 text-sm" value={newSeason} onChange={(e) => setNewSeason(e.target.value)} placeholder={t("leagueUi.s49")} />
     <ArchiveCardButton disabled={busy || !newSeason.trim()} onClick={async () => {
      setBusy(true); setError("")
      const result = await addLeagueSeason(id, newSeason)
      if (result.error) setError(result.error); else { setNewSeason(""); await refresh() }
      setBusy(false)
     }}>{t("leagueUi.s39")}</ArchiveCardButton>
    </ArchiveCardContent>
   </ArchiveCard>}
  </div>
 </ArchiveFrame>
}
