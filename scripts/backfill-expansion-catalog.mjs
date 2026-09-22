import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BGG_API_URL = process.env.BGG_API_URL || 'https://boardgamegeek.com/xmlapi2/thing'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchBggThing(bggId) {
  const url = new URL(BGG_API_URL)
  url.searchParams.set('id', String(bggId))
  url.searchParams.set('type', 'boardgame')
  url.searchParams.set('stats', '1')

  const response = await fetch(url, {
    headers: { Accept: 'application/xml' },
  })

  if (!response.ok) {
    throw new Error(`BGG request failed for ${bggId}: ${response.status}`)
  }

  return response.text()
}

function extractExpansions(xml) {
  const links = [...xml.matchAll(/<link\s+[^>]*type="boardgameexpansion"[^>]*>/g)]
  return links
    .map(([tag]) => {
      const id = tag.match(/\bid="(\d+)"/)
      const value = tag.match(/<link\s+[^>]*value="([^"]+)"/)
      return id && value ? { bgg_id: Number(id[1]), name: value[1] } : null
    })
    .filter(Boolean)
}

async function run() {
  const { data: games, error } = await supabase
    .from('games')
    .select('id, name, bgg_id')
    .not('bgg_id', 'is', null)

  if (error) throw error

  let processed = 0
  let inserted = 0
  let skipped = 0
  let failed = 0

  for (const game of games ?? []) {
    processed += 1

    try {
      const xml = await fetchBggThing(game.bgg_id)
      const expansions = extractExpansions(xml)

      if (!expansions.length) {
        skipped += 1
        console.log(`[${processed}] ${game.name}: no expansions reported by BGG`)
        continue
      }

      for (const expansion of expansions) {
        // Never change ownership here. This script only fills the catalog.
        const { error: upsertError } = await supabase
          .from('game_expansions')
          .upsert(
            {
              base_game_id: game.id,
              bgg_id: expansion.bgg_id,
              name: expansion.name,
            },
            { onConflict: 'base_game_id,bgg_id', ignoreDuplicates: true },
          )

        if (upsertError) throw upsertError
        inserted += 1
      }

      console.log(`[${processed}] ${game.name}: ${expansions.length} expansions catalogued`)
      await sleep(250)
    } catch (err) {
      failed += 1
      console.error(`[${processed}] ${game.name}: FAILED`, err)
    }
  }

  console.log({ processed, inserted, skipped, failed })
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
