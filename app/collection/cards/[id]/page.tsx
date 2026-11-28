"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Loader2, Minus, Plus } from "lucide-react"
import { useCollection } from "@/hooks/useCollection"
import type { CollectionEntry } from "@/lib/types/collection"
import { updateTCGCollectionDetails, updateTCGCollectionQuantity } from "@/app/actions/tcg"
import { ArchiveButton, ArchiveCard, ArchiveFrame, ArchiveIconButton, archiveField } from "@/components/archive-frame"

function readString(entry: CollectionEntry, key: string): string | null {
  const value = entry.metadata[key]
  return typeof value === "string" && value.trim() ? value : null
}

function readIds(entry: CollectionEntry): string[] {
  return Array.isArray(entry.metadata.ownership_ids)
    ? entry.metadata.ownership_ids.filter((id): id is string => typeof id === "string")
    : [entry.ownershipId]
}

const CONDITIONS = [
  ["near_mint", "Near Mint"],
  ["lightly_played", "Lightly Played"],
  ["moderately_played", "Moderately Played"],
  ["heavily_played", "Heavily Played"],
  ["damaged", "Damaged"],
] as const

export default function TCGCardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cardId = params.id as string
  const { collectionEntries, loading, refetch } = useCollection()
  const [condition, setCondition] = useState("near_mint")
  const [foil, setFoil] = useState(false)
  const [saving, setSaving] = useState(false)
  const [quantityBusy, setQuantityBusy] = useState(false)
  const [error, setError] = useState("")

  const entry = useMemo(
    () => collectionEntries.find((item) => item.domain === "tcg" && (item.ownershipId === cardId || readIds(item).includes(cardId))) ?? null,
    [collectionEntries, cardId],
  )

  useEffect(() => {
    if (!entry) return
    setCondition(readString(entry, "condition") ?? "near_mint")
    setFoil(entry.metadata.foil === true)
  }, [entry])

  async function saveDetails() {
    if (!entry) return
    setSaving(true)
    setError("")
    const result = await updateTCGCollectionDetails(entry.ownershipId, readIds(entry), { condition, foil })
    setSaving(false)
    if (result.success) await refetch()
    else setError(result.error ?? "Kortin tietojen tallentaminen epäonnistui.")
  }

  async function changeQuantity(delta: number) {
    if (!entry) return
    setQuantityBusy(true)
    setError("")
    const result = await updateTCGCollectionQuantity(entry.ownershipId, delta, readIds(entry))
    setQuantityBusy(false)
    if (result.success) await refetch()
    else setError(result.error ?? "Kokoelmamäärän muuttaminen epäonnistui.")
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent-gold" /></div>
  }

  if (!entry) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <ArchiveCard>
          <div className="space-y-4 p-5 text-center">
            <h1 className="font-heading text-xl font-semibold">Korttia ei löytynyt</h1>
            <p className="text-muted-foreground">Kortti ei ole enää kokoelmassasi tai siihen ei ole käyttöoikeutta.</p>
            <Link href="/collection"><ArchiveButton>Takaisin kokoelmaan</ArchiveButton></Link>
          </div>
        </ArchiveCard>
      </main>
    )
  }

  const quantity = typeof entry.metadata.quantity === "number" ? entry.metadata.quantity : 1

  return (
    <main className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5">
        <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Takaisin kokoelmaan
        </button>
      </div>

      <ArchiveCard>
        <div className="p-4 sm:p-6">
          <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
            <div className="mx-auto w-full max-w-[360px]">
              <ArchiveFrame weight="thin" corners={false} centerOrnaments={false} className="overflow-hidden">
                <Image
                  src={entry.image || "/images/fallbacks/tcg-fallback.png"}
                  alt={entry.displayName}
                  width={600}
                  height={840}
                  sizes="(max-width: 768px) 90vw, 360px"
                  className="h-auto w-full object-contain"
                  priority
                />
              </ArchiveFrame>
            </div>

            <div className="min-w-0 space-y-5">
              <header>
                <h1 className="font-heading text-2xl font-semibold text-foreground">{entry.displayName}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Kortin tiedot ja kokoelmamäärä</p>
              </header>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                {readString(entry, "set_name") && <div><dt className="text-muted-foreground">Setti</dt><dd className="mt-1 font-medium text-foreground">{readString(entry, "set_name")}</dd></div>}
                {readString(entry, "set_code") && <div><dt className="text-muted-foreground">Settikoodi</dt><dd className="mt-1 font-medium text-foreground">{readString(entry, "set_code")}</dd></div>}
                {readString(entry, "rarity") && <div><dt className="text-muted-foreground">Harvinaisuus</dt><dd className="mt-1 font-medium text-foreground">{readString(entry, "rarity")}</dd></div>}
                {readString(entry, "external_id") && <div><dt className="text-muted-foreground">Korttitunniste</dt><dd className="mt-1 break-all font-medium text-foreground">{readString(entry, "external_id")}</dd></div>}
              </dl>

              <div className="space-y-2">
                <label htmlFor="card-condition" className="block text-sm font-medium text-foreground">Kortin kunto</label>
                <select id="card-condition" value={condition} onChange={(event) => setCondition(event.target.value)} className={`h-11 w-full rounded-md px-3 text-sm text-foreground ${archiveField}`}>
                  {CONDITIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 p-3 text-sm text-foreground">
                <span><span className="block font-medium">Kortin versio</span><span className="text-muted-foreground">{foil ? "Foil" : "Non-foil"}</span></span>
                <span className="flex items-center gap-2"><input type="checkbox" checked={foil} onChange={(event) => setFoil(event.target.checked)} className="h-4 w-4 accent-[var(--archive-gold,#d9b65c)]" /> Foil</span>
              </label>

              <ArchiveButton fullWidth active disabled={saving} onClick={saveDetails}>{saving ? "Tallennetaan..." : "Tallenna muutokset"}</ArchiveButton>

              <ArchiveFrame weight="thin" corners={false} centerOrnaments={false}>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div><p className="text-sm text-muted-foreground">Kokoelmassa</p><p className="text-xl font-semibold text-foreground">×{quantity}</p></div>
                  <div className="flex items-center gap-2">
                    <ArchiveIconButton onClick={() => changeQuantity(-1)} disabled={quantityBusy} aria-label="Vähennä kappalemäärää" icon={<Minus className="h-4 w-4" />} />
                    <ArchiveIconButton onClick={() => changeQuantity(1)} disabled={quantityBusy} aria-label="Lisää kappalemäärää" icon={<Plus className="h-4 w-4" />} />
                  </div>
                </div>
              </ArchiveFrame>

              {error && <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            </div>
          </div>
        </div>
      </ArchiveCard>
    </main>
  )
}
