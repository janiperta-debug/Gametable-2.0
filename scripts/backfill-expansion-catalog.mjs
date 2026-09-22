import { createClient } from '@supabase/supabase-js'
import { XMLParser } from 'fast-xml-parser'

const DRY_RUN = process.env.DRY_RUN === '1'
const BGG_BATCH = 20
const BGG_DELAY_MS = 1500
const BGG_TOKEN = process.env.BGG_API_TOKEN || ''

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchBggBatch(bggIds) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggIds.join(',')}`

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const headers = { Accept: 'application/xml, */*' }
    if (BGG_TOKEN) headers.Authorization = `Bearer ${BGG_TOKEN}`

    const response = await fetch(url, { headers })

    if (response.status === 202) {
      console.log('  BGG is still processing; retrying in 5s…')
      await sleep(5000)
      continue
    }

    if (!response.ok) throw new Error(`BGG request failed: ${response.status}`)

    const parsed = parser.parse(await response.text())
    const rawItems = parsed?.items?.item
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []
    return new Map(items.map((item) => [Number(item['@_id']), item]))
  }

  throw new Error(`BGG request did not complete after 3 attempts for ${bggIds.join(',')}`)
}

function asArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

async function main() {
  console.log(`=== Expansion catalog backfill ${DRY_RUN ? '[DRY RUN]' : '[LIVE]'} ===`)

  // Existing base games only. This never changes user ownership.
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, bgg_id, name')
    .eq('category', 'board_game')
    .not('bgg_id', 'is', null)
    .or('is_expansion.is.null,is_expansion.eq.false')

  if (gamesError) throw gamesError

  let processed = 0
  let catalogued = 0
  let skipped = 0
  let failed = 0

  for (let offset = 0; offset < games.length; offset += BGG_BATCH) {
    const batch = games.slice(offset, offset + BGG_BATCH)
    const bggMap = await fetchBggBatch(batch.map((game) => game.bgg_id))

    for (const game of batch) {
      processed += 1
      const item = bggMap.get(Number(game.bgg_id))

      if (!item) {
        failed += 1
        console.error(`[${processed}] ${game.name}: BGG item missing`)
        continue
      }

      const links = asArray(item.link).filter(
        (link) => link['@_type'] === 'boardgameexpansion'
      )

      if (!links.length) {
        skipped += 1
        console.log(`[${processed}] ${game.name}: no expansions reported by BGG`)
        continue
      }

      for (const link of links) {
        const bggId = Number(link['@_id'])
        const name = String(link['@_value'] || '').trim()
        if (!bggId || !name) continue

        // Preserve existing catalog rows. Only missing entries are added.
        const { data: existing, error: lookupError } = await supabase
          .from('game_expansions')
          .select('id')
          .eq('bgg_id', bggId)
          .maybeSingle()

        if (lookupError) throw lookupError
        if (existing) continue

        if (DRY_RUN) {
          console.log(`  WOULD ADD: ${game.name} → ${name} (${bggId})`)
          catalogued += 1
          continue
        }

        const { error: insertError } = await supabase
          .from('game_expansions')
          .insert({
            bgg_id: bggId,
            base_game_id: game.id,
            name,
            sort_order: 9999,
          })

        if (insertError) throw insertError
        catalogued += 1
        console.log(`  ADD: ${game.name} → ${name} (${bggId})`)
      }
    }

    if (offset + BGG_BATCH < games.length) await sleep(BGG_DELAY_MS)
  }

  console.log({ processed, catalogued, skipped, failed })
}

main().catch((error) => {
  console.error('Fatal:', error)
  process.exit(1)
})
