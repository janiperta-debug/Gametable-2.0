import "server-only"

import { createServiceClient } from "@/lib/supabase/service"

export type TcgSystem = "mtg" | "pokemon" | "yugioh" | "lorcana" | "fab" | "onepiece"
export type TcgSourceKey =
  | "scryfall" | "pokemontcg" | "tcgdex" | "ygoprodeck"
  | "lorcast" | "lorcana_api" | "goagain" | "optcgapi"
  | "apitcg" | "openrift" | "digimoncardio" | "bandai"

export interface UpsertTcgSourceCardInput {
  system: TcgSystem
  sourceKey: TcgSourceKey
  externalId: string
  name: string
  setCode?: string | null
  setName?: string | null
  rarity?: string | null
  imageUrl?: string | null
  manaCost?: string | null
  typeLine?: string | null
  cardType?: string | null
  cmc?: number | null
  priceUsd?: number | null
  sourceUrl?: string | null
  sourceMetadata?: Record<string, unknown>
}

const clean = (value?: string | null) => value?.trim() || null

/**
 * Resolve one provider printing to one stable GameTable catalog row.
 * Provider identities live in tcg_card_sources; tcg_cards.id never changes.
 * We only reuse an unlinked legacy row when its raw ID AND known print metadata
 * agree. We never merge cards by name alone.
 */
export async function upsertTcgSourceCard(input: UpsertTcgSourceCardInput): Promise<string> {
  const externalId = clean(input.externalId)
  const name = clean(input.name)
  if (!externalId || !name) throw new Error("TCG source card requires an external ID and name")

  const db = createServiceClient()
  const sourceIdentity = {
    tcg_system: input.system,
    source_key: input.sourceKey,
    external_id: externalId,
  }

  const { data: source, error: sourceLookupError } = await db
    .from("tcg_card_sources")
    .select("card_id")
    .match(sourceIdentity)
    .maybeSingle()
  if (sourceLookupError) throw new Error(sourceLookupError.message)

  const cardFields = {
    name,
    set_code: clean(input.setCode),
    set_name: clean(input.setName),
    rarity: clean(input.rarity),
    image_url: clean(input.imageUrl),
    mana_cost: clean(input.manaCost),
    type_line: clean(input.typeLine),
    card_type: clean(input.cardType),
    cmc: input.cmc ?? null,
    price_usd: input.priceUsd ?? null,
  }

  const mergeMissingFields = async (cardId: string) => {
    const { data: current, error } = await db.from("tcg_cards")
      .select("name, set_code, set_name, rarity, image_url, mana_cost, type_line, card_type, cmc, price_usd")
      .eq("id", cardId).single()
    if (error) throw new Error(error.message)

    const patch: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(cardFields)) {
      if ((current as Record<string, unknown>)[key] == null && value != null) patch[key] = value
    }
    if (Object.keys(patch).length) {
      const { error: updateError } = await db.from("tcg_cards").update(patch).eq("id", cardId)
      if (updateError) throw new Error(updateError.message)
    }
  }

  if (source?.card_id) {
    await mergeMissingFields(source.card_id)
    const { error } = await db.from("tcg_card_sources").update({
      source_url: input.sourceUrl ?? null,
      source_metadata: input.sourceMetadata ?? {},
      last_seen_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).match(sourceIdentity)
    if (error) throw new Error(error.message)
    return source.card_id
  }

  // Reuse a backfilled legacy row only when its printing metadata agrees.
  const { data: legacy, error: legacyError } = await db.from("tcg_cards")
    .select("id, name, set_code, set_name")
    .eq("tcg_system", input.system)
    .eq("external_id", externalId)
    .maybeSingle()
  if (legacyError) throw new Error(legacyError.message)

  let cardId: string | null = null
  if (legacy) {
    const sameName = String(legacy.name).trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    const sameSetCode = clean(legacy.set_code) === clean(input.setCode)
    const sameSetName = clean(legacy.set_name) === clean(input.setName)
    if (sameName && sameSetCode && sameSetName) cardId = legacy.id
  }

  if (!cardId) {
    // Provider IDs are not globally unique. Namespace only when the raw ID
    // is already occupied by a different or unverifiable legacy catalog row.
    const catalogExternalId = legacy ? `${input.sourceKey}:${externalId}` : externalId
    const { data: inserted, error: insertError } = await db.from("tcg_cards").insert({
      tcg_system: input.system,
      external_id: catalogExternalId,
      ...cardFields,
      price_updated: input.priceUsd != null ? new Date().toISOString() : null,
    }).select("id").single()

    if (insertError) {
      // Concurrent imports of the same provider printing are safe to retry.
      const { data: racedSource } = await db.from("tcg_card_sources")
        .select("card_id").match(sourceIdentity).maybeSingle()
      if (racedSource?.card_id) return racedSource.card_id

      const { data: racedCard } = await db.from("tcg_cards")
        .select("id").eq("tcg_system", input.system).eq("external_id", catalogExternalId).maybeSingle()
      if (!racedCard?.id) throw new Error(insertError.message)
      cardId = racedCard.id
    } else {
      cardId = inserted.id
    }
  }

  const now = new Date().toISOString()
  const { error: sourceInsertError } = await db.from("tcg_card_sources").upsert({
    card_id: cardId,
    ...sourceIdentity,
    source_url: input.sourceUrl ?? null,
    source_metadata: input.sourceMetadata ?? {},
    last_seen_at: now,
    last_synced_at: now,
    updated_at: now,
  }, { onConflict: "tcg_system,source_key,external_id" })

  if (sourceInsertError) throw new Error(sourceInsertError.message)
  await mergeMissingFields(cardId)
  return cardId
}
