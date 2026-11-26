"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

const STORAGE_BUCKET = "campaign-import-sources"
const MAX_PDF_BYTES = 25 * 1024 * 1024
const MAX_PDF_PAGES = 500
const MAX_EXTRACTED_CHARS = 750_000

async function requireCampaignGMFromBatch(batchId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Kirjautuminen vaaditaan." as const }

  const db = createServiceClient()
  const { data: batch, error } = await db
    .from("campaign_import_batches")
    .select("id, event_id, status, event:events!inner(id, host_id, event_type)")
    .eq("id", batchId)
    .maybeSingle()

  if (error || !batch) return { error: "Tuontierää ei löytynyt." as const }
  const event = Array.isArray(batch.event) ? batch.event[0] : batch.event
  if (!event || event.event_type !== "campaign" || event.host_id !== user.id) {
    return { error: "Vain kampanjanjohtaja voi käsitellä tämän kampanjan aineistoa." as const }
  }

  return { userId: user.id, eventId: batch.event_id, status: batch.status }
}

type ExtractedPage = { page: number; text: string }

export async function extractCampaignPdfText(batchId: string) {
  if (typeof batchId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchId)) {
    return { success: false as const, error: "Virheellinen tuontierä." }
  }

  const access = await requireCampaignGMFromBatch(batchId)
  if ("error" in access) return { success: false as const, error: access.error }
  if (access.status !== "uploaded" && access.status !== "failed") {
    return { success: false as const, error: "Tämä tuontierä ei ole PDF-tekstin poimintaan sopivassa tilassa." }
  }

  const db = createServiceClient()
  const { data: sources, error: sourceError } = await db
    .from("campaign_import_sources")
    .select("id, file_name, mime_type, file_size_bytes, storage_path, metadata")
    .eq("batch_id", batchId)
    .eq("event_id", access.eventId)
    .eq("source_kind", "pdf")

  if (sourceError) return { success: false as const, error: sourceError.message }
  if (!sources?.length) return { success: false as const, error: "Tuontierässä ei ole PDF-tiedostoja." }

  const { error: statusError } = await db
    .from("campaign_import_batches")
    .update({ status: "processing", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", batchId)
    .eq("event_id", access.eventId)
  if (statusError) return { success: false as const, error: statusError.message }

  const results: Array<{ sourceId: string; fileName: string; pageCount: number; extractedPages: number; characterCount: number; needsOcr: boolean }> = []
  const errors: string[] = []

  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")

    for (const source of sources) {
      try {
        if (!source.storage_path) throw new Error("Tallennuspolku puuttuu.")
        if (source.mime_type !== "application/pdf") throw new Error("Lähteen MIME-tyyppi ei ole PDF.")
        if (source.file_size_bytes && source.file_size_bytes > MAX_PDF_BYTES) throw new Error("PDF ylittää 25 Mt enimmäiskoon.")

        const { data: file, error: downloadError } = await db.storage.from(STORAGE_BUCKET).download(source.storage_path)
        if (downloadError || !file) throw new Error(downloadError?.message || "PDF-tiedoston lataus epäonnistui.")
        if (file.size > MAX_PDF_BYTES) throw new Error("PDF ylittää 25 Mt enimmäiskoon.")

        const bytes = new Uint8Array(await file.arrayBuffer())
        const loadingTask = pdfjs.getDocument({
          data: bytes,
          useSystemFonts: true,
          isEvalSupported: false,
          disableFontFace: true,
        })
        const pdf = await loadingTask.promise
        if (pdf.numPages > MAX_PDF_PAGES) {
          await pdf.destroy()
          throw new Error(`PDF sisältää ${pdf.numPages} sivua. Enimmäismäärä on ${MAX_PDF_PAGES} sivua.`)
        }

        const pages: ExtractedPage[] = []
        let totalCharacters = 0
        let truncated = false

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber)
          const content = await page.getTextContent()
          const pageText = content.items
            .map((item: any) => typeof item.str === "string" ? item.str : "")
            .filter(Boolean)
            .join(" ")
            .replace(/[ \t]+/g, " ")
            .trim()

          if (pageText) {
            const remaining = MAX_EXTRACTED_CHARS - totalCharacters
            if (remaining <= 0) {
              truncated = true
              break
            }
            const safeText = pageText.slice(0, remaining)
            pages.push({ page: pageNumber, text: safeText })
            totalCharacters += safeText.length
            if (safeText.length < pageText.length) {
              truncated = true
              break
            }
          } else {
            pages.push({ page: pageNumber, text: "" })
          }
        }

        await pdf.destroy()

        const extractedText = pages
          .filter((page) => page.text)
          .map((page) => `[Sivu ${page.page}]\n${page.text}`)
          .join("\n\n")

        const emptyPages = pages.filter((page) => !page.text).map((page) => page.page)
        const previousMetadata = source.metadata && typeof source.metadata === "object"
          ? source.metadata as Record<string, unknown>
          : {}

        const extraction = {
          status: extractedText ? "completed" : "needs_ocr",
          method: "pdfjs-text-layer",
          parserVersion: "pdfjs-dist@4.10.38",
          extractedAt: new Date().toISOString(),
          pageCount: pdf.numPages,
          extractedPageCount: pages.filter((page) => page.text).length,
          emptyPages,
          truncated,
          characterCount: totalCharacters,
          pages,
        }

        const { error: updateError } = await db
          .from("campaign_import_sources")
          .update({
            source_text: extractedText,
            page_count: pdf.numPages,
            metadata: { ...previousMetadata, extraction },
          })
          .eq("id", source.id)
          .eq("batch_id", batchId)
        if (updateError) throw new Error(updateError.message)

        results.push({
          sourceId: source.id,
          fileName: source.file_name,
          pageCount: pdf.numPages,
          extractedPages: pages.filter((page) => page.text).length,
          characterCount: totalCharacters,
          needsOcr: !extractedText || emptyPages.length > 0,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "PDF:n käsittely epäonnistui."
        errors.push(`${source.file_name}: ${message}`)
        const previousMetadata = source.metadata && typeof source.metadata === "object"
          ? source.metadata as Record<string, unknown>
          : {}
        await db.from("campaign_import_sources").update({
          metadata: {
            ...previousMetadata,
            extraction: { status: "failed", method: "pdfjs-text-layer", error: message, attemptedAt: new Date().toISOString() },
          },
        }).eq("id", source.id).eq("batch_id", batchId)
      }
    }

    const finalStatus = results.length > 0 ? "review" : "failed"
    const { error: batchUpdateError } = await db
      .from("campaign_import_batches")
      .update({
        status: finalStatus,
        error_message: errors.length ? errors.join("\n").slice(0, 4000) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", batchId)
      .eq("event_id", access.eventId)
    if (batchUpdateError) throw new Error(batchUpdateError.message)

    revalidatePath("/events/" + access.eventId)
    if (results.length > 0) return { success: true as const, results, errors }
    return { success: false as const, error: errors.join(" ") || "PDF-tiedostoista ei saatu poimittua tekstiä.", results, errors }
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF-tekstin poiminta epäonnistui."
    await db.from("campaign_import_batches").update({
      status: "failed",
      error_message: message.slice(0, 4000),
      updated_at: new Date().toISOString(),
    }).eq("id", batchId).eq("event_id", access.eventId)
    revalidatePath("/events/" + access.eventId)
    return { success: false as const, error: message }
  }
}
