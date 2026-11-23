"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export type CollectionImportCategory = "tcg" | "miniatures" | "board_game" | "rpg"
export type CollectionImportInputType = "text" | "image" | "file" | "screenshot"
export type CollectionImportBatchStatus =
  | "uploaded" | "processing" | "review" | "committing"
  | "completed" | "partial" | "failed" | "cancelled"

const MAX_SOURCE_TEXT_LENGTH = 50_000

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export interface CreateTextImportBatchInput {
  category: CollectionImportCategory
  sourceText: string
  sourceMetadata?: Record<string, unknown>
}

/**
 * Creates a persistent text-import batch. Image/file uploads will use the
 * same batch model once their storage upload flow is connected.
 */
export async function createTextImportBatch(input: CreateTextImportBatchInput) {
  if (!input || !["tcg", "miniatures", "board_game", "rpg"].includes(input.category)) {
    return { success: false as const, error: "Invalid import category" }
  }

  const sourceText = typeof input.sourceText === "string" ? input.sourceText.trim() : ""
  if (!sourceText) return { success: false as const, error: "Import text is empty" }
  if (sourceText.length > MAX_SOURCE_TEXT_LENGTH) {
    return { success: false as const, error: "Import text is too long (maximum 50,000 characters)" }
  }

  const user = await getAuthenticatedUser()
  if (!user) return { success: false as const, error: "Not authenticated" }

  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("collection_import_batches")
      .insert({
        user_id: user.id,
        category: input.category,
        input_type: "text",
        status: "uploaded",
        source_text: sourceText,
        source_metadata: input.sourceMetadata ?? {},
      })
      .select("id, category, input_type, status, created_at")
      .single()

    if (error) return { success: false as const, error: error.message }
    return { success: true as const, batch: data }
  } catch (error) {
    console.error("Create collection import batch failed:", error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not create import batch",
    }
  }
}

export async function listCollectionImportBatches(limit = 20) {
  const user = await getAuthenticatedUser()
  if (!user) return { success: false as const, error: "Not authenticated", batches: [] }

  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 50) : 20

  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("collection_import_batches")
      .select("id, category, input_type, status, error_message, created_at, updated_at, completed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(safeLimit)

    if (error) return { success: false as const, error: error.message, batches: [] }
    return { success: true as const, batches: data ?? [] }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not load import batches",
      batches: [],
    }
  }
}

export async function getCollectionImportBatch(batchId: string) {
  if (typeof batchId !== "string" || !batchId.trim()) {
    return { success: false as const, error: "Invalid import batch" }
  }

  const user = await getAuthenticatedUser()
  if (!user) return { success: false as const, error: "Not authenticated" }

  try {
    const db = createServiceClient()
    const { data: batch, error: batchError } = await db
      .from("collection_import_batches")
      .select("*")
      .eq("id", batchId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (batchError) return { success: false as const, error: batchError.message }
    if (!batch) return { success: false as const, error: "Import batch not found" }

    const { data: items, error: itemsError } = await db
      .from("collection_import_items")
      .select("*")
      .eq("batch_id", batchId)
      .order("row_index", { ascending: true })

    if (itemsError) return { success: false as const, error: itemsError.message }

    const itemIds = (items ?? []).map((item) => item.id)
    let candidates: Record<string, unknown>[] = []
    if (itemIds.length > 0) {
      const { data, error } = await db
        .from("collection_import_candidates")
        .select("*")
        .in("item_id", itemIds)
        .order("match_score", { ascending: false })
      if (error) return { success: false as const, error: error.message }
      candidates = data ?? []
    }

    return { success: true as const, batch, items: items ?? [], candidates }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not load import batch",
    }
  }
}

