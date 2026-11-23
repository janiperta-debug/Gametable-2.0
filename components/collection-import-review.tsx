"use client"

import { useMemo, useState } from "react"
import { ArchiveCardButton, archiveField } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Check, X, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  createTextImportBatch,
  processCollectionImportBatch,
  getCollectionImportBatch,
  reviewCollectionImportItem,
  commitCollectionImportBatch,
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
  onImportComplete,
}: {
  category: ImportCategory
  onImportComplete?: () => void
}) {
  const [sourceText, setSourceText] = useState("")
  const [batchId, setBatchId] = useState<string | null>(null)
  const [items, setItems] = useState<ImportItem[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [busy, setBusy] = useState(false)
  const [committed, setCommitted] = useState(false)
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
    try {
      const created = await createTextImportBatch({ category, sourceText })
      if (!created.success) throw new Error(created.error)
      setBatchId(created.batch.id)
      const processed = await processCollectionImportBatch(created.batch.id)
      if (!processed.success) throw new Error(processed.error)
      await refreshBatch(created.batch.id)
      toast({ title: "Lista analysoitu", description: `${processed.itemCount} riviä käsiteltävänä. Tarkista osumat ennen tuontia.` })
    } catch (error) {
      toast({
        title: "Tuontia ei voitu analysoida",
        description: error instanceof Error ? error.message : "Tuntematon virhe",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const handleDecision = async (itemId: string, decision: "accept" | "reject", candidateId?: string) => {
    setBusy(true)
    try {
      const result = await reviewCollectionImportItem({ itemId, decision, candidateId })
      if (!result.success) throw new Error(result.error)
      if (batchId) await refreshBatch(batchId)
    } catch (error) {
      toast({ title: "Tallennus epäonnistui", description: error instanceof Error ? error.message : "Tuntematon virhe", variant: "destructive" })
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
        <textarea
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          disabled={!!batchId}
          placeholder={category === "tcg" ? "4 Lightning Bolt\n2 Counterspell\n1 Sol Ring" : "5 Intercessors\n3 Aggressors\n1 Captain"}
          className={`w-full min-h-[130px] rounded-md px-3 py-2 text-sm font-mono ${archiveField}`}
        />
        {!batchId && (
          <ArchiveCardButton onClick={handleAnalyze} active fullWidth disabled={!sourceText.trim() || busy} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}>
            {busy ? "Analysoidaan…" : "Analysoi lista ja tarkista osumat"}
          </ArchiveCardButton>
        )}
      </div>

      {batchId && (
        <div className="space-y-3">
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

          <div className="space-y-3">
            {items.map((item) => {
              const itemCandidates = candidatesByItem.get(item.id) ?? []
              const chosen = itemCandidates.find((candidate) => candidate.id === (item as any).selected_candidate_id) ?? itemCandidates[0]
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
                      {itemCandidates.length > 1 ? (
                        <label className="block text-xs text-muted-foreground">
                          Valitse oikea tietokantaosuma
                          <select
                            value={chosen?.id ?? ""}
                            disabled={locked || busy}
                            onChange={(event) => handleDecision(item.id, "accept", event.target.value)}
                            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
                          >
                            {itemCandidates.map((candidate) => (
                              <option key={candidate.id} value={candidate.id}>
                                {candidate.candidate_data.name} {candidate.candidate_data.set ? `— ${candidate.candidate_data.set}` : ""} {candidate.candidate_data.factionName ? `— ${candidate.candidate_data.factionName}` : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <div className="text-sm">
                          <div className="font-medium">{chosen?.candidate_data.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {chosen?.candidate_data.set}{chosen?.candidate_data.factionName ? ` · ${chosen.candidate_data.factionName}` : ""}{chosen?.candidate_data.systemName ? ` · ${chosen.candidate_data.systemName}` : ""}
                            {typeof chosen?.candidate_data.basePoints === "number" ? ` · ${chosen.candidate_data.basePoints} pts` : ""}
                          </div>
                        </div>
                      )}
                      {item.review_reason && <p className="text-xs text-muted-foreground">{item.review_reason}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Tietokannasta ei löytynyt sopivaa osumaa. Tätä riviä ei voi lisätä ennen kuin sille löytyy oikea tietue.</p>
                  )}

                  {item.error_message && <p className="text-xs text-destructive">{item.error_message}</p>}
                  {!locked && item.status !== "failed" && itemCandidates.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <ArchiveCardButton onClick={() => handleDecision(item.id, "accept", chosen?.id)} active disabled={busy} icon={<Check className="h-4 w-4" />}>Hyväksy osuma</ArchiveCardButton>
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
            <ArchiveCardButton onClick={() => { setBatchId(null); setItems([]); setCandidates([]); setSourceText(""); setCommitted(false) }} fullWidth disabled={busy}>
              Uusi tuonti
            </ArchiveCardButton>
          </div>
          {pendingCount > 0 && <p className="text-xs text-muted-foreground">Vain hyväksytyt rivit lisätään. Tarkistamattomat ja hylätyt rivit ohitetaan.</p>}
        </div>
      )}
    </div>
  )
}
