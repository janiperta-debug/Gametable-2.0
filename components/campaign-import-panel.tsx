"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArchiveCardButton } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { FileText, Image as ImageIcon, Loader2, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  cancelCampaignImportBatch,
  createCampaignImportBatch,
  listCampaignImportBatches,
  registerCampaignImportSource,
  finalizeCampaignImportDraft,
} from "@/app/actions/campaign-import"
import { processCampaignImportBatch, analyzeCampaignImportBatch, getCampaignImportItems } from "@/app/actions/campaign-pdf-extraction"
import { approveCampaignImportItems } from "@/app/actions/campaign-world"

const MAX_FILES = 10
const MAX_FILE_SIZE = 25 * 1024 * 1024
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/webp",
]


type CampaignImportItem = {
  id: string
  index: number
  entityType: string
  name: string
  description: string
  details: Record<string, unknown>
  confidence: number | null
  sourceName: string
  page: number | null
  quote: string
  relationships: Array<{ targetName?: string; relationshipType?: string; description?: string }>
  status: string
  reviewReason: string | null
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  character: "Pelaajahahmo",
  person: "Henkilö",
  location: "Paikka",
  faction: "Ryhmittymä",
  quest: "Tehtävä",
  item: "Esine",
  creature: "Olento",
  history: "Historia",
  rule: "Sääntö",
  other: "Muu kohde",
}

type ImportBatch = {
  id: string
  status: string
  source_count: number
  item_count: number
  error_message: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Odottaa käsittelyä",
  processing: "Käsittelyssä",
  review: "Tarkistettavana",
  completed: "Valmis",
  partial: "Osittain valmis",
  failed: "Epäonnistui",
  cancelled: "Peruttu",
}