export async function reviewCollectionImportItem(input: {
  itemId: string
  decision: "accept" | "reject"
  candidateId?: string | null
}) {
  if (!input || typeof input.itemId !== "string" || !input.itemId.trim()) {
    return { success: false as const, error: "Invalid import item" }
  }
  if (input.decision === "accept" && !input.candidateId) {
    return { success: false as const, error: "Choose a catalog match before accepting this item" }
  }

  const user = await getAuthenticatedUser()
  if (!user) return { success: false as const, error: "Not authenticated" }

  try {
    const db = createServiceClient()
    const { data: item, error: itemError } = await db
      .from("collection_import_items")
      .select("id, batch_id, status, batch:collection_import_batches!inner(user_id, status)")
      .eq("id", input.itemId)
      .eq("batch.user_id", user.id)
      .maybeSingle()

    if (itemError) return { success: false as const, error: itemError.message }
    if (!item) return { success: false as const, error: "Import item not found" }

    const batch = Array.isArray(item.batch) ? item.batch[0] : item.batch
    if (batch?.status !== "review") {
      return { success: false as const, error: "This import batch is not currently awaiting review" }
    }
    if (["imported", "failed"].includes(item.status)) {
      return { success: false as const, error: "This import item can no longer be reviewed" }
    }

    let resolvedCatalogId: string | null = null
    if (input.decision === "accept") {
      const { data: candidate, error: candidateError } = await db
        .from("collection_import_candidates")
        .select("id, catalog_id")
        .eq("id", input.candidateId!)
        .eq("item_id", item.id)
        .maybeSingle()

      if (candidateError) return { success: false as const, error: candidateError.message }
      if (!candidate) return { success: false as const, error: "Selected catalog match does not belong to this item" }
      resolvedCatalogId = candidate.catalog_id
    }

    const { error: updateError } = await db
      .from("collection_import_items")
      .update({
        status: input.decision === "accept" ? "accepted" : "rejected",
        selected_candidate_id: input.decision === "accept" ? input.candidateId : null,
        resolved_catalog_id: resolvedCatalogId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)

    if (updateError) return { success: false as const, error: updateError.message }
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not save import review",
    }
  }
}


interface ParsedImportLine {
  name: string
  quantity: number
  setCode?: string
  rawText: string
}

function parseImportLines(sourceText: string, category: CollectionImportCategory): ParsedImportLine[] {
  const lines = sourceText.split(/\\r?\\n/).map((line) => line.trim()).filter(Boolean)
  const parsed: ParsedImportLine[] = []

  for (const rawText of lines) {
    if (/^(#|\/\/|\[|sideboard:|commander:)/i.test(rawText) || rawText.endsWith(":")) continue

    if (category === "tcg") {
      const match = rawText.match(/^(\\d+)x?\\s+(.+?)(?:\\s+\\(([A-Z0-9_-]+)\\))?(?:\\s+\\d+)?$/i)
      if (match) {
        parsed.push({
          quantity: Math.max(1, Number.parseInt(match[1], 10)),
          name: match[2].trim(),
          setCode: match[3]?.toUpperCase(),
          rawText,
        })
      } else {
        parsed.push({ quantity: 1, name: rawText, rawText })
      }
      continue
    }

    // Miniature rosters commonly use "5 Intercessors" or "Intercessors x5".
    const leadingQuantity = rawText.match(/^(\\d+)x?\\s+(.+?)(?:\\s+\\(\\d+\\s*(?:pts|points)?\\))?$/i)
    const trailingQuantity = rawText.match(/^(.+?)\\s+x(\\d+)(?:\\s+\\(\\d+\\s*(?:pts|points)?\\))?$/i)
    if (leadingQuantity) {
      parsed.push({ quantity: Math.max(1, Number.parseInt(leadingQuantity[1], 10)), name: leadingQuantity[2].trim(), rawText })
    } else if (trailingQuantity) {
      parsed.push({ quantity: Math.max(1, Number.parseInt(trailingQuantity[2], 10)), name: trailingQuantity[1].trim(), rawText })
    } else {
      parsed.push({ quantity: 1, name: rawText, rawText })
    }
  }

  return parsed.filter((line) => line.name.length > 0).slice(0, 500)
}

function scoreCatalogMatch(query: string, candidateName: string): { score: number; reasons: string[] } {
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\\p{L}\\p{N}]+/gu, " ").trim()
  const wanted = normalize(query)
  const found = normalize(candidateName)
  if (wanted === found) return { score: 1, reasons: ["Exact name match"] }
  if (found.startsWith(wanted) || wanted.startsWith(found)) return { score: 0.9, reasons: ["Name prefix match"] }
  if (found.includes(wanted) || wanted.includes(found)) return { score: 0.78, reasons: ["Name contains match"] }
  const wantedWords = new Set(wanted.split(/\\s+/).filter(Boolean))
  const foundWords = new Set(found.split(/\\s+/).filter(Boolean))
  const overlap = [...wantedWords].filter((word) => foundWords.has(word)).length
  const score = wantedWords.size ? 0.55 * overlap / wantedWords.size : 0
  return { score, reasons: overlap ? ["Partial word match"] : [] }
}

