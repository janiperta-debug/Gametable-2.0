"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Search, ArrowLeft, Minus, Plus, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateTCGCollectionDetails, updateTCGCollectionQuantity } from "@/app/actions/tcg"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { CollectionEntry } from "@/lib/types/collection"
import { ArchiveCard, ArchiveCardButton, ArchiveFrame, ArchiveIconButton, archiveField } from "@/components/archive-frame"

type GameInfo = { id: string; label: string; logo: string; style: string }

const GAMES: GameInfo[] = [
  { id: "pokemon", label: "Pokémon", logo: "/images/tcg-logos/pokemon.svg", style: "font-black tracking-tight" },
  { id: "mtg", label: "Magic: The Gathering", logo: "/images/tcg-logos/magic.svg", style: "font-serif font-bold italic" },
  { id: "yugioh", label: "Yu-Gi-Oh!", logo: "/images/tcg-logos/yugioh.svg", style: "font-black italic tracking-tight" },
  { id: "lorcana", label: "Disney Lorcana", logo: "/images/tcg-logos/lorcana.svg", style: "font-serif font-bold" },
  { id: "fab", label: "Flesh and Blood", logo: "/images/tcg-logos/flesh-and-blood.svg", style: "font-serif font-bold" },
  { id: "onepiece", label: "One Piece Card Game", logo: "/images/tcg-logos/one-piece.svg", style: "font-black italic" },
  { id: "riftbound", label: "Riftbound", logo: "/images/tcg-logos/riftbound.svg", style: "font-black tracking-widest" },
  { id: "digimon", label: "Digimon Card Game", logo: "/images/tcg-logos/digimon.svg", style: "font-black italic" },
  { id: "gundam", label: "Gundam Card Game", logo: "/images/tcg-logos/gundam.svg", style: "font-black italic" },
  { id: "star-wars-unlimited", label: "Star Wars: Unlimited", logo: "/images/tcg-logos/star-wars-unlimited.svg", style: "font-black tracking-wide" },
  { id: "dragon-ball-fusion-world", label: "Dragon Ball Super: Fusion World", logo: "/images/tcg-logos/dragon-ball-fusion-world.svg", style: "font-black italic" },
]

function readString(entry: CollectionEntry, key: string): string | null {
  const value = entry.metadata[key]
  return typeof value === "string" && value.trim() ? value : null
}

function readIds(entry: CollectionEntry): string[] {
  return Array.isArray(entry.metadata.ownership_ids)
    ? entry.metadata.ownership_ids.filter((id): id is string => typeof id === "string")
    : [entry.ownershipId]
}

function GameLogo({ game }: { game: GameInfo }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="flex h-20 items-center justify-center p-3">
      {!failed ? (
        <Image src={game.logo} alt={game.label} width={220} height={76} className="max-h-14 w-full object-contain" onError={() => setFailed(true)} />
      ) : (
        <span className={`text-center text-lg text-foreground ${game.style}`}>{game.label}</span>
      )}
    </div>
  )
}

