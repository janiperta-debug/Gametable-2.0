"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ArchiveCardButton, archiveField } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Check, X, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client"
import { processPokemonCardImageImport } from "@/app/actions/pokemon-card-image-import"
import {
  createTextImportBatch,
  processCollectionImportBatch,
  getCollectionImportBatch,
  reviewCollectionImportItem,
  commitCollectionImportBatch,
  searchCollectionImportItem,
} from "@/app/actions/collection-import-batches"

type ImportCategory = "tcg" | "miniatures"
type ImportItem = {
  id: string
  raw_text: string
  parsed_data: { name?: string; quantity?: number; setCode?: string | null }
  status: string
  review_reason?: string | null
  error_message?: string | null
}
type Candidate = {
  id: string
  item_id: string
  match_score: number
  match_reasons?: string[]
  candidate_data: Record<string, any>
}

export function CollectionImportReview({
  category,
  tcgGame = "magic",
  miniatureSystemCode = "wh40k",
  onImportComplete,
}: {
  category: ImportCategory
  tcgGame?: string
  miniatureSystemCode?: string
  onImportComplete?: () => void
}) {
  const [sourceText, setSourceText] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [batchId, setBatchId] = useState<string | null>(null)
  const [items, setItems] = useState<ImportItem[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [busy, setBusy] = useState(false)
  const [committed, setCommitted] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const candidatesByItem = useMemo(() => {
    const grouped = new Map<string, Candidate[]>()
    for (const candidate of candidates) {
      grouped.set(candidate.item_id, [...(grouped.get(candidate.item_id) ?? []), candidate])
    }
    return grouped
  }, [candidates])

  const refreshBatch = async (id: string) => {
    const result = await getCollectionImportBatch(id)
    if (!result.success) throw new Error(result.error)
    setItems((result.items ?? []) as ImportItem[])
    setCandidates((result.candidates ?? []) as Candidate[])
    return result.batch
  }

  const handleAnalyze = async () => {
    if (!sourceText.trim() || busy) return
    setBusy(true)
    setAnalysisError(null)
    try {
      const created = await createTextImportBatch({ category, sourceText, sourceMetadata: { game: tcgGame, systemCode: miniatureSystemCode } })
      if (!created.success) throw new Error(created.error)
      const processed = await processCollectionImportBatch(created.batch.id)
      if (!processed.success) throw new Error(processed.error)
      await refreshBatch(created.batch.id)
      setBatchId(created.batch.id)
      toast({ title: "Lista analysoitu", description: `${processed.itemCount} riviä käsiteltävänä. Tarkista osumat ennen tuontia.` })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tuntematon virhe"
      setAnalysisError(message)
      toast({
        title: "Tuontia ei voitu analysoida",
        description: message,
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const handleImageAnalyze = async () => {
    if (!imageFiles.length || busy) return
    if (imageFiles.length > 10) {
      setAnalysisError("Voit valita enintään 10 kuvaa kerralla.")
      return
    }
    const invalidFile = imageFiles.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))
    if (invalidFile) {
      setAnalysisError("Käytä JPEG-, PNG- tai WebP-kuvia.")
      return
    }
    if (imageFiles.some((file) => file.size > 10 * 1024 * 1024)) {
      setAnalysisError("Yksittäisen kuvan enimmäiskoko on 10 Mt.")
      return
    }
    setBusy(true)
    setAnalysisError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error("Kirjaudu sisään ennen kuvan tuontia.")
      const storagePaths: string[] = []
      for (const file of imageFiles) {
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
        const storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage.from("collection-import-images").upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        })
        if (uploadError) throw new Error(uploadError.message)
        storagePaths.push(storagePath)
      }
      const processed = await processPokemonCardImageImport(storagePaths)
      if (!processed.success) throw new Error(processed.error)
      await refreshBatch(processed.batchId)
      setBatchId(processed.batchId)
      toast({
        title: "Kortit tunnistettu",
        description: processed.candidateCount > 0
          ? `${processed.itemCount} korttia tunnistettu ${imageFiles.length} kuvasta, ${processed.candidateCount} tietokantaosumaa tarkistettavaksi.`
          : `${processed.itemCount} korttia tunnistettu ${imageFiles.length} kuvasta, mutta tietokantaosumia ei löytynyt. Voit tarkistaa nimet.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tuntematon virhe"
      setAnalysisError(message)
      toast({ title: "Kuvantunnistus epäonnistui", description: message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const handleDecision = async (itemId: string, decision: "accept" | "reject", candidateId?: string) => {
    setBusy(true)
    try {
      const result = await reviewCollectionImportItem({ itemId, decision, candidateId })
      if (!result.success) throw new Error(result.error)
      if (decision === "accept") setSelectedCandidateIds((current) => { const next = { ...current }; delete next[itemId]; return next })
      if (batchId) await refreshBatch(batchId)
    } catch (error) {
      toast({ title: "Tallennus epäonnistui", description: error instanceof Error ? error.message : "Tuntematon virhe", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const handleSearchAgain = async (item: ImportItem) => {
    if (busy || !batchId) return
    const searchName = (searchTerms[item.id] ?? item.parsed_data.name ?? "").trim()
    if (!searchName) return
    setBusy(true)
    try {
      const result = await searchCollectionImportItem({ itemId: item.id, searchName })
      if (!result.success) throw new Error(result.error)
      await refreshBatch(batchId)
      toast({
        title: result.candidateCount > 0 ? "Uusia ehdotuksia löytyi" : "Ei vieläkään osumia",
        description: result.candidateCount > 0 ? `${result.candidateCount} vaihtoehtoa tarkistettavaksi.` : "Voit muokata hakusanaa ja yrittää uudelleen.",
      })
    } catch (error) {
      toast({ title: "Uusi haku epäonnistui", description: error instanceof Error ? error.message : "Tuntematon virhe", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const handleCommit = async () => {
    if (!batchId || busy) return
    setBusy(true)
    try {
      const result = await commitCollectionImportBatch(batchId)
      if (!result.success && !("failedCount" in result)) throw new Error(result.error)
      setCommitted(true)
      await refreshBatch(batchId)
      toast({
        title: result.failedCount ? "Tuonti osittain valmis" : "Tuonti valmis",
        description: `${result.committedCount ?? 0} lisätty, ${result.failedCount ?? 0} epäonnistui.`,
      })
      if ((result.committedCount ?? 0) > 0) onImportComplete?.()
    } catch (error) {
      toast({ title: "Tuonti epäonnistui", description: error instanceof Error ? error.message : "Tuntematon virhe", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const acceptedCount = items.filter((item) => item.status === "accepted" || item.status === "imported").length
  const pendingCount = items.filter((item) => !["accepted", "imported", "rejected"].includes(item.status)).length

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-body">
          {category === "tcg"
            ? "Liitä korttilista. Jokainen rivi täsmäytetään GameTablen korttitietokantaan, ja voit tarkistaa ehdotukset ennen kokoelmaan lisäämistä."
            : "Liitä miniatyyri- tai armeijalista. Tarkista yksikköehdotukset ennen kuin ne lisätään omistamaasi kokoelmaan."}
        </p>
        {category === "tcg" && tcgGame.toLowerCase() === "pokemon" && !batchId && (
          <div className="rounded-lg border border-accent-gold/25 bg-background/30 p-3 space-y-2">
            <div className="text-sm font-medium">Tuo Pokémon-kortteja kuvasta</div>
            <p className="text-xs text-muted-foreground">Voit kuvata useita kortteja samalla kertaa. Valitse enintään 10 kansiosivua kerralla joko laitteen kuvakirjastosta tai ottamalla uudet kuvat. Jokaisesta kuvasta tunnistetaan enintään 12 Pokémon-, energia- ja Trainer-korttia; kaikki tulokset kootaan yhteen tarkistettavaan tuontierään.</p>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                setImageFiles(files)
                setImagePreviews(files.map((file) => URL.createObjectURL(file)))
                setAnalysisError(null)
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-accent-gold/30 file:bg-background file:px-3 file:py-2 file:text-sm file:text-foreground"
            />
            {imagePreviews.length > 0 && <div className="space-y-2"><div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{imagePreviews.map((preview, index) => <div key={preview} className="relative"><img src={preview} alt={`Kansiosivu ${index + 1}`} className="h-28 w-full rounded-md object-contain bg-black/10" /><span className="text-[10px] text-muted-foreground">{index + 1}. kuva</span></div>)}</div><p className="text-xs text-muted-foreground">{imageFiles.length} kuvaa valittuna. Varmista, että kortit näkyvät kokonaan ja keräilynumerot ovat luettavissa.</p></div>}
            <ArchiveCardButton onClick={handleImageAnalyze} active fullWidth disabled={!imageFiles.length || busy} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}>
              {busy ? "Tunnistetaan kortteja…" : "Tunnista kortit kuvasta"}
            </ArchiveCardButton>
          </div>
        )}
        <textarea
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          disabled={!!batchId}
          placeholder={category === "tcg" ? "4 Lightning Bolt\n2 Counterspell\n1 Sol Ring" : "5 Intercessors\n3 Aggressors\n1 Captain"}
          className={`w-full min-h-[130px] rounded-md px-3 py-2 text-sm font-mono ${archiveField}`}
        />
        {analysisError && !batchId && (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive break-words">
            Analysointi epäonnistui: {analysisError}
          </div>
        )}
        {!batchId && (
          <ArchiveCardButton onClick={handleAnalyze} active fullWidth disabled={!sourceText.trim() || busy} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}>
            {busy ? "Analysoidaan…" : "Analysoi lista ja tarkista osumat"}
          </ArchiveCardButton>
        )}
      </div>

      {batchId && (
        <div className="space-y-3">
          {imagePreviews.length > 0 && <div className="rounded-md border border-accent-gold/20 p-2 space-y-2"><div className="text-xs text-muted-foreground">Tuodut kansiosivut ({imagePreviews.length})</div><div className="flex gap-2 overflow-x-auto">{imagePreviews.map((preview, index) => <img key={preview} src={preview} alt={`Alkuperäinen kansiosivu ${index + 1}`} className="h-28 w-20 shrink-0 rounded object-contain" />)}</div></div>}
          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-accent-gold/20 py-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{items.length} riviä</Badge>
              <Badge variant="outline" className="border-green-600/40">{acceptedCount} hyväksytty</Badge>
              <Badge variant="outline">{pendingCount} tarkistettava</Badge>
            </div>
            <button type="button" onClick={() => refreshBatch(batchId).catch((e) => toast({ title: "Päivitys epäonnistui", description: e.message, variant: "destructive" }))} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Päivitä
            </button>
          </div>

          <div className="max-h-[65vh] overflow-y-auto overscroll-contain pr-1 space-y-3">
            {items.map((item) => {
              const itemCandidates = candidatesByItem.get(item.id) ?? []
              const savedCandidateId = (item as any).selected_candidate_id as string | undefined
              const selectedCandidateId = selectedCandidateIds[item.id] ?? savedCandidateId
              const chosen = itemCandidates.find((candidate) => candidate.id === selectedCandidateId) ?? itemCandidates[0]
              const hasUnconfirmedSelection = !!selectedCandidateIds[item.id] && selectedCandidateIds[item.id] !== savedCandidateId
              const locked = item.status === "imported" || item.status === "rejected"
              return (
                <div key={item.id} className="rounded-lg border border-accent-gold/20 bg-background/40 p-3 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{item.parsed_data.quantity ?? 1} × {item.parsed_data.name ?? item.raw_text}</div>
                      <div className="text-xs text-muted-foreground mt-1">Alkuperäinen rivi: {item.raw_text}</div>
                    </div>
                    <Badge variant="outline" className={item.status === "accepted" || item.status === "imported" ? "border-green-600/40" : item.status === "unmatched" ? "border-destructive/40" : ""}>
                      {item.status === "matched" ? "Ehdotus löytyi" : item.status === "needs_review" ? "Tarkista" : item.status === "unmatched" ? "Ei osumaa" : item.status === "accepted" ? "Hyväksytty" : item.status === "imported" ? "Lisätty" : item.status === "rejected" ? "Hylätty" : item.status}
                    </Badge>
                  </div>

                  {itemCandidates.length > 0 ? (
                    <div className="space-y-2">
                      {item.status === "accepted" && (
                        <div className="flex items-center gap-2 rounded-md border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">
                          <Check className="h-4 w-4 shrink-0" />
                          <span>Valittu osuma on hyväksytty</span>
                        </div>
                      )}
                      {itemCandidates.length > 1 ? (
                        <label className="block text-xs text-muted-foreground">
                          {item.status === "accepted" ? "Hyväksytty osuma (voit vaihtaa valintaa)" : "Valitse oikea tietokantaosuma"}
                          <select
                            value={chosen?.id ?? ""}
                            disabled={locked || busy}
                            onChange={(event) => setSelectedCandidateIds((current) => ({ ...current, [item.id]: event.target.value }))}
                            className={`mt-1 h-9 w-full rounded-md border px-2 text-sm text-foreground ${item.status === "accepted" ? "border-green-600/50 bg-green-600/5" : "border-input bg-background"}`}
                          >
                            {itemCandidates.map((candidate) => (
                              <option key={candidate.id} value={candidate.id}>
                                {candidate.candidate_data.name} {candidate.candidate_data.set ? `— ${candidate.candidate_data.set}` : ""} {candidate.candidate_data.factionName ? `— ${candidate.candidate_data.factionName}` : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <div className={`rounded-md border px-3 py-2 text-sm ${item.status === "accepted" ? "border-green-600/50 bg-green-600/5" : "border-transparent"}`}>
                          <div className="font-medium">{chosen?.candidate_data.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {chosen?.candidate_data.set}{chosen?.candidate_data.factionName ? ` · ${chosen.candidate_data.factionName}` : ""}{chosen?.candidate_data.systemName ? ` · ${chosen.candidate_data.systemName}` : ""}
                            {typeof chosen?.candidate_data.modelCountMin === "number" && typeof chosen?.candidate_data.modelCountMax === "number" ? ` · ${chosen.candidate_data.modelCountMin}–${chosen.candidate_data.modelCountMax} models` : typeof chosen?.candidate_data.modelCountMin === "number" ? ` · ${chosen.candidate_data.modelCountMin}+ models` : ""}{typeof chosen?.candidate_data.basePoints === "number" && chosen.candidate_data.basePoints > 0 ? ` · ${chosen.candidate_data.basePoints} pts` : ""}
                          </div>
                        </div>
                      )}
                      {chosen?.candidate_data.imageUrl && (
                        <div className="flex items-start gap-3 rounded-md border border-accent-gold/20 bg-background/30 p-2">
                          <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded bg-black/20">
                            <Image
                              src={chosen.candidate_data.imageUrl}
                              alt={chosen.candidate_data.name ?? "Ehdotettu kortti"}
                              fill
                              sizes="80px"
                              unoptimized
                              className="object-contain"
                            />
                          </div>
                          <div className="min-w-0 text-xs text-muted-foreground">
                            <div className="font-medium text-foreground">{chosen.candidate_data.name}</div>
                            {chosen.candidate_data.set && <div className="mt-1">{chosen.candidate_data.set}</div>}
                            {chosen.candidate_data.collectorNumber && <div>Numero: {chosen.candidate_data.collectorNumber}</div>}
                            {chosen.candidate_data.rarity && <div>{chosen.candidate_data.rarity}</div>}
                          </div>
                        </div>
                      )}
                      {item.review_reason && item.status !== "accepted" && <p className="text-xs text-muted-foreground">{item.review_reason}</p>}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Tarkkaa osumaa ei löytynyt. Kokeile lyhyempää nimeä, vaihtoehtoista kirjoitusasua tai yksikön yleisnimeä.</p>
                      <label className="block text-xs text-muted-foreground">
                        Muokkaa hakusanaa
                        <input
                          value={searchTerms[item.id] ?? item.parsed_data.name ?? ""}
                          onChange={(event) => setSearchTerms((current) => ({ ...current, [item.id]: event.target.value }))}
                          disabled={locked || busy}
                          className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                          placeholder="Kirjoita nimi uudelleen"
                        />
                      </label>
                      <ArchiveCardButton onClick={() => handleSearchAgain(item)} active disabled={busy || locked || !(searchTerms[item.id] ?? item.parsed_data.name ?? "").trim()} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}>
                        {busy ? "Haetaan…" : "Hae ehdotuksia uudelleen"}
                      </ArchiveCardButton>
                      <p className="text-xs text-muted-foreground">Haku etsii myös osittaisia nimiosumia. Mikään ehdotus ei siirry kokoelmaan ilman hyväksyntääsi.</p>
                    </div>
                  )}

                  {item.error_message && <p className="text-xs text-destructive">{item.error_message}</p>}
                  {!locked && item.status !== "failed" && itemCandidates.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.status !== "accepted" || hasUnconfirmedSelection ? (
                        <ArchiveCardButton onClick={() => handleDecision(item.id, "accept", selectedCandidateIds[item.id] ?? chosen?.id)} active disabled={busy} icon={<Check className="h-4 w-4" />}>{item.status === "accepted" ? "Vahvista uusi osuma" : "Hyväksy osuma"}</ArchiveCardButton>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-green-600/40 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-300">
                          <Check className="h-4 w-4" /> Hyväksytty – valmis lisättäväksi
                        </span>
                      )}
                      <ArchiveCardButton onClick={() => handleDecision(item.id, "reject")} disabled={busy} icon={<X className="h-4 w-4" />}>Hylkää rivi</ArchiveCardButton>
                    </div>
                  )}
                  {!locked && itemCandidates.length === 0 && item.status !== "failed" && (
                    <ArchiveCardButton onClick={() => handleDecision(item.id, "reject")} disabled={busy} icon={<X className="h-4 w-4" />}>Hylkää rivi</ArchiveCardButton>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <ArchiveCardButton onClick={handleCommit} active fullWidth disabled={busy || acceptedCount === 0 || committed} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}>
              {busy ? "Lisätään…" : `Lisää hyväksytyt kokoelmaan (${acceptedCount})`}
            </ArchiveCardButton>
            <ArchiveCardButton onClick={() => { setBatchId(null); setItems([]); setCandidates([]); setSourceText(""); setImageFiles([]); setImagePreviews([]); setCommitted(false) }} fullWidth disabled={busy}>
              Uusi tuonti
            </ArchiveCardButton>
          </div>
          {pendingCount > 0 && <p className="text-xs text-muted-foreground">Vain hyväksytyt rivit lisätään. Tarkistamattomat ja hylätyt rivit ohitetaan.</p>}
        </div>
      )}
    </div>
  )
}