export function CampaignImportPanel({ eventId, finalizeOnComplete = false }: { eventId: string; finalizeOnComplete?: boolean }) {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [batches, setBatches] = useState<ImportBatch[]>([])
  const [busy, setBusy] = useState(false)
  const [processingLabel, setProcessingLabel] = useState("Lisätään lähteitä…")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [extractionSummary, setExtractionSummary] = useState("")
  const [expandedItemsBatchId, setExpandedItemsBatchId] = useState<string | null>(null)
  const [reviewItems, setReviewItems] = useState<CampaignImportItem[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [campaignTitle, setCampaignTitle] = useState("")
  const [campaignDescription, setCampaignDescription] = useState("")

  const refreshBatches = async () => {
    const result = await listCampaignImportBatches(eventId)
    if (!result.success) throw new Error(result.error)
    setBatches(result.batches as ImportBatch[])
  }

  useEffect(() => {
    let active = true
    listCampaignImportBatches(eventId).then((result) => {
      if (!active) return
      if (result.success) setBatches(result.batches as ImportBatch[])
      else setError(result.error)
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Tuontierien lataaminen epäonnistui.")
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [eventId])

  const handleFileSelection = (selected: FileList | null) => {
    const next = Array.from(selected ?? [])
    setError("")
    if (next.length > MAX_FILES) {
      setError(`Voit lisätä yhteen tuontierään enintään ${MAX_FILES} tiedostoa.`)
      setFiles([])
      return
    }
    const invalid = next.find((file) => !ALLOWED_TYPES.includes(file.type))
    if (invalid) {
      setError(`Tiedostotyyppi ei ole sallittu: ${invalid.name}`)
      setFiles([])
      return
    }
    const oversized = next.find((file) => file.size <= 0 || file.size > MAX_FILE_SIZE)
    if (oversized) {
      setError(`Tiedoston ${oversized.name} koko ei ole sallittu. Enimmäiskoko on 25 Mt.`)
      setFiles([])
      return
    }
    setFiles(next)
  }

  const handleUpload = async () => {
    if (!files.length || busy) return
    setBusy(true)
    setProcessingLabel("Lisätään lähteitä…")
    setError("")
    let uploadedCount = 0

    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error("Kirjaudu sisään ennen lähdetiedostojen lisäämistä.")

      const created = await createCampaignImportBatch(eventId)
      if (!created.success) throw new Error(created.error)

      for (const file of files) {
        const extension = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin"
        const storagePath = `${eventId}/${user.id}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from("campaign-import-sources")
          .upload(storagePath, file, { contentType: file.type, upsert: false })

        if (uploadError) throw new Error(`${file.name}: ${uploadError.message}`)

        const registered = await registerCampaignImportSource({
          batchId: created.batch.id,
          fileName: file.name,
          storagePath,
          mimeType: file.type,
        })

        if (!registered.success) {
          await supabase.storage.from("campaign-import-sources").remove([storagePath])
          throw new Error(`${file.name}: ${registered.error}`)
        }
        uploadedCount += 1
      }

      const pdfOnly = files.every((file) => file.type === "application/pdf")
      setFiles([])
      if (pdfOnly) setProcessingLabel("Kartanon henkilökunta käsittelee aineistoa…")
      if (pdfOnly) {
        const processed = await processCampaignImportBatch(created.batch.id)
        if (!processed.success) throw new Error(processed.error)
        setExtractionSummary(`Aineiston käsittely valmis: ${processed.count} ehdotusta odottaa tarkistusta.`)
        if (processed.errors?.length) setError(processed.errors.join(" "))
      } else {
        setExtractionSummary("Aineisto tallennettiin. Tämän tiedostomuodon automaattinen sisällöntunnistus otetaan käyttöön seuraavassa vaiheessa.")
      }
      await refreshBatches()
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Lähdetiedostojen lisääminen epäonnistui."
      setError(uploadedCount > 0 ? `${uploadedCount} tiedostoa lisättiin. ${message}` : message)
      try { await refreshBatches() } catch { /* Keep the original upload error visible. */ }
    } finally {
      setBusy(false)
    }
  }

  const handleProcessBatch = async (batchId: string, status: string) => {
    if (busy) return
    setBusy(true)
    setError("")
    setExtractionSummary("")
    try {
      if (status === "review") {
        const result = await analyzeCampaignImportBatch(batchId)
        if (!result.success) throw new Error(result.error)
        setExtractionSummary(`Aineiston käsittely valmis. ${result.count} ehdotusta odottaa tarkistusta.`)
      } else {
        const result = await processCampaignImportBatch(batchId)
        if (!result.success) throw new Error(result.error)
        setExtractionSummary(`Aineiston käsittely valmis: ${result.count} ehdotusta odottaa tarkistusta.`)
        if (result.errors?.length) setError(result.errors.join(" "))
      }
      await refreshBatches()
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : "Aineiston käsittely epäonnistui.")
      try { await refreshBatches() } catch { /* Keep the original error visible. */ }
    } finally {
      setBusy(false)
    }
  }

  const handleViewImportItems = async (batchId: string) => {
    if (expandedItemsBatchId === batchId) {
      setExpandedItemsBatchId(null)
      setReviewItems([])
      setSelectedItemIds([])
      return
    }

    setItemsLoading(true)
    setError("")
    setExpandedItemsBatchId(batchId)
    setReviewItems([])
    setSelectedItemIds([])
    try {
      const result = await getCampaignImportItems(batchId)
      if (!result.success) throw new Error(result.error)
      setReviewItems(result.items as CampaignImportItem[])
      if (result.items.length === 0) setError("Tästä tuontierästä ei löytynyt tarkistettavia ehdotuksia.")
    } catch (loadError) {
      setExpandedItemsBatchId(null)
      setError(loadError instanceof Error ? loadError.message : "Ehdotusten lataaminen epäonnistui.")
    } finally {
      setItemsLoading(false)
    }
  }

  const handleApproveSelected = async (batchId: string) => {
    if (!selectedItemIds.length || busy) return
    setBusy(true)
    setError("")
    try {
      const result = await approveCampaignImportItems(batchId, selectedItemIds)
      if (!result.success) throw new Error(result.error || "Kohteiden siirto kampanjaan epäonnistui.")
      setExtractionSummary(`Kampanjaan lisättiin ${result.imported} kohdetta. ${result.remaining ? `${result.remaining} ehdotusta odottaa vielä tarkistusta.` : "Tuontierä on valmis."}`)
      window.dispatchEvent(new Event("gametable:campaign-world-updated"))
      setSelectedItemIds([])
      const refreshed = await getCampaignImportItems(batchId)
      if (refreshed.success) setReviewItems(refreshed.items as CampaignImportItem[])
      await refreshBatches()
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Kohteiden siirto kampanjaan epäonnistui.")
      try {
        const refreshed = await getCampaignImportItems(batchId)
        if (refreshed.success) setReviewItems(refreshed.items as CampaignImportItem[])
        await refreshBatches()
      } catch { /* Keep the original error visible. */ }
    } finally {
      setBusy(false)
    }
  }


  const handleFinalizeCampaign = async () => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const result = await finalizeCampaignImportDraft({ eventId, title: campaignTitle, description: campaignDescription })
      if (!result.success) throw new Error(result.error)
      router.push(`/events/${result.eventId}`)
    } catch (finalizeError) {
      setError(finalizeError instanceof Error ? finalizeError.message : "Kampanjan viimeistely epäonnistui.")
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async (batchId: string) => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const result = await cancelCampaignImportBatch(batchId)
      if (!result.success) throw new Error(result.error)
      await refreshBatches()
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Tuontierän peruminen epäonnistui.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lisää kampanjan käsikirjoituksia, PDF-tiedostoja, kuvia tai muistiinpanoja samaan tuontierään.
          Kartanon henkilökunta kokoaa aineistosta tarkistettavat ehdotukset. Mitään ei lisätä kampanjaan ilman hyväksyntääsi.
        </p>

        <div className="space-y-3 rounded-md border border-accent-gold/20 bg-background/20 p-3">
          <label className="block text-sm font-medium text-accent-gold" htmlFor={`campaign-import-files-${eventId}`}>
            Lähdetiedostot
          </label>
          <input
            id={`campaign-import-files-${eventId}`}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.webp"
            disabled={busy}
            onChange={(event) => handleFileSelection(event.target.files)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-accent-gold/30 file:bg-background file:px-3 file:py-2 file:text-sm file:text-foreground"
          />
          <p className="text-xs text-muted-foreground">PDF, Word, TXT, Markdown, JPEG, PNG tai WebP · enintään 10 tiedostoa · 25 Mt / tiedosto.</p>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.name + file.size} className="flex min-w-0 items-center gap-2 text-sm">
                  {file.type.startsWith("image/") ? <ImageIcon className="h-4 w-4 shrink-0 text-accent-gold" /> : <FileText className="h-4 w-4 shrink-0 text-accent-gold" />}
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} Mt</span>
                  <button type="button" disabled={busy} onClick={() => setFiles((current) => current.filter((item) => item !== file))} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label={`Poista ${file.name} valinnasta`}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <ArchiveCardButton onClick={handleUpload} active fullWidth disabled={!files.length || busy} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}>
            {busy ? processingLabel : `Lisää ${files.length || ""} lähdettä tuontierään`}
          </ArchiveCardButton>
        </div>

        {extractionSummary && <p className="rounded-md border border-accent-gold/20 bg-background/30 p-3 text-sm text-accent-gold">{extractionSummary}</p>}

        {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

        <div className="space-y-3">
          <div className="text-sm font-medium">Aiemmat tuontierät</div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Ladataan tuontieriä…</div>
          ) : batches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tälle kampanjalle ei ole vielä tuontieriä.</p>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => (
                <div key={batch.id} className="flex flex-col gap-2 rounded-md border border-accent-gold/15 p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{new Date(batch.created_at).toLocaleString("fi-FI")}</span>
                      <Badge variant="outline" className="border-accent-gold/30 text-accent-gold">{STATUS_LABELS[batch.status] ?? batch.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{batch.source_count} lähdettä · {batch.item_count} poimittua kohdetta</p>
                    {batch.error_message && <p className="mt-1 text-xs text-destructive">{batch.error_message}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["uploaded", "failed"].includes(batch.status) && batch.source_count > 0 && (
                      <ArchiveCardButton active disabled={busy} onClick={() => handleProcessBatch(batch.id, batch.status)}>
                        {busy ? "Käsitellään…" : "Käsittele aineisto"}
                      </ArchiveCardButton>
                    )}
                    {batch.status === "review" && batch.item_count === 0 && (
                      <ArchiveCardButton active disabled={busy} onClick={() => handleProcessBatch(batch.id, "review")}>
                        {busy ? "Tunnistetaan…" : "Tunnista aineisto"}
                      </ArchiveCardButton>
                    )}
                    {batch.item_count > 0 && (
                      <ArchiveCardButton
                        active={expandedItemsBatchId === batch.id}
                        disabled={itemsLoading && expandedItemsBatchId === batch.id}
                        onClick={() => handleViewImportItems(batch.id)}
                      >
                        {itemsLoading && expandedItemsBatchId === batch.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : expandedItemsBatchId === batch.id ? "Piilota ehdotukset" : "Tarkista ehdotukset"}
                      </ArchiveCardButton>
                    )}
                    {["uploaded", "review", "failed"].includes(batch.status) && (
                      <ArchiveCardButton disabled={busy} onClick={() => handleCancel(batch.id)}>Peruuta erä</ArchiveCardButton>
                    )}
                  </div>

                  {expandedItemsBatchId === batch.id && (
                    <div className="mt-3 w-full space-y-3 rounded-md border border-accent-gold/25 bg-background/30 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium text-accent-gold">Tunnistetut ehdotukset</div>
                        <Badge variant="outline" className="border-accent-gold/30 text-accent-gold">{reviewItems.length} ehdotusta</Badge>
                      </div>
                      <ArchiveCardButton
                        onClick={() => {
                          setExpandedItemsBatchId(null)
                          setSelectedItemIds([])
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }}
                      >
                        Palaa kampanjan tietoihin
                      </ArchiveCardButton>
                      <p className="text-xs text-muted-foreground">Valitse hyväksymäsi kohteet. Ne lisätään kampanjan tietopankkiin pelinjohtajan yksityisinä tietoina.</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <ArchiveCardButton active disabled={busy || selectedItemIds.length === 0} onClick={() => handleApproveSelected(batch.id)}>
                          {busy ? "Tallennetaan…" : `Tuo valitut kampanjaan (${selectedItemIds.length})`}
                        </ArchiveCardButton>
                        <ArchiveCardButton disabled={busy || reviewItems.filter((item) => item.status === "needs_review").length === 0} onClick={() => setSelectedItemIds(reviewItems.filter((item) => item.status === "needs_review").map((item) => item.id))}>
                          Valitse kaikki odottavat
                        </ArchiveCardButton>
                      </div>
                      {itemsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Ladataan ehdotuksia…</div>
                      ) : reviewItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Ehdotuksia ei löytynyt.</p>
                      ) : (
                        <div className="space-y-2">
                          {reviewItems.map((item) => (
                            <details key={item.id} className="rounded-md border border-accent-gold/15 bg-background/40 p-3">
                              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-amber-500"
                                  aria-label={`Valitse ${item.name}`}
                                  checked={selectedItemIds.includes(item.id)}
                                  disabled={item.status === "imported" || busy}
                                  onChange={(event) => setSelectedItemIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))}
                                  onClick={(event) => event.stopPropagation()}
                                />
                                <span className="min-w-0 flex-1 text-sm font-medium">{item.name}</span>
                                <Badge variant="outline" className="border-accent-gold/25 text-accent-gold">{ENTITY_TYPE_LABELS[item.entityType] ?? item.entityType}</Badge>
                                {item.status === "imported" && <Badge variant="outline" className="border-green-600/30 text-green-500">Kampanjassa</Badge>}
                              </summary>
                              <div className="mt-3 space-y-3 text-sm">
                                {item.description && <p className="whitespace-pre-wrap">{item.description}</p>}
                                {Object.keys(item.details).length > 0 && (
                                  <div className="space-y-1 rounded border border-accent-gold/10 bg-background/40 p-2">
                                    <div className="text-xs font-medium text-accent-gold">Lisätiedot</div>
                                    {Object.entries(item.details).map(([key, value]) => (
                                      <div key={key} className="break-words text-xs">
                                        <span className="text-muted-foreground">{key}: </span>
                                        {typeof value === "string" ? value : JSON.stringify(value)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="rounded border border-accent-gold/10 bg-background/40 p-2">
                                  <div className="text-xs font-medium text-accent-gold">Lähde</div>
                                  <p className="mt-1 text-xs">{item.sourceName}{item.page ? ` · sivu ${item.page}` : ""}</p>
                                  {item.quote && <blockquote className="mt-2 border-l-2 border-accent-gold/40 pl-2 text-xs italic text-muted-foreground">”{item.quote}”</blockquote>}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  {item.confidence !== null && <span>Varmuusarvio: {Math.round(item.confidence * 100)} %</span>}
                                  <span>Tila: {item.status === "needs_review" ? "Odottaa tarkistusta" : item.status}</span>
                                </div>
                                {item.reviewReason && <p className="text-xs text-amber-400">{item.reviewReason}</p>}
                                {item.relationships.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-accent-gold">Ehdotetut suhteet</div>
                                    {item.relationships.map((relationship, index) => (
                                      <p key={index} className="text-xs">{relationship.targetName} · {relationship.relationshipType}{relationship.description ? ` — ${relationship.description}` : ""}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </details>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

        {finalizeOnComplete && (
          <div className="space-y-3 rounded-md border border-accent-gold/25 bg-background/30 p-3">
            <div className="text-sm font-medium text-accent-gold">Muodosta kampanjatapahtuma</div>
            <p className="text-sm text-muted-foreground">Kun olet tuonut haluamasi kohteet kampanjan tietopankkiin, viimeistele tämä valmistelu oikeaksi kampanjatapahtumaksi.</p>
            <label className="block space-y-1 text-sm">
              <span className="text-accent-gold">Kampanjan nimi</span>
              <input value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} maxLength={120} placeholder="Esim. Varjot sumusuolla" className="w-full rounded-md border border-accent-gold/25 bg-background px-3 py-2 text-foreground" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-accent-gold">Kuvaus (valinnainen)</span>
              <textarea value={campaignDescription} onChange={(event) => setCampaignDescription(event.target.value)} maxLength={5000} rows={3} placeholder="Kampanjan lyhyt esittely pelaajille…" className="w-full rounded-md border border-accent-gold/25 bg-background px-3 py-2 text-foreground" />
            </label>
            <ArchiveCardButton active fullWidth disabled={busy || campaignTitle.trim().length < 3} onClick={handleFinalizeCampaign} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
              {busy ? "Viimeistellään kampanjaa…" : "Luo kampanjatapahtuma"}
            </ArchiveCardButton>
          </div>
        )}
    </div>
  )
}
