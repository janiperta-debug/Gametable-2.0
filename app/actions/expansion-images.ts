'use server'

import { XMLParser } from 'fast-xml-parser'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const BGG_API_TOKEN = process.env.BGG_API_TOKEN
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

function bggHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/xml, text/xml, */*',
  }
  if (BGG_API_TOKEN) headers.Authorization = `Bearer ${BGG_API_TOKEN}`
  return headers
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Repairs expansion catalog rows created before the BGG batching fix.
 * BGG accepts at most 20 thing ids per request, so larger catalogs are
 * deliberately fetched in small sequential batches.
 */
export async function repairExpansionImages(gameId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', repaired: 0 }

  const { data: rows, error } = await supabase
    .from('game_expansions')
    .select('id, bgg_id, image_url')
    .eq('base_game_id', gameId)
    .is('image_url', null)

  if (error) {
    console.error('Error finding expansion images to repair:', error)
    return { error: error.message, repaired: 0 }
  }

  const missing = (rows || []).filter((row) => row.bgg_id)
  if (!missing.length) return { success: true, repaired: 0 }

  let repaired = 0

  for (let start = 0; start < missing.length; start += 20) {
    const batch = missing.slice(start, start + 20)
    const ids = batch.map((row) => row.bgg_id).join(',')

    try {
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${ids}`, {
        headers: bggHeaders(),
        cache: 'no-store',
      })

      if (!response.ok) continue

      const parsed = parser.parse(await response.text())
      const items = parsed?.items?.item
      const list = Array.isArray(items) ? items : items ? [items] : []

      for (const item of list) {
        const bggId = Number(item?.['@_id'])
        const image = item?.image ? String(item.image) : item?.thumbnail ? String(item.thumbnail) : null
        if (!bggId || !image) continue

        const { error: updateError } = await supabase
          .from('game_expansions')
          .update({ image_url: image })
          .eq('base_game_id', gameId)
          .eq('bgg_id', bggId)
          .is('image_url', null)

        if (!updateError) repaired += 1
      }
    } catch (repairError) {
      console.error('Expansion image repair batch failed:', repairError)
    }

    if (start + 20 < missing.length) await wait(1000)
  }

  revalidatePath(`/game/${gameId}`)
  revalidatePath('/collection')
  return { success: true, repaired }
}
