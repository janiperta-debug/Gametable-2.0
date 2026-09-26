"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronRight, Filter, Loader2, Plus, Search } from "lucide-react"
import { ArchiveButton, ArchiveCardButton, ArchiveFrame, archiveField } from "@/components/archive-frame"
import { ArchiveDivider } from "@/components/archive-divider"
import { Input } from "@/components/ui/input"
import { ThemeHero } from "@/components/theme-hero"
import { useTranslation } from "@/lib/i18n"
import { useEvents } from "@/hooks/useEvents"
import { useUser } from "@/hooks/useUser"
import { listLeagues } from "@/app/actions/league-hub"
import type { Event } from "@/app/actions/events"
import { cn } from "@/lib/utils"
import { LeagueTrophyImage, isLeagueTrophyVariant, type LeagueTrophyVariant } from "@/components/league-trophy-image"

// Dedicated event illustrations; collection fallback assets remain untouched.
// when they have been added to the repository.
const categoryImages: Record<string, string> = {
  game_night: "/images/events/game-night.png",
  campaign: "/images/events/campaign.png",
  tournament: "/images/events/tournament.png",
  league: "/images/events/league.png",
}
const categoryLabels = ["game_night", "campaign", "tournament", "league"] as const
const categoryBorders: Record<string, string> = {
  game_night: "border-amber-600/50", campaign: "border-emerald-700/60",
  tournament: "border-red-700/60", league: "border-blue-700/60",
}
const formatDate = (date: string, options: Intl.DateTimeFormatOptions, locale: string) =>
  new Date(date).toLocaleDateString(locale === "fi" ? "fi-FI" : "en-GB", options)
const formatTime = (date: string, locale: string) =>
  new Date(date).toLocaleTimeString(locale === "fi" ? "fi-FI" : "en-GB", { hour: "2-digit", minute: "2-digit" })