export function TCGCollectionView({ entries, onUpdate }: { entries: CollectionEntry[]; onUpdate: () => void }) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<"name" | "set" | "rarity" | "recent">("name")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<CollectionEntry | null>(null)
  const [editCondition, setEditCondition] = useState("near_mint")
  const [editFoil, setEditFoil] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)

  const tcgEntries = useMemo(() => entries.filter((entry) => entry.domain === "tcg"), [entries])
  const grouped = useMemo(() => {
    const map = new Map<string, CollectionEntry[]>()
    for (const entry of tcgEntries) {
      const game = readString(entry, "tcg_system") ?? "unknown"
      map.set(game, [...(map.get(game) ?? []), entry])
    }
    return map
  }, [tcgEntries])

  const game = GAMES.find((item) => item.id === selectedGame)
  const visibleEntries = useMemo(() => {
    if (!selectedGame) return []
    const filtered = (grouped.get(selectedGame) ?? []).filter((entry) => {
      const text = [entry.displayName, readString(entry, "set_name"), readString(entry, "set_code"), readString(entry, "rarity")].filter(Boolean).join(" ").toLocaleLowerCase()
      return text.includes(query.toLocaleLowerCase())
    })
    return filtered.sort((a, b) => {
      if (sort === "set") return (readString(a, "set_name") ?? "").localeCompare(readString(b, "set_name") ?? "") || a.displayName.localeCompare(b.displayName)
      if (sort === "rarity") return (readString(a, "rarity") ?? "").localeCompare(readString(b, "rarity") ?? "") || a.displayName.localeCompare(b.displayName)
      if (sort === "recent") return (b.metadata.added_at as string ?? "").localeCompare(a.metadata.added_at as string ?? "")
      return a.displayName.localeCompare(b.displayName)
    })
  }, [grouped, selectedGame, query, sort])

  async function changeQuantity(entry: CollectionEntry, delta: number) {
    setBusyId(entry.ownershipId)
    const result = await updateTCGCollectionQuantity(entry.ownershipId, delta, readIds(entry))
    setBusyId(null)
    if (result.success) onUpdate()
    else window.alert(result.error ?? "Kortin määrän muuttaminen epäonnistui.")
  }

  if (!selectedGame) {
    const available = GAMES.filter((item) => (grouped.get(item.id)?.length ?? 0) > 0)
    return (
      <section className="space-y-5">
        <div>
          <h2 className="font-heading text-2xl font-semibold">Korttipelit</h2>
          <p className="mt-1 text-sm text-muted-foreground">Valitse peli avataksesi sen korttikokoelman.</p>
        </div>
        {available.length === 0 ? (
          <ArchiveCard><div className="p-8 text-center text-muted-foreground">Kokoelmassasi ei ole vielä kortteja.</div></ArchiveCard>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {available.map((item) => (
              <ArchiveCard key={item.id} className="h-full transition-transform hover:scale-[1.02]">
                <button type="button" onClick={() => { setSelectedGame(item.id); setQuery("") }} className="group flex h-full w-full flex-col p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-gold">
                  <GameLogo game={item} />
                  <div className="mt-3 flex w-full items-center justify-between gap-2">
                    <span className="min-w-0 text-sm font-medium">{item.label}</span>
                    <span className="shrink-0 rounded-full bg-[var(--archive-gold,#d9b65c)]/15 px-2 py-1 text-xs text-[var(--archive-gold,#d9b65c)]">{grouped.get(item.id)?.length ?? 0}</span>
                  </div>
                </button>
              </ArchiveCard>
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setSelectedGame(null)} className="inline-flex items-center gap-2 text-sm text-accent-gold hover:underline"><ArrowLeft className="h-4 w-4" /> Kaikki korttipelit</button>
        <span className="text-sm text-muted-foreground">{visibleEntries.length} korttia</span>
      </div>
      <ArchiveCard>
        <div className="flex items-center gap-3 p-3">
          {game && <div className="w-36 shrink-0"><GameLogo game={game} /></div>}
          <div className="min-w-0"><h2 className="font-heading text-xl font-semibold">{game?.label}</h2><p className="text-sm text-muted-foreground">{grouped.get(selectedGame)?.length ?? 0} erilaista korttia</p></div>
        </div>
      </ArchiveCard>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hae korteista..." className={`h-10 w-full rounded-md px-3 pl-9 text-sm outline-none ${archiveField}`} />
        </div>
        <label className={`flex h-10 items-center gap-2 rounded-md px-3 text-sm ${archiveField}`}>
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="min-w-0 bg-transparent outline-none">
            <option value="name">Nimi A–Ö</option><option value="set">Setti</option><option value="rarity">Harvinaisuus</option><option value="recent">Viimeksi lisätty</option>
          </select>
        </label>
      </div>
      {visibleEntries.length === 0 ? <div className="py-10 text-center text-muted-foreground">Hakuehdoilla ei löytynyt kortteja.</div> : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {visibleEntries.map((entry) => {
            const quantity = typeof entry.metadata.quantity === "number" ? entry.metadata.quantity : 1
            const setName = readString(entry, "set_name")
            const setCode = readString(entry, "set_code")
            const rarity = readString(entry, "rarity")
            return (
              <ArchiveFrame key={entry.ownershipId} weight="hairline" corners={false} centerOrnaments={false} className="min-w-0 overflow-hidden rounded-lg">
                <article className="min-w-0">
                  <button type="button" onClick={() => { setSelectedCard(entry); setEditCondition(readString(entry, "condition") ?? "near_mint"); setEditFoil(entry.metadata.foil === true) }} className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--archive-gold,#d9b65c)]">
                    <div className="aspect-[3/4] bg-black/20">
                      <Image src={entry.image || "/images/fallbacks/tcg-fallback.png"} alt={entry.displayName} width={300} height={400} sizes="(max-width: 640px) 31vw, (max-width: 1024px) 19vw, 14vw" className="h-full w-full object-contain" />
                    </div>
                    <div className="space-y-1 p-2 pb-0">
                      <h3 className="line-clamp-2 min-h-9 text-xs font-semibold leading-4 sm:text-sm">{entry.displayName}</h3>
                      {(setName || setCode) && <p className="line-clamp-1 text-[10px] text-muted-foreground sm:text-xs">{[setName, setCode].filter(Boolean).join(" · ")}</p>}
                      {rarity && <p className="line-clamp-1 text-[10px] text-muted-foreground sm:text-xs">{rarity}</p>}
                    </div>
                  </button>
                  <div className="flex items-center justify-between gap-1 p-2 pt-1">
                    <ArchiveIconButton onClick={() => changeQuantity(entry, -1)} disabled={busyId === entry.ownershipId} aria-label="Vähennä kappalemäärää" icon={<Minus className="h-3 w-3" />} />
                    <span className="text-xs font-semibold tabular-nums">×{quantity}</span>
                    <ArchiveIconButton onClick={() => changeQuantity(entry, 1)} disabled={busyId === entry.ownershipId} aria-label="Lisää kappalemäärää" icon={<Plus className="h-3 w-3" />} />
                  </div>
                </article>
              </ArchiveFrame>
            )
          })}
        </div>
      )}
      <Dialog open={Boolean(selectedCard)} onOpenChange={(open) => { if (!open) setSelectedCard(null) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:max-w-2xl">
          <ArchiveFrame className="w-full" weight="regular">
            {selectedCard && (
              <div className="space-y-5 p-5 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="pr-7 font-heading text-xl text-foreground">{selectedCard.displayName}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Valitun kortin tiedot ja kokoelmamäärä.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
                  <ArchiveFrame weight="hairline" corners={false} centerOrnaments={false} className="mx-auto h-fit w-full max-w-[280px] overflow-hidden">
                    <Image src={selectedCard.image || "/images/fallbacks/tcg-fallback.png"} alt={selectedCard.displayName} width={600} height={840} sizes="(max-width: 640px) 75vw, 280px" className="h-auto w-full object-contain" />
                  </ArchiveFrame>
                  <div className="space-y-4 text-foreground">
                    <dl className="space-y-3 text-sm">
                      {readString(selectedCard, "set_name") && <div><dt className="text-muted-foreground">Setti</dt><dd className="font-medium text-foreground">{readString(selectedCard, "set_name")}</dd></div>}
                      {readString(selectedCard, "set_code") && <div><dt className="text-muted-foreground">Settikoodi</dt><dd className="font-medium text-foreground">{readString(selectedCard, "set_code")}</dd></div>}
                      {readString(selectedCard, "rarity") && <div><dt className="text-muted-foreground">Harvinaisuus</dt><dd className="font-medium text-foreground">{readString(selectedCard, "rarity")}</dd></div>}
                      <div>
                        <dt className="mb-1 text-muted-foreground">Kortin kunto</dt>
                        <dd>
                          <select value={editCondition} onChange={(event) => setEditCondition(event.target.value)} className={cn("h-10 w-full rounded-md px-3 text-sm", archiveField)}>
                            <option value="near_mint">Near Mint</option>
                            <option value="lightly_played">Lightly Played</option>
                            <option value="moderately_played">Moderately Played</option>
                            <option value="heavily_played">Heavily Played</option>
                            <option value="damaged">Damaged</option>
                          </select>
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div><dt className="text-muted-foreground">Kortin versio</dt><dd className="text-sm font-medium text-foreground">{editFoil ? "Foil" : "Non-foil"}</dd></div>
                        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={editFoil} onChange={(event) => setEditFoil(event.target.checked)} className="h-4 w-4 accent-[var(--archive-gold,#d9b65c)]" /> Foil</label>
                      </div>
                      {readString(selectedCard, "external_id") && <div><dt className="text-muted-foreground">Korttitunniste</dt><dd className="break-all font-medium text-foreground">{readString(selectedCard, "external_id")}</dd></div>}
                    </dl>
                    <ArchiveCardButton fullWidth active disabled={savingDetails} onClick={async () => {
                      if (!selectedCard) return
                      setSavingDetails(true)
                      const result = await updateTCGCollectionDetails(selectedCard.ownershipId, readIds(selectedCard), { condition: editCondition, foil: editFoil })
                      setSavingDetails(false)
                      if (result.success) {
                        setSelectedCard({ ...selectedCard, metadata: { ...selectedCard.metadata, condition: editCondition, foil: editFoil } })
                        onUpdate()
                      } else {
                        window.alert(result.error ?? "Kortin tietojen tallentaminen epäonnistui.")
                      }
                    }}>
                      {savingDetails ? "Tallennetaan..." : "Tallenna muutokset"}
                    </ArchiveCardButton>
                    <ArchiveFrame weight="thin" corners={false} centerOrnaments={false} className="rounded-lg">
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div><p className="text-sm text-muted-foreground">Kokoelmassa</p><p className="text-lg font-semibold text-foreground">×{typeof selectedCard.metadata.quantity === "number" ? selectedCard.metadata.quantity : 1}</p></div>
                        <div className="flex items-center gap-2">
                          <ArchiveIconButton onClick={() => changeQuantity(selectedCard, -1)} disabled={busyId === selectedCard.ownershipId} aria-label="Vähennä kappalemäärää" icon={<Minus className="h-4 w-4" />} />
                          <ArchiveIconButton onClick={() => changeQuantity(selectedCard, 1)} disabled={busyId === selectedCard.ownershipId} aria-label="Lisää kappalemäärää" icon={<Plus className="h-4 w-4" />} />
                        </div>
                      </div>
                    </ArchiveFrame>
                  </div>
                </div>
              </div>
            )}
          </ArchiveFrame>
        </DialogContent>
      </Dialog>
    </section>
  )
}
