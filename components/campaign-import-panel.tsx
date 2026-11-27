"use client"

import { useEffect, useState } from "react"
import { ArchiveCard, ArchiveCardButton, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle } from "@/components/archive-frame"
import { Badge } from "@/components/ui/badge"
import { FileText, Image as ImageIcon, Loader2, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  cancelCampaignImportBatch,
  createCampaignImportBatch,
  listCampaignImportBatches,
  registerCampaignImportSource,
} from "@/app/actions/campaign-import"
import { analyzeCampaignImportBatch, extractCampaignPdfText, getCampaignExtractedPdfTexts } from "@/app/actions/campaign-pdf-extraction"

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

type ExtractedPdfFile = {
  id: string
  fileName: string
  pageCount: number
  pages: Array<{ page: number; text: string }>
  truncated: boolean
  emptyPages: number[]
  extractedAt: string | null
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

export function CampaignImportPanel({ eventId }: { eventId: string }) {
  const [files, setFiles] = useState<File[]>([])
  const [batches, setBatches] = useState<ImportBatch[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [extractionSummary, setExtractionSummary] = useState("")
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null)
  const [extractedFiles, setExtractedFiles] = useState<ExtractedPdfFile[]>([])
  const [textLoading, setTextLoading] = useState(false)

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

      setFiles([])
      await refreshBatches()
      setError("")
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Lähdetiedostojen lisääminen epäonnistui."
      setError(uploadedCount > 0 ? `${uploadedCount} tiedostoa lisättiin. ${message}` : message)
      try { await refreshBatches() } catch { /* Keep the original upload error visible. */ }
    } finally {
      setBusy(false)
    }
  }

  const handleExtractPdfs = async (batchId: string) => {
    if (busy) return
    setBusy(true)
    setError("")
    setExtractionSummary("")

    try {
      const result = await extractCampaignPdfText(batchId)
      if (!result.success) {
        const message = "error" in result ? result.error : result.errors?.join(" ")
        throw new Error(message || "PDF-tekstin poiminta epäonnistui.")
      }
      const extracted = result.results.reduce((sum, item) => sum + item.extractedPages, 0)
      const total = result.results.reduce((sum, item) => sum + item.pageCount, 0)
      const ocrCount = result.results.filter((item) => item.needsOcr).length
      setExtractionSummary(
        `PDF-käsittely valmis: ${result.results.length} tiedostoa, ${extracted}/${total} sivua sisälsi tekstiä.${ocrCount ? ` ${ocrCount} tiedostossa on sivuja, jotka voivat vaatia OCR-tunnistuksen.` : ""}`
      )
      if (result.errors?.length) setError(result.errors.join(" "))
      await refreshBatches()
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : "PDF-tekstin poiminta epäonnistui.")
      try { await refreshBatches() } catch { /* Keep the extraction error visible. */ }
    } finally {
      setBusy(false)
    }
  }



  const handleAnalyzeCampaign = async (batchId: string) => {
    if (busy) return
    setBusy(true)
    setError("")
    setExtractionSummary("")
    try {
      const result = await analyzeCampaignImportBatch(batchId)
      if (!result.success) throw new Error(result.error)
      setExtractionSummary(`Tekoäly muodosti ${result.count} tarkistettavaa ehdotusta. Mitään ei ole vielä lisätty kampanjan varsinaiseen sisältöön.`)
      await refreshBatches()
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Kampanjan tekoälytunnistus epäonnistui.")
      try { await refreshBatches() } catch { /* Keep the original error visible. */ }
    } finally {
      setBusy(false)
    }
  }

  const handleViewExtractedText = async (batchId: string) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId(null)
      setExtractedFiles([])
      return
    }

    setTextLoading(true)
    setError("")
    setExpandedBatchId(batchId)
    setExtractedFiles([])
    try {
      const result = await getCampaignExtractedPdfTexts(batchId)
      if (!result.success) throw new Error(result.error)
      setExtractedFiles(result.files as ExtractedPdfFile[])
      if (result.files.length === 0) setError("Tästä tuontierästä ei löytynyt poimittua PDF-tekstiä.")
    } catch (loadError) {
      setExpandedBatchId(null)
      setError(loadError instanceof Error ? loadError.message : "Poimitun tekstin lataaminen epäonnistui.")
    } finally {
      setTextLoading(false)
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
    <ArchiveCard>
      <ArchiveCardHeader>
        <ArchiveCardTitle className="text-xl normal-case">Kampanjan aineiston tuonti</ArchiveCardTitle>
      </ArchiveCardHeader>
      <ArchiveCardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lisää kampanjan käsikirjoituksia, PDF-tiedostoja, kuvia tai muistiinpanoja samaan tuontierään.
          Alkuperäiset tiedostot säilytetään yksityisinä. Niitä ei vielä analysoida eikä lisätä kampanjaan automaattisesti.
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
            {busy ? "Lisätään lähteitä…" : `Lisää ${files.length || ""} lähdettä tuontierään`}
          </ArchiveCardButton>
        </div>

        {extractionSummary && <p className="rounded-md border border-accent-gold/20 bg-background/30 p-3 text-sm text-accent-gold">{extractionSummary}</p>}\n\n        {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

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
                      <ArchiveCardButton active disabled={busy} onClick={() => handleExtractPdfs(batch.id)}>Poimi PDF-tekstit</ArchiveCardButton>
                    )}
                    {batch.status === "review" && batch.item_count === 0 && (\n                      <ArchiveCardButton active disabled={busy} onClick={() => handleAnalyzeCampaign(batch.id)}>\n                        {busy ? "Tunnistetaan…" : "Tunnista sisältö tekoälyllä"}\n                      </ArchiveCardButton>\n                    )}\n                    {["review", "completed", "partial"].includes(batch.status) && (
                      <ArchiveCardButton
                        disabled={textLoading && expandedBatchId === batch.id}
                        onClick={() => handleViewExtractedText(batch.id)}
                      >
                        {textLoading && expandedBatchId === batch.id ? <Loader2 className="h-4 w-4 animate-spin" /> : expandedBatchId === batch.id ? "Piilota poimittu teksti" : "Näytä poimittu teksti"}
                      </ArchiveCardButton>
                    )}
                    {["uploaded", "review", "failed"].includes(batch.status) && (
                      <ArchiveCardButton disabled={busy} onClick={() => handleCancel(batch.id)}>Peruuta erä</ArchiveCardButton>
                    )}
                  </div>
                  {expandedBatchId === batch.id && (
                    <div className="mt-3 w-full space-y-3 rounded-md border border-accent-gold/20 bg-background/30 p-3">
                      <div className="text-sm font-medium text-accent-gold">Poimittu PDF-teksti</div>
                      {textLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Ladataan tekstiä…</div>
                      ) : extractedFiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Poimittua tekstiä ei löytynyt.</p>
                      ) : extractedFiles.map((file) => (
                        <div key={file.id} className="space-y-2">
                          <div className="text-sm font-medium break-words">{file.fileName}</div>
                          <p className="text-xs text-muted-foreground">
                            {file.pages.length} tekstisivua / {file.pageCount} sivua
                            {file.truncated ? " · Tekstiä on rajattu enimmäispituuden vuoksi." : ""}
                            {file.emptyPages.length ? ` · OCR-tarkistusta mahdollisesti vaativat sivut: ${file.emptyPages.join(", ")}.` : ""}
                          </p>
                          <div className="space-y-2">
                            {file.pages.map((page) => (
                              <details key={page.page} className="rounded border border-accent-gold/10 bg-background/40 p-2">
                                <summary className="cursor-pointer text-sm font-medium">Sivu {page.page}</summary>
                                <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-foreground">{page.text || "Sivulta ei löytynyt tekstikerrosta."}</pre>
                              </details>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