/**
 * Parses a text batch and proposes matches from GameTable's canonical catalog.
 * Nothing is added to a user's collection here: all matches require review.
 */
export async function processCollectionImportBatch(batchId: string) {
  if (typeof batchId !== "string" || !batchId.trim()) {
    return { success: false as const, error: "Invalid import batch" }
  }

  const user = await getAuthenticatedUser()
  if (!user) return { success: false as const, error: "Not authenticated" }

  const db = createServiceClient()
  const { data: batch, error: batchError } = await db
    .from("collection_import_batches")
    .select("id, category, input_type, status, source_text, source_metadata")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (batchError) return { success: false as const, error: batchError.message }
  if (!batch) return { success: false as const, error: "Import batch not found" }
  if (batch.input_type !== "text" || !batch.source_text) {
    return { success: false as const, error: "This batch does not contain text input" }
  }
  if (!["tcg", "miniatures"].includes(batch.category)) {
    return { success: false as const, error: "This category is not enabled for imports yet" }
  }
  if (batch.status !== "uploaded") {
    return { success: false as const, error: "This batch has already been processed or cannot be processed" }
  }

  const { data: claimed, error: claimError } = await db
    .from("collection_import_batches")
    .update({ status: "processing", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", batchId)
    .eq("user_id", user.id)
    .eq("status", "uploaded")
    .select("id")
    .maybeSingle()

  if (claimError) return { success: false as const, error: claimError.message }
  if (!claimed) return { success: false as const, error: "This batch is already being processed" }

  try {
    const category = batch.category as CollectionImportCategory
    const lines = parseImportLines(batch.source_text, category)
    if (lines.length === 0) throw new Error("No importable rows were found in the text")

    const itemRows = lines.map((line, index) => ({
      batch_id: batchId,
      row_index: index,
      raw_text: line.rawText,
      parsed_data: { name: line.name, quantity: line.quantity, setCode: line.setCode ?? null },
      status: "pending",
    }))

    const { data: items, error: itemInsertError } = await db
      .from("collection_import_items")
      .insert(itemRows)
      .select("id, row_index, parsed_data")

    if (itemInsertError) throw new Error(itemInsertError.message)

    const candidateRows: Array<Record<string, unknown>> = []
    const itemStatusUpdates: Array<{ id: string; status: string; review_reason: string | null }> = []

    for (const item of items ?? []) {
      const parsed = item.parsed_data as { name?: string; quantity?: number; setCode?: string | null }
      const name = (parsed.name ?? "").trim()
      let matches: Array<{ id: string; name: string; extra: Record<string, unknown> }> = []

      if (category === "tcg") {
        let query = db.from("tcg_cards")
          .select("id, name, tcg_system, external_id, set_name, set_code, rarity, image_url")
          .ilike("name", `%${name}%`)
          .limit(20)
        if (parsed.setCode) query = query.eq("set_code", parsed.setCode)
        const { data, error } = await query
        if (error) throw new Error(error.message)
        matches = (data ?? []).map((card) => ({
          id: card.id,
          name: card.name,
          extra: {
            game: card.tcg_system,
            externalId: card.external_id,
            set: card.set_name,
            setCode: card.set_code,
            rarity: card.rarity,
            imageUrl: card.image_url,
          },
        }))
      } else {
        const { data, error } = await db
          .from("mini_units")
          .select("id, name, unit_type, base_points, model_count_min, model_count_max, faction:mini_factions!inner(id, name, system:mini_systems!inner(id, name, code, edition))")
          .ilike("name", `%${name}%`)
          .limit(20)
        if (error) throw new Error(error.message)
        matches = (data ?? []).map((unit: any) => {
          const faction = Array.isArray(unit.faction) ? unit.faction[0] : unit.faction
          const system = Array.isArray(faction?.system) ? faction.system[0] : faction?.system
          return {
            id: unit.id,
            name: unit.name,
            extra: {
              unitType: unit.unit_type,
              basePoints: unit.base_points,
              modelCountMin: unit.model_count_min,
              modelCountMax: unit.model_count_max,
              factionId: faction?.id,
              factionName: faction?.name,
              systemId: system?.id,
              systemName: system?.name,
              systemCode: system?.code,
              edition: system?.edition,
            },
          }
        })
      }

      const ranked = matches
        .map((match) => ({ ...match, ...scoreCatalogMatch(name, match.name) }))
        .filter((match) => match.score >= 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      for (const match of ranked) {
        candidateRows.push({
          item_id: item.id,
          catalog_id: match.id,
          catalog_source: category === "tcg" ? "tcg_cards" : "mini_units",
          match_score: match.score,
          match_reasons: match.reasons,
          candidate_data: { name: match.name, ...match.extra },
        })
      }

      itemStatusUpdates.push({
        id: item.id,
        status: ranked.length === 0 ? "unmatched" : ranked[0].score >= 0.95 ? "matched" : "needs_review",
        review_reason: ranked.length === 0 ? "No catalog match found" : ranked.length > 1 ? "Multiple possible catalog matches" : ranked[0].reasons.join(", "),
      })
    }

    if (candidateRows.length > 0) {
      const { error } = await db.from("collection_import_candidates").insert(candidateRows)
      if (error) throw new Error(error.message)
    }

    for (const update of itemStatusUpdates) {
      const { error } = await db.from("collection_import_items")
        .update({ status: update.status, review_reason: update.review_reason, updated_at: new Date().toISOString() })
        .eq("id", update.id)
      if (error) throw new Error(error.message)
    }

    const { error: finishError } = await db.from("collection_import_batches")
      .update({ status: "review", updated_at: new Date().toISOString() })
      .eq("id", batchId)
      .eq("user_id", user.id)
      .eq("status", "processing")
    if (finishError) throw new Error(finishError.message)

    return {
      success: true as const,
      batchId,
      itemCount: itemRows.length,
      candidateCount: candidateRows.length,
      reviewCount: itemStatusUpdates.filter((item) => item.status !== "matched").length,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not process import batch"
    await db.from("collection_import_batches")
      .update({ error_message: message, updated_at: new Date().toISOString() })
      .eq("id", batchId)
      .eq("user_id", user.id)
    return { success: false as const, error: message }
  }
}

export async function cancelCollectionImportBatch(batchId: string) {
  if (typeof batchId !== "string" || !batchId.trim()) {
    return { success: false as const, error: "Invalid import batch" }
  }

  const user = await getAuthenticatedUser()
  if (!user) return { success: false as const, error: "Not authenticated" }

  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("collection_import_batches")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", batchId)
      .eq("user_id", user.id)
      .in("status", ["uploaded", "processing", "review", "failed"])
      .select("id")
      .maybeSingle()

    if (error) return { success: false as const, error: error.message }
    if (!data) return { success: false as const, error: "Batch not found or can no longer be cancelled" }
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not cancel import batch",
    }
  }
}


/**
 * Commits every accepted row through one database transaction per item.
 * The database commit ledger makes retries safe: an already committed item
 * returns its original ownership record instead of applying quantity again.
 */
export async function commitCollectionImportBatch(batchId: string) {
  if (typeof batchId !== "string" || !batchId.trim()) {
    return { success: false as const, error: "Invalid import batch" }
  }

  const user = await getAuthenticatedUser()
  if (!user) return { success: false as const, error: "Not authenticated" }

  const db = createServiceClient()
  const { data: batch, error: batchError } = await db
    .from("collection_import_batches")
    .select("id, category, status")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (batchError) return { success: false as const, error: batchError.message }
  if (!batch) return { success: false as const, error: "Import batch not found" }
  if (!["tcg", "miniatures"].includes(batch.category)) {
    return { success: false as const, error: "This category is not enabled for imports yet" }
  }
  if (!["review", "committing", "partial"].includes(batch.status)) {
    return { success: false as const, error: "This batch is not ready to commit" }
  }

  const { error: claimError } = await db
    .from("collection_import_batches")
    .update({ status: "committing", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", batchId)
    .eq("user_id", user.id)
    .in("status", ["review", "committing", "partial"])

  if (claimError) return { success: false as const, error: claimError.message }

  const { data: items, error: itemsError } = await db
    .from("collection_import_items")
    .select("id, status")
    .eq("batch_id", batchId)
    .order("row_index", { ascending: true })

  if (itemsError) {
    await db.from("collection_import_batches")
      .update({ status: "partial", error_message: itemsError.message, updated_at: new Date().toISOString() })
      .eq("id", batchId)
      .eq("user_id", user.id)
    return { success: false as const, error: itemsError.message }
  }

  let committedCount = 0
  let failedCount = 0
  let alreadyCommittedCount = 0

  for (const item of items ?? []) {
    if (item.status === "imported") {
      alreadyCommittedCount++
      continue
    }
    if (item.status !== "accepted") continue

    const { data, error } = await db.rpc("commit_collection_import_item", {
      p_item_id: item.id,
      p_user_id: user.id,
    })

    if (error || !data?.success) {
      failedCount++
      const message = error?.message || "Could not commit import item"
      // Keep the row accepted so the user can retry after a transient failure.
      await db.from("collection_import_items")
        .update({ error_message: message, updated_at: new Date().toISOString() })
        .eq("id", item.id)
        .eq("batch_id", batchId)
      continue
    }

    if (data.alreadyCommitted) alreadyCommittedCount++
    else committedCount++
  }

  const finalStatus = failedCount > 0 ? "partial" : "completed"
  const { error: finishError } = await db
    .from("collection_import_batches")
    .update({
      status: finalStatus,
      error_message: failedCount > 0 ? `${failedCount} item(s) could not be committed` : null,
      updated_at: new Date().toISOString(),
      completed_at: finalStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", batchId)
    .eq("user_id", user.id)

  if (finishError) return { success: false as const, error: finishError.message }

  if (committedCount > 0 || alreadyCommittedCount > 0) {
    const { awardCategoryImportXP } = await import("@/lib/xp-engine")
    const xpCategory = batch.category === "tcg" ? "tcg" : "miniatures"
    const xpResult = await awardCategoryImportXP(user.id, xpCategory)
    if (!xpResult.applied) {
      console.info("Collection import category XP was not applied", {
        userId: user.id,
        category: batch.category,
      })
    }
  }

  return {
    success: failedCount === 0,
    batchId,
    status: finalStatus,
    committedCount,
    alreadyCommittedCount,
    failedCount,
  } as const
}
