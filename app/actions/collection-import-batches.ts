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
