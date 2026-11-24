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
  category: "Pokemon" | "Energy" | "Trainer" | null
}

type TcgdexCard = {
  id: string
  name: string
  localId?: string
  image?: string
  rarity?: string
  set?: { id?: string; name?: string }
}

function normalizeCardNumber(value: string) {
  return value.trim().split("/")[0].replace(/^0+(?=\d)/, "").toLocaleLowerCase()
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
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) throw new Error("Käytä JPEG-, PNG- tai WebP-kuvaa")
    if (file.size > 10 * 1024 * 1024) throw new Error("Kuvan enimmäiskoko on 10 Mt")

    const bytes = Buffer.from(await file.arrayBuffer())
    const dataUrl = `data:${mimeType};base64,${bytes.toString("base64")}`
    const gatewayKey = process.env.AI_GATEWAY_API_KEY
    if (!gatewayKey) throw new Error("AI Gateway -yhteys puuttuu Vercelin ympäristömuuttujista")

    const aiResponse = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${gatewayKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "Etsi kuvasta kaikki selvästi näkyvät Pokémon TCG -kortit, enintään 12 korttia. Mukaan kuuluvat Pokémon-kortit, Energy-kortit (Basic ja Special) sekä Trainer-kortit (Item, Supporter, Stadium, Tool jne.). Käsittele jokainen kortti erillisenä. Älä jätä energia- tai trainer-kortteja pois. Älä keksi kortteja äläkä arvaa epäselviä tietoja. Palauta JSON-objekti muodossa {cards:[{name:string,category:'Pokemon'|'Energy'|'Trainer'|null,setName:string|null,setCode:string|null,collectorNumber:string|null,language:string|null,confidence:number}]}. Käytä nimessä TCGdexin virallista englanninkielistä korttinimeä aina kun mahdollista (esim. Basic Fighting Energy). Jokaiselle kortille lue nimi, korttityyppi/category, setin nimi, setin tunnus jos näkyy, keräilynumero (esim. 025/198 tai 006) ja kieli. Jos kortti on Basic Energy, nimeä se muodossa Basic [Energy Type] Energy. confidence on 0-1. Jos kortin nimeä ei voi lukea luotettavasti, jätä kyseinen kortti pois. Älä palauta muuta tekstiä.",
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
    if (typeof raw !== "string") throw new Error("Tekoäly ei palauttanut korttien tunnistustietoja")
    const parsed = JSON.parse(raw) as { cards?: Partial<PokemonRecognition>[] }
    const recognitions = (Array.isArray(parsed.cards) ? parsed.cards : []).slice(0, 12).map((card) => ({
      name: String(card.name ?? "").trim().slice(0, 120),
      setName: typeof card.setName === "string" ? card.setName.slice(0, 120) : null,
      setCode: typeof card.setCode === "string" ? card.setCode.slice(0, 30) : null,
      collectorNumber: typeof card.collectorNumber === "string" ? card.collectorNumber.slice(0, 30) : null,
      language: typeof card.language === "string" ? card.language.slice(0, 20) : null,
      confidence: Math.max(0, Math.min(1, Number(card.confidence) || 0)),
      category: card.category === "Pokemon" || card.category === "Energy" || card.category === "Trainer" ? card.category : null,
    })).filter((card) => card.name)
    if (!recognitions.length) throw new Error("Kuvasta ei löytynyt luotettavasti tunnistettavia Pokémon-kortteja. Kokeile kuvaa, jossa kortit näkyvät kokonaan.")

    const { data: batch, error: batchError } = await db.from("collection_import_batches").insert({
      user_id: user.id,
      category: "tcg",
      input_type: "image",
      status: "processing",
      source_storage_path: storagePath,
      source_metadata: { game: "pokemon", recognitions },
    }).select("id").single()
    if (batchError) throw new Error(batchError.message)
    batchId = batch.id

    let totalCandidates = 0
    for (let index = 0; index < recognitions.length; index++) {
      const recognition = recognitions[index]
      const { data: item, error: itemError } = await db.from("collection_import_items").insert({
        batch_id: batch.id,
        row_index: index,
        raw_text: recognition.name,
        parsed_data: {
          name: recognition.name,
          quantity: 1,
          setCode: recognition.setCode,
          collectorNumber: recognition.collectorNumber,
          setName: recognition.setName,
          language: recognition.language,
          recognitionConfidence: recognition.confidence,
          cardCategory: recognition.category,
        },
        status: "pending",
      }).select("id").single()
      if (itemError) throw new Error(itemError.message)

      const searchCards = async (params: Record<string, string>) => {
        const query = new URLSearchParams({
          ...params,
          "pagination:page": "1",
          "pagination:itemsPerPage": "40",
        })
        const response = await fetch(`https://api.tcgdex.net/v2/en/cards?${query.toString()}`, {
          headers: { Accept: "application/json" }, cache: "no-store",
        })
        if (!response.ok) throw new Error(`TCGdex-haku epäonnistui (${response.status})`)
        return await response.json() as TcgdexCard[]
      }

      let catalogCards = await searchCards({ name: recognition.name })
      // Energy cards have a separate category in TCGdex. Search that category
      // by its elemental name as a fallback when the full printed name returns no result.
      if (recognition.category === "Energy" && (!Array.isArray(catalogCards) || catalogCards.length === 0)) {
        const basicEnergyType = recognition.name.match(/^Basic\\s+(.+?)\\s+Energy$/i)?.[1]
        const energySearchTerm = basicEnergyType ?? recognition.name
        catalogCards = await searchCards({ category: "eq:Energy", name: energySearchTerm })
      }

      const basicEnergyType = recognition.category === "Energy"
        ? recognition.name.match(/^Basic\\s+(.+?)\\s+Energy$/i)?.[1]?.toLocaleLowerCase()
        : null
      const matches = (Array.isArray(catalogCards) ? catalogCards : [])
        .filter((card) => {
          const catalogName = card.name.toLocaleLowerCase()
          if (catalogName === recognition.name.toLocaleLowerCase()) return true
          // TCGdex naming can differ slightly for energy printings; retain only
          // Energy-named results containing the recognized elemental type.
          return Boolean(basicEnergyType && catalogName.includes("energy") && catalogName.includes(basicEnergyType))
        })
        .filter((card) => !recognition.collectorNumber || !card.localId || normalizeCardNumber(card.localId) === normalizeCardNumber(recognition.collectorNumber))
        .slice(0, 8)

      const candidateRows = []
      for (const card of matches) {
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
            category: detail.category ?? recognition.category ?? null,
            energyType: detail.energyType ?? null,
            trainerType: detail.trainerType ?? null,
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
      totalCandidates += candidateRows.length

      const status = candidateRows.length ? "needs_review" : "unmatched"
      const { error: itemUpdateError } = await db.from("collection_import_items").update({
        status,
        review_reason: candidateRows.length ? "Tarkista tekoälyn tunnistama kortti ja painos" : "TCGdexistä ei löytynyt tunnistusta vastaavaa painosta",
        updated_at: new Date().toISOString(),
      }).eq("id", item.id)
      if (itemUpdateError) throw new Error(itemUpdateError.message)
    }

    const { error: batchUpdateError } = await db.from("collection_import_batches")
      .update({ status: "review", updated_at: new Date().toISOString() }).eq("id", batch.id)
    if (batchUpdateError) throw new Error(batchUpdateError.message)

    return { success: true as const, batchId: batch.id, itemCount: recognitions.length, candidateCount: totalCandidates, recognitions }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kuvatuonti epäonnistui"
    if (batchId) {
      await db.from("collection_import_items").delete().eq("batch_id", batchId)
      await db.from("collection_import_batches").update({ status: "failed", error_message: message }).eq("id", batchId)
    }
    return { success: false as const, error: message }
  }
}