function EventRow({ event, onOpen, userId }: { event: Event; onOpen: () => void; userId?: string }) {
  const { t, locale } = useTranslation()
  const kind = event.event_type || "game_night"
  const isHost = event.host_id === userId
  return (
    <button type="button" onClick={onOpen} className="group flex w-full min-w-0 items-center gap-3 px-3 py-4 text-left transition-colors hover:bg-accent-gold/5 sm:gap-4 sm:px-5">
      <div className={cn("relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border sm:h-16 sm:w-16", categoryBorders[kind])}>
        <Image src={categoryImages[kind] || categoryImages.game_night} alt="" fill sizes="64px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="text-accent-gold">{formatDate(event.starts_at, { day: "numeric", month: "short" }, locale)} · {formatTime(event.starts_at, locale)}</span>
          <span>{t(`events.types.${kind}`)}</span>
          {isHost && <span className="rounded-full border border-accent-gold/35 px-2 py-0.5 text-accent-gold">{t("events.hosting")}</span>}
          {!isHost && event.user_rsvp && <span className="rounded-full border border-accent-gold/20 px-2 py-0.5">{event.user_rsvp === "attending" ? t("events.rsvpAttending") : event.user_rsvp === "maybe" ? t("events.rsvpMaybe") : event.user_rsvp === "invited" ? t("events.invited") : event.user_rsvp === "declined" ? t("events.rsvpDeclined") : event.user_rsvp}</span>}
        </div>
        <div className="break-words font-heading text-base text-foreground group-hover:text-accent-gold sm:text-lg">{event.title}</div>
        <div className="truncate text-xs text-muted-foreground sm:text-sm">{event.location || event.host?.display_name || ""}{event.participant_count != null ? ` · ${t("events.participantCount", { count: event.participant_count })}` : ""}</div>
        {event.event_type === "tournament" && event.winner_name && <p className="text-xs text-accent-gold sm:text-sm">🏆 {locale === "fi" ? "Voittaja" : "Winner"}: {event.winner_name}</p>}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-accent-gold/70" />
    </button>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const { user } = useUser()
  const { publicEvents, myEvents, pastEvents, loading, error } = useEvents()
  const [leagues, setLeagues] = useState<Awaited<ReturnType<typeof listLeagues>>["leagues"]>([])
  const [leagueError, setLeagueError] = useState("")
  const [query, setQuery] = useState("")
  const [types, setTypes] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [allCommunities, setAllCommunities] = useState(false)
  const [allUpcoming, setAllUpcoming] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyAll, setHistoryAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    listLeagues().then((result) => {
      if (!cancelled) { setLeagues(result.leagues); setLeagueError(result.error || "") }
    }).catch(() => { if (!cancelled) setLeagueError("events.leagueLoadFailed") })
    return () => { cancelled = true }
  }, [user?.id])

  const convertedIds = useMemo(() => new Set(leagues.map((league) => league.legacy_event_id).filter(Boolean)), [leagues])
  const matches = (event: Event) =>
    (types.length === 0 || types.includes(event.event_type || "game_night")) &&
    (event.title.toLocaleLowerCase("fi-FI").includes(query.toLocaleLowerCase("fi-FI")) ||
     (event.description || "").toLocaleLowerCase("fi-FI").includes(query.toLocaleLowerCase("fi-FI")))
  const upcoming = useMemo(() => {
    const byId = new Map<string, Event>()
    for (const event of [...publicEvents, ...myEvents]) {
      if (event.event_type === "league" && convertedIds.has(event.id)) continue
      if (event.status === "completed" || event.status === "cancelled") continue
      if (event.event_type === "league" || event.event_type === "campaign") continue
      byId.set(event.id, { ...byId.get(event.id), ...event })
    }
    return [...byId.values()].filter(matches).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [publicEvents, myEvents, convertedIds, query, types])
  const communities = useMemo(() => {
    const ownLeagues = user ? leagues.filter((league) => league.owner_id === user.id && (league.league_seasons?.length === 0 || league.league_seasons?.some((season) => season.status !== "completed"))) : []
    const ownCampaigns = user ? myEvents.filter((event) => event.event_type === "campaign" && event.status !== "cancelled" && event.status !== "completed") : []
    const oldLeagues = user ? myEvents.filter((event) => event.event_type === "league" && !convertedIds.has(event.id) && event.status !== "cancelled" && event.status !== "completed") : []
    return [
      ...ownLeagues.map((league) => { const season = league.league_seasons?.find((s) => s.status !== "completed") || league.league_seasons?.[0]; const config = season?.award_config as {category?:string;variant?:string}|null; return { id: league.id, title: league.name, kind: "league", subtitle: season?.name || "league", href: "/leagues/" + league.id, trophyVariant: config?.category && config.category !== "none" && isLeagueTrophyVariant(config.variant) ? config.variant : null } }),
      ...ownCampaigns.map((event) => ({ id: event.id, title: event.title, kind: "campaign", subtitle: "campaign", href: "/events/" + event.id, trophyVariant: null as LeagueTrophyVariant | null })),
      ...oldLeagues.map((event) => ({ id: event.id, title: event.title, kind: "league", subtitle: "legacyLeague", href: "/events/" + event.id })),
    ]
  }, [leagues, myEvents, convertedIds, user?.id])
  const history = useMemo(() => pastEvents.filter((event) => !(event.event_type === "league" && convertedIds.has(event.id))).filter(matches).sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()), [pastEvents, convertedIds, query, types])
  // A league belongs to history when every season is completed. Preserve
  // leagues with active seasons in the active section, even if older seasons ended.
  const completedLeagues = useMemo(() => leagues.filter(league =>
    league.league_seasons?.length > 0 &&
    league.league_seasons.every(season => season.status === "completed") &&
    (types.length === 0 || types.includes("league")) &&
    (league.name.toLocaleLowerCase("fi-FI").includes(query.toLocaleLowerCase("fi-FI")) ||
     (league.game || "").toLocaleLowerCase("fi-FI").includes(query.toLocaleLowerCase("fi-FI")))
  ), [leagues, query, types])
  const visibleUpcoming = allUpcoming ? upcoming : upcoming.slice(0, 5)
  const visibleHistory = historyAll ? history : history.slice(0, 10)

  return <div className="min-h-screen room-environment">
    <main className="container mx-auto px-4 py-8">
      <ThemeHero page="events" mode="backdrop">
        <div className="text-center">
          <h1 className="logo-text text-5xl font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{t("events.title")}</h1>
          <p className="mx-auto mt-4 max-w-3xl font-body text-xl text-foreground/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">{t("events.subtitle")}</p>
        </div>
      </ThemeHero>

      <div className="mx-auto mt-6 flex max-w-4xl justify-center">
        <ArchiveButton onClick={() => router.push("/events/create")} icon={<Plus className="h-4 w-4" />}>{t("events.createEvent")}</ArchiveButton>
      </div>

      <div className="mx-auto mt-6 max-w-4xl space-y-6">
        {user && <ArchiveFrame>
          <section className="space-y-4 p-4 sm:p-6">
            <h2 className="font-heading text-xl text-accent-gold sm:text-2xl">{t("events.myLeaguesCampaigns")}</h2>
            {leagueError && <p role="status" className="text-sm text-muted-foreground">{leagueError === "events.leagueLoadFailed" ? t(leagueError) : leagueError}</p>}
            {communities.length === 0 ? <p className="text-sm text-muted-foreground">{t("events.myLeaguesCampaignsEmpty")}</p> :
              <div className="grid grid-cols-2 gap-3">
                {(allCommunities ? communities : communities.slice(0, 2)).map((item) => <button key={item.kind + item.id} type="button" onClick={() => router.push(item.href)} className={cn("group min-w-0 overflow-hidden rounded-xl border text-left transition-colors hover:bg-accent-gold/10", categoryBorders[item.kind])}>
                  <div className="relative aspect-[2/1] w-full overflow-hidden">
                    {item.trophyVariant ? <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#401c25] to-[#1c0e14]"><LeagueTrophyImage variant={item.trophyVariant} alt="" className="h-full w-full p-1" iconClassName="h-16 w-16" /></div> : <Image src={categoryImages[item.kind]} alt="" fill sizes="(max-width: 640px) 50vw, 320px" className="object-cover" />}
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="break-words font-heading text-sm text-foreground group-hover:text-accent-gold sm:text-lg">{item.title}</div>
                    <div className="text-xs text-muted-foreground sm:text-sm">{item.subtitle === "league" ? t("events.types.league") : item.subtitle === "campaign" ? t("events.types.campaign") : item.subtitle === "legacyLeague" ? t("events.legacyLeague") : item.subtitle}</div>
                  </div>
                </button>)}
              </div>}
            {communities.length > 2 && <button type="button" onClick={() => setAllCommunities(!allCommunities)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent-gold/25 py-3 text-sm text-accent-gold hover:bg-accent-gold/10">
              {allCommunities ? t("events.showLess") : t("events.showAllCount", { count: communities.length })} <ChevronDown className={cn("h-4 w-4", allCommunities && "rotate-180")} />
            </button>}
          </section>
        </ArchiveFrame>}

        <ArchiveFrame>
          <section className="space-y-4 p-4 sm:p-6">
            <h2 className="font-heading text-xl text-accent-gold sm:text-2xl">{t("events.nextEvents")}</h2>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label={t("events.searchEvents")} placeholder={t("events.searchEvents")} value={query} onChange={(event) => { setQuery(event.target.value); setAllUpcoming(false) }} className={cn("w-full pl-10", archiveField)} />
              </div>
              <ArchiveCardButton active={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} icon={<Filter className="h-4 w-4" />}>{filtersOpen ? t("events.hideFilters") : t("events.filters")}{types.length ? ` (${types.length})` : ""}</ArchiveCardButton>
              {filtersOpen && <div className="flex flex-wrap gap-2 rounded-lg border border-accent-gold/20 p-3">
                {categoryLabels.map((kind) => <button type="button" key={kind} aria-pressed={types.includes(kind)} onClick={() => setTypes((current) => current.includes(kind) ? current.filter((value) => value !== kind) : [...current, kind])} className={cn("rounded-lg border px-3 py-2 text-sm", types.includes(kind) ? "border-accent-gold bg-accent-gold/15 text-accent-gold" : "border-accent-gold/20 text-muted-foreground")}>{t(`events.types.${kind}`)}</button>)}
                {types.length > 0 && <button type="button" className="px-2 text-sm text-accent-gold underline" onClick={() => setTypes([])}>{t("events.clear")}</button>}
              </div>}
            </div>
            {loading ? <Loader2 className="mx-auto h-7 w-7 animate-spin text-accent-gold" /> :
              error ? <p role="alert" className="text-sm text-red-400">{error}</p> :
              upcoming.length === 0 ? <p className="py-5 text-sm text-muted-foreground">{t("events.noMatchingUpcoming")}</p> :
              <div className="overflow-hidden rounded-lg border border-accent-gold/20">
                {visibleUpcoming.map((event, index) => <div key={event.id}>{index > 0 && <ArchiveDivider variant="subtle" />}<EventRow event={event} onOpen={() => router.push("/events/" + event.id)} userId={user?.id} /></div>)}
              </div>}
            {upcoming.length > 5 && <button type="button" onClick={() => setAllUpcoming(!allUpcoming)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent-gold/25 py-3 text-sm text-accent-gold hover:bg-accent-gold/10">
              {allUpcoming ? t("events.showLess") : t("events.showAllUpcoming", { count: upcoming.length })} <ChevronDown className={cn("h-4 w-4", allUpcoming && "rotate-180")} />
            </button>}
          </section>
        </ArchiveFrame>

        <ArchiveFrame>
          <section className="p-4 sm:p-6">
            <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen(!historyOpen)} className="flex w-full items-center justify-between gap-3 text-left">
              <span className="font-heading text-xl text-accent-gold sm:text-2xl">{t("events.pastEvents")}</span>
              <ChevronDown className={cn("h-5 w-5 shrink-0 text-accent-gold transition-transform", historyOpen && "rotate-180")} />
            </button>
            {historyOpen && <div className="mt-4 space-y-4">
              {completedLeagues.length > 0 && <div className="overflow-hidden rounded-lg border border-accent-gold/20">
                {completedLeagues.map((league, index) => <div key={league.id}>
                  {index > 0 && <ArchiveDivider variant="subtle" />}
                  <button type="button" onClick={() => router.push("/leagues/" + league.id)}
                    className="group flex w-full items-center gap-3 px-3 py-4 text-left hover:bg-accent-gold/5 sm:px-5">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-blue-700/60 sm:h-16 sm:w-16">
                      <Image src={categoryImages.league} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-accent-gold">{t("events.types.league")} · {locale === "fi" ? "Päättynyt" : "Completed"}</p>
                      <p className="break-words font-heading text-base group-hover:text-accent-gold sm:text-lg">{league.name}</p>
                      <p className="text-xs text-muted-foreground">{league.league_seasons?.map(season => season.name).join(", ")}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-accent-gold/70" />
                  </button>
                </div>)}
              </div>}
              {loading ? <Loader2 className="mx-auto h-7 w-7 animate-spin text-accent-gold" /> :
                history.length === 0 ? (completedLeagues.length === 0 ? <p className="text-sm text-muted-foreground">{t("events.noPastEvents")}</p> : null) :
                <div className="overflow-hidden rounded-lg border border-accent-gold/20">
                  {visibleHistory.map((event, index) => {
                    const month = formatDate(event.starts_at, { month: "long", year: "numeric" }, locale)
                    const previous = index > 0 ? formatDate(visibleHistory[index - 1].starts_at, { month: "long", year: "numeric" }, locale) : ""
                    return <div key={event.id}>
                      {month !== previous && <div className="border-b border-accent-gold/20 bg-accent-gold/5 px-4 py-2 font-heading text-sm capitalize text-accent-gold">{month}</div>}
                      {month === previous && <ArchiveDivider variant="subtle" />}
                      <EventRow event={event} onOpen={() => router.push("/events/" + event.id)} userId={user?.id} />
                    </div>
                  })}
                </div>}
              {history.length > 10 && <button type="button" onClick={() => setHistoryAll(!historyAll)} className="w-full rounded-lg border border-accent-gold/25 py-3 text-sm text-accent-gold">{historyAll ? t("events.showLess") : t("events.showFullHistory")}</button>}
            </div>}
          </section>
        </ArchiveFrame>
      </div>
    </main>
  </div>
}
