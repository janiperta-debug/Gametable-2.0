"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { searchCollectionImportItem } from "@/app/actions/collection-import-batches"

type RecognizedCard = {
  name: string
  setName: string | null
  setCode: string | null
  collectorNumber: string | null
  language: string | null
  confidence: number
  position?: string | null
}

export async function processTcgCardImageImport(input: { game: "magic" | "yugioh" | "lorcana" | "flesh-and-blood"; storagePaths: string[] }) {
  const { game, storagePaths } = input ?? {}
  if (!["magic", "yugioh", "lorcana", "flesh-and-blood"].includes(game) || !Array.isArray(storagePaths) ||
      storagePaths.length < 1 || storagePaths.length > 10 ||
      storagePaths.some((path) => typeof path !== "string" || !path.trim() || path.length > 500)) {
    return { success: false as const, error: "Valitse 1–10 kelvollista kuvatiedostoa." }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false as const, error: "Kirjautuminen vaaditaan" }
  if (storagePaths.some((path) => !path.startsWith(`${user.id}/`) || path.includes(".."))) {
    return { success: false as const, error: "Kuvatiedoston käyttö estetty" }
  }

  const db = createServiceClient()
  let batchId: string | null = null
  try {
    const gatewayKey = process.env.AI_GATEWAY_API_KEY
    if (!gatewayKey) throw new Error("AI Gateway -yhteys puuttuu Vercelin ympäristömuuttujista")

    const gameName = game === "magic" ? "Magic: The Gathering" : game === "yugioh" ? "Yu-Gi-Oh!" : game === "lorcana" ? "Disney Lorcana" : "Flesh and Blood"
    const prompt = game === "magic"
      ? "Tunnista kuvasta fyysiset Magic: The Gathering -kortit järjestelmällisesti vasemmalta oikealle ja ylhäältä alas. Kuvassa voi olla enintään 12 korttia. Laske ensin näkyvät korttipaikat ja palauta yksi cards-listan alkio JOKAISESTA fyysisestä kortista. ÄLÄ yhdistä tai poista kaksoiskappaleita: jos kuvassa on kaksi täysin samanlaista korttia, palauta ne kahtena erillisenä alkiona. Anna jokaiselle kortille sijainti kuvassa (esim. ylävasen, keskellä oikea, alavasen), jotta saman kortin kappaleet erottuvat. Lue kortin nimi täsmälleen; setin nimi, setin koodi, keräilynumero ja kieli jos ne näkyvät. Jos kortissa on kaksi puolta, se on silti yksi fyysinen kortti ja käytä etupuolen nimeä. Älä sekoita setin koodia keräilynumeroon. Älä keksi kortteja tai tietoja. Jos nimi on osittain epäselvä, palauta paras perusteltu nimilukema matalammalla confidence-arvolla sen sijaan, että jättäisit fyysisen kortin kokonaan pois. Palauta vain JSON muodossa {cards:[{name:string,setName:string|null,setCode:string|null,collectorNumber:string|null,language:string|null,confidence:number,position:string|null}]}. confidence 0-1."
      : game === "yugioh"
        ? "Tunnista kuvasta kaikki selvästi näkyvät Yu-Gi-Oh! -kortit, enintään 12. Lue kortin virallinen englanninkielinen nimi täsmälleen, kortin tyyppi, setin nimi ja set code, keräilynumero sekä kieli jos ne näkyvät. Älä arvaa epäselviä tietoja. Palauta JSON muodossa {cards:[{name,setName,setCode,collectorNumber,language,confidence}]}. Jätä kortti pois, jos nimeä ei voi lukea luotettavasti."
        : game === "lorcana"
          ? "Tunnista kuvasta kaikki fyysiset Disney Lorcana -kortit järjestyksessä vasemmalta oikealle ja ylhäältä alas, enintään 12. Palauta yksi alkio jokaisesta fyysisestä kortista, myös kaksoiskappaleista. Lue nimi ja version/alaotsikon teksti erikseen, jos näkyvissä. Lue setin nimi tai koodi, collector number ja kieli vain jos näkyvissä. Älä sekoita lore-arvoa keräilynumeroon. Älä keksi tietoja. Palauta JSON muodossa {cards:[{name,setName,setCode,collectorNumber,language,confidence,position}]}. Confidence 0-1."
          : "Tunnista kuvasta kaikki fyysiset Flesh and Blood -kortit järjestyksessä vasemmalta oikealle ja ylhäältä alas, enintään 12. Palauta yksi alkio jokaisesta fyysisestä kortista, myös kaksoiskappaleista. Lue kortin nimi, setin nimi tai koodi, keräilynumero/printin tunniste sekä kieli vain jos näkyvissä. Älä sekoita pitch-arvoa keräilynumeroon. Älä arvaa tietoja. Palauta JSON muodossa {cards:[{name,setName,setCode,collectorNumber,language,confidence,position}]}. Confidence 0-1."

    const recognitions: (RecognizedCard & { sourceImageIndex: number })[] = []
    for (let imageIndex = 0; imageIndex < storagePaths.length; imageIndex++) {
      const { data: file, error: downloadError } = await db.storage.from("collection-import-images").download(storagePaths[imageIndex])
      if (downloadError || !file) throw new Error(downloadError?.message ?? `Kuvan ${imageIndex + 1} lataus epäonnistui`)
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Käytä JPEG-, PNG- tai WebP-kuvia")
      if (file.size > 10 * 1024 * 1024) throw new Error(`Kuvan ${imageIndex + 1} enimmäiskoko on 10 Mt`)

      const bytes = Buffer.from(await file.arrayBuffer())
      const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`
      const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${gatewayKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-4.1-mini",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ] }],
        }),
        cache: "no-store",
      })
      if (!response.ok) throw new Error(`Kuvan ${imageIndex + 1} tunnistus epäonnistui (${response.status})`)
      const payload = await response.json()
      const raw = payload.choices?.[0]?.message?.content
      if (typeof raw !== "string") throw new Error(`Kuvan ${imageIndex + 1} tunnistus ei palauttanut korttitietoja`)
      const parsed = JSON.parse(raw) as { cards?: Partial<RecognizedCard>[] }
      recognitions.push(...(Array.isArray(parsed.cards) ? parsed.cards : []).slice(0, 12).map((card) => ({
        name: String(card.name ?? "").trim().slice(0, 120),
        setName: typeof card.setName === "string" ? card.setName.slice(0, 120) : null,
        setCode: typeof card.setCode === "string" ? card.setCode.slice(0, 30) : null,
        collectorNumber: typeof card.collectorNumber === "string" ? card.collectorNumber.slice(0, 30) : null,
        language: typeof card.language === "string" ? card.language.slice(0, 20) : null,
        confidence: Math.max(0, Math.min(1, Number(card.confidence) || 0)),
        sourceImageIndex: imageIndex,
        position: typeof card.position === "string" ? card.position.slice(0, 40) : null,
      })).filter((card) => card.name))
    }
    if (!recognitions.length) throw new Error(`Valituista kuvista ei löytynyt luotettavasti tunnistettavia ${gameName}-kortteja.`)
    if (recognitions.length > 120) throw new Error("Tuontierässä voi olla enintään 120 tunnistettua korttia.")

    const { data: batch, error: batchError } = await db.from("collection_import_batches").insert({
      user_id: user.id, category: "tcg", input_type: "image", status: "processing",
      source_storage_path: storagePaths[0],
      source_metadata: { game, storagePaths, imageCount: storagePaths.length, recognitions },
    }).select("id").single()
    if (batchError) throw new Error(batchError.message)
    batchId = batch.id

    const itemRows = recognitions.map((card, index) => ({
      batch_id: batch.id, row_index: index, raw_text: card.name,
      parsed_data: {
        name: card.name, quantity: 1, setCode: card.setCode,
        collectorNumber: card.collectorNumber, setName: card.setName,
        language: card.language, recognitionConfidence: card.confidence,
        sourceImageIndex: card.sourceImageIndex, position: card.position,
      },
      status: "unmatched",
    }))
    const { data: items, error: itemsError } = await db.from("collection_import_items")
      .insert(itemRows).select("id, parsed_data")
    if (itemsError) throw new Error(itemsError.message)

    const { error: batchUpdateError } = await db.from("collection_import_batches")
      .update({ status: "review", updated_at: new Date().toISOString() }).eq("id", batch.id)
    if (batchUpdateError) throw new Error(batchUpdateError.message)

    let candidateCount = 0
    for (const item of items ?? []) {
      const result = await searchCollectionImportItem({ itemId: item.id, searchName: String((item.parsed_data as any)?.name ?? "") })
      if (!result.success) throw new Error(result.error)
      candidateCount += result.candidateCount
    }

    return { success: true as const, batchId: batch.id, itemCount: recognitions.length, candidateCount, recognitions }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kuvatuonti epäonnistui"
    if (batchId) {
      await db.from("collection_import_items").delete().eq("batch_id", batchId)
      await db.from("collection_import_batches").update({ status: "failed", error_message: message }).eq("id", batchId)
    }
    return { success: false as const, error: message }
  }
}
