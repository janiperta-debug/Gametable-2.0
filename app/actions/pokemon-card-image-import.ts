"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type PokemonRecognition = {
  name: string
  setName: string | null
  setCode: string | null
  collectorNumber: string | null
  language: string | null
  confidence: number
}

export async function processPokemonCardImageImport(storagePath: string) {
  if (typeof storagePath !== "string" || !storagePath.trim() || storagePath.length > 500) {
    return { success: false as const, error: "Virheellinen kuvatiedoston polku" }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false as const, error: "Kirjautuminen vaaditaan" }
  if (!storagePath.startsWith(`${user.id}/`) || storagePath.includes("..")) {
    return { success: false as const, error: "Kuvatiedoston käyttö estetty" }
  }

  const db = createServiceClient()
  let batchId: string | null = null

  try {
    const { data: file, error: downloadError } = await db.storage
      .from("collection-import-images").download(storagePath)
    if (downloadError || !file) throw new Error(downloadError?.message ?? "Kuvan lataus epäonnistui")

    const mimeType = file.type
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      throw new Error("Käytä JPEG-, PNG- tai WebP-kuvaa")
    }
    if (file.size > 10 * 1024 * 1024) throw new Error("Kuvan enimmäiskoko on 10 Mt")

    const bytes = Buffer.from(await file.arrayBuffer())
    const dataUrl = `data:${mimeType};base64,${bytes.toString("base64")}`
    const gatewayKey = process.env.AI_GATEWAY_API_KEY
    if (!gatewayKey) throw new Error("AI Gateway -yhteys puuttuu Vercelin ympäristömuuttujista")

    const aiResponse = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "Tunnista kuvasta yksi Pokémon-keräilykortti. Lue kortin nimi, setin nimi, setin tunnus jos näkyy, keräilynumero (esim. 025/198) ja kortin kieli. Älä arvaa epäselviä tietoja: käytä null-arvoa. Palauta vain JSON muodossa {name:string,setName:string|null,setCode:string|null,collectorNumber:string|null,language:string|null,confidence:number}. confidence on 0-1.",
            },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        }],
      }),
      cache: "no-store",
    })
    if (!aiResponse.ok) throw new Error(`Kuvantunnistus epäonnistui (${aiResponse.status})`)
    const aiPayload = await aiResponse.json()
    const raw = aiPayload.choices?.[0]?.message?.content
    if (typeof raw !== "string") throw new Error("Tekoäly ei palauttanut kortin tunnistustietoja")
    const parsed = JSON.parse(raw) as Partial<PokemonRecognition>
    const recognition: PokemonRecognition = {
      name: String(parsed.name ?? "").trim().slice(0, 120),
      setName: typeof parsed.setName === "string" ? parsed.setName.slice(0, 120) : null,
      setCode: typeof parsed.setCode === "string" ? parsed.setCode.slice(0, 30) : null,
      collectorNumber: typeof parsed.collectorNumber === "string" ? parsed.collectorNumber.slice(0, 30) : null,
      language: typeof parsed.language === "string" ? parsed.language.slice(0, 20) : null,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    }
    if (!recognition.name) throw new Error("Kortin nimeä ei saatu tunnistettua. Kokeile tarkempaa kuvaa.")

    const { data: batch, error: batchError } = await db.from("collection_import_batches").insert({
      user_id: user.id,
      category: "tcg",
      input_type: "image",
      status: "processing",
      source_storage_path: storagePath,
      source_metadata: { game: "pokemon", recognition },
    }).select("id").single()
    if (batchError) throw new Error(batchError.message)
    batchId = batch.id

    const { data: item, error: itemError } = await db.from("collection_import_items").insert({
      batch_id: batch.id,
      row_index: 0,
      raw_text: recognition.name,
      parsed_data: {
        name: recognition.name,
        quantity: 1,
        setCode: recognition.setCode,
        collectorNumber: recognition.collectorNumber,
        setName: recognition.setName,
        language: recognition.language,
        recognitionConfidence: recognition.confidence,
      },
      status: "pending",
    }).select("id").single()
    if (itemError) throw new Error(itemError.message)

    const query = new URLSearchParams({ name: recognition.name, "pagination:page": "1", "pagination:itemsPerPage": "40" })
    const catalogResponse = await fetch(`https://api.tcgdex.net/v2/en/cards?${query.toString()}`, {
      headers: { Accept: "application/json" }, cache: "no-store",
    })
    if (!catalogResponse.ok) throw new Error(`TCGdex-haku epäonnistui (${catalogResponse.status})`)
    const catalogCards = await catalogResponse.json() as Array<{
      id: string; name: string; localId?: string; image?: string; rarity?: string; set?: { id?: string; name?: string }
    }>

    const exactMatches = (Array.isArray(catalogCards) ? catalogCards : []).filter((card) => {
      const nameMatch = card.name.toLocaleLowerCase() === recognition.name.toLocaleLowerCase()
      const numberMatch = !recognition.collectorNumber || !card.localId || card.localId === recognition.collectorNumber.split("/")[0]
      const setMatch = !recognition.setCode || !card.set?.id || card.set.id.toLowerCase() === recognition.setCode.toLowerCase()
      return nameMatch && numberMatch && setMatch
    }).slice(0, 8)

    const candidateRows = []
    for (const card of exactMatches) {
      const { data: existing, error: lookupError } = await db.from("tcg_cards")
        .select("id").eq("tcg_system", "pokemon").eq("external_id", card.id).maybeSingle()
      if (lookupError) throw new Error(lookupError.message)
      let catalogId = existing?.id
      let detail: any = card
      if (!catalogId) {
        const detailResponse = await fetch(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(card.id)}`, { cache: "no-store" })
        if (detailResponse.ok) detail = await detailResponse.json()
        const { data: inserted, error: insertError } = await db.from("tcg_cards").insert({
          tcg_system: "pokemon",
          external_id: card.id,
          name: card.name,
          set_code: detail.set?.id ?? card.set?.id ?? null,
          set_name: detail.set?.name ?? card.set?.name ?? null,
          rarity: detail.rarity ?? card.rarity ?? null,
          image_url: card.image ? `${card.image}/low.png` : null,
        }).select("id").single()
        if (insertError) throw new Error(insertError.message)
        catalogId = inserted.id
      }
      candidateRows.push({
        item_id: item.id,
        catalog_id: catalogId,
        catalog_source: "tcg_cards",
        match_score: recognition.confidence,
        match_reasons: ["AI image recognition", "TCGdex catalog result"],
        candidate_data: {
          name: card.name,
          game: "pokemon",
          externalId: card.id,
          set: detail.set?.name ?? card.set?.name ?? null,
          setCode: detail.set?.id ?? card.set?.id ?? null,
          collectorNumber: card.localId ?? null,
          rarity: detail.rarity ?? card.rarity ?? null,
          imageUrl: card.image ? `${card.image}/low.png` : null,
        },
      })
    }

    if (candidateRows.length) {
      const { error } = await db.from("collection_import_candidates").insert(candidateRows)
      if (error) throw new Error(error.message)
    }

    const status = candidateRows.length ? "needs_review" : "unmatched"
    const { error: itemUpdateError } = await db.from("collection_import_items")
      .update({
        status,
        review_reason: candidateRows.length ? "Tarkista tekoälyn tunnistama kortti ja painos" : "TCGdexistä ei löytynyt tunnistusta vastaavaa painosta",
        updated_at: new Date().toISOString(),
      }).eq("id", item.id)
    if (itemUpdateError) throw new Error(itemUpdateError.message)

    const { error: batchUpdateError } = await db.from("collection_import_batches")
      .update({ status: "review", updated_at: new Date().toISOString() }).eq("id", batch.id)
    if (batchUpdateError) throw new Error(batchUpdateError.message)

    return { success: true as const, batchId: batch.id, itemCount: 1, candidateCount: candidateRows.length, recognition }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kuvatuonti epäonnistui"
    if (batchId) {
      await db.from("collection_import_items").delete().eq("batch_id", batchId)
      await db.from("collection_import_batches").update({ status: "failed", error_message: message }).eq("id", batchId)
    }
    return { success: false as const, error: message }
  }
}
