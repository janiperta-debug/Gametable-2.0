/**
 * migrate-expansions.mjs
 *
 * One-time migration: finds all board_game rows in `games` that BGG actually
 * classifies as boardgameexpansion, then:
 *   1. Ensures the base game exists in `games` (creates a minimal row if not)
 *   2. Upserts the expansion into `game_expansions` (shared catalog)
 *   3. Moves every user_games ownership row → user_game_expansions
 *   4. Deletes the stale user_games rows
 *   5. Deletes the stale (orphaned) games row if no user_games rows remain
 *
 * Run with:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/migrate-expansions.mjs
 *
 * Dry-run (no DB writes):
 *   DRY_RUN=1 node --env-file-if-exists=/vercel/share/.env.project scripts/migrate-expansions.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { XMLParser } from 'fast-xml-parser'

// ── Config ──────────────────────────────────────────────────────────────────
const DRY_RUN = process.env.DRY_RUN === '1'
const BGG_BATCH = 20          // IDs per BGG /thing request
const BGG_DELAY_MS = 1500     // be polite to BGG
const BGG_TOKEN = process.env.BGG_API_TOKEN || ''

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function primaryName(nameData) {
  if (Array.isArray(nameData)) {
    const p = nameData.find(n => n['@_type'] === 'primary')
    return p ? String(p['@_value'] || '') : String(nameData[0]?.['@_value'] || '')
  }
  if (nameData && typeof nameData === 'object') return String(nameData['@_value'] || '')
  return ''
}

/** Call BGG thing API for a batch of bgg_ids. Returns map: bggId → item data */
async function fetchBggBatch(bggIds) {
  const ids = bggIds.join(',')
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids}`
  let attempt = 0
  while (attempt < 3) {
    attempt++
    const headers = { Accept: 'application/xml, */*' }
  if (BGG_TOKEN) headers['Authorization'] = `Bearer ${BGG_TOKEN}`
  const res = await fetch(url, { headers })
    if (res.status === 202) {
      // BGG still processing – wait and retry
      console.log('  BGG 202 (queue), retrying in 5s…')
      await sleep(5000)
      continue
    }
    if (!res.ok) {
      console.error(`  BGG error ${res.status} for ids ${ids}`)
      return new Map()
    }
    const text = await res.text()
    const parsed = parser.parse(text)
    const items = parsed?.items?.item
    const list = Array.isArray(items) ? items : items ? [items] : []
    const map = new Map()
    for (const it of list) {
      const id = parseInt(String(it['@_id']), 10)
      if (!Number.isNaN(id)) map.set(id, it)
    }
    return map
  }
  console.error(`  BGG failed after retries for ids ${ids}`)
  return new Map()
}

async function main() {
  console.log(`\n=== Expansion Migration ${DRY_RUN ? '[DRY RUN]' : '[LIVE]'} ===\n`)

  // ── 1. Load all board_game rows that have a bgg_id ─────────────────────
  const { data: allGames, error: gErr } = await supabase
    .from('games')
    .select('id, bgg_id, name')
    .eq('category', 'board_game')
    .not('bgg_id', 'is', null)

  if (gErr) { console.error('Failed to load games:', gErr.message); process.exit(1) }
  console.log(`Loaded ${allGames.length} board_game rows with bgg_id`)

  // ── 2. Detect expansions via BGG in batches ────────────────────────────
  const trueExpansions = []   // { game_row, bggItem }

  for (let i = 0; i < allGames.length; i += BGG_BATCH) {
    const batch = allGames.slice(i, i + BGG_BATCH)
    const bggIds = batch.map(g => g.bgg_id)
    process.stdout.write(`  BGG batch ${Math.floor(i/BGG_BATCH)+1}/${Math.ceil(allGames.length/BGG_BATCH)} (${bggIds.length} items)… `)

    const bggMap = await fetchBggBatch(bggIds)

    for (const game of batch) {
      const item = bggMap.get(game.bgg_id)
      if (!item) continue
      if (String(item['@_type']) === 'boardgameexpansion') {
        trueExpansions.push({ game_row: game, bggItem: item })
      }
    }
    console.log(`done (${trueExpansions.length} expansions found so far)`)
    if (i + BGG_BATCH < allGames.length) await sleep(BGG_DELAY_MS)
  }

  console.log(`\nTotal true expansions in games table: ${trueExpansions.length}\n`)
  if (trueExpansions.length === 0) {
    console.log('Nothing to migrate.')
    return
  }

  // ── 3. Migrate each expansion ──────────────────────────────────────────
  let migrated = 0, skipped = 0, errors = 0

  for (const { game_row, bggItem } of trueExpansions) {
    const links = Array.isArray(bggItem.link) ? bggItem.link : bggItem.link ? [bggItem.link] : []
    const inbound = links.find(
      l => l['@_type'] === 'boardgameexpansion' && String(l['@_inbound']) === 'true'
    )

    if (!inbound) {
      console.log(`  SKIP ${game_row.name} — no base-game link on BGG`)
      skipped++
      continue
    }

    const baseBggId = parseInt(String(inbound['@_id']), 10)
    const baseName  = String(inbound['@_value'] || 'Unknown')
    const expYear   = bggItem.yearpublished?.['@_value']
      ? parseInt(String(bggItem.yearpublished['@_value']), 10) : null
    const expImage  = bggItem.image ? String(bggItem.image)
      : bggItem.thumbnail ? String(bggItem.thumbnail) : null

    console.log(`\n→ ${game_row.name} (bgg:${game_row.bgg_id})`)
    console.log(`   Base: ${baseName} (bgg:${baseBggId})`)

    if (DRY_RUN) { migrated++; continue }

    try {
      // 3a. Ensure base game exists in `games`
      let { data: baseRow } = await supabase
        .from('games')
        .select('id')
        .eq('bgg_id', baseBggId)
        .maybeSingle()

      if (!baseRow) {
        const { data: inserted, error: insErr } = await supabase
          .from('games')
          .insert({ bgg_id: baseBggId, name: baseName, category: 'board_game', is_expansion: false })
          .select('id')
          .single()
        if (insErr) { console.error(`   ERROR inserting base game:`, insErr.message); errors++; continue }
        baseRow = inserted
        console.log(`   Created base game row: ${baseRow.id}`)
      }

      // 3b. Upsert into game_expansions catalog
      const { data: expCatalog, error: expErr } = await supabase
        .from('game_expansions')
        .upsert(
          { bgg_id: game_row.bgg_id, base_game_id: baseRow.id, name: game_row.name,
            year: expYear, image_url: expImage, sort_order: expYear || 9999 },
          { onConflict: 'bgg_id' }
        )
        .select('id')
        .single()

      if (expErr) { console.error(`   ERROR upserting expansion catalog:`, expErr.message); errors++; continue }
      const expansionCatalogId = expCatalog.id
      console.log(`   Upserted game_expansions: ${expansionCatalogId}`)

      // 3c. Load all user_games rows for this expansion game
      const { data: ugRows, error: ugErr } = await supabase
        .from('user_games')
        .select('id, user_id')
        .eq('game_id', game_row.id)

      if (ugErr) { console.error(`   ERROR loading user_games:`, ugErr.message); errors++; continue }
      console.log(`   Found ${ugRows.length} user_games rows to migrate`)

      // 3d. Insert into user_game_expansions (ignore 23505 duplicate)
      for (const ug of ugRows) {
        const { error: ugeErr } = await supabase
          .from('user_game_expansions')
          .upsert(
            { user_id: ug.user_id, game_expansion_id: expansionCatalogId },
            { onConflict: 'user_id,game_expansion_id', ignoreDuplicates: true }
          )
        if (ugeErr && ugeErr.code !== '23505') {
          console.error(`   ERROR inserting user_game_expansions for user ${ug.user_id}:`, ugeErr.message)
        }
      }
      console.log(`   Inserted user_game_expansions`)

      // 3e. Delete stale user_games rows
      if (ugRows.length > 0) {
        const { error: delErr } = await supabase
          .from('user_games')
          .delete()
          .eq('game_id', game_row.id)
        if (delErr) { console.error(`   ERROR deleting user_games:`, delErr.message) }
        else console.log(`   Deleted ${ugRows.length} stale user_games rows`)
      }

      // 3f. Delete the stale games row (no longer needed as standalone)
      const { error: delGameErr } = await supabase
        .from('games')
        .delete()
        .eq('id', game_row.id)
      if (delGameErr) console.error(`   ERROR deleting games row:`, delGameErr.message)
      else console.log(`   Deleted stale games row: ${game_row.id}`)

      migrated++
    } catch (err) {
      console.error(`   UNEXPECTED ERROR for ${game_row.name}:`, err.message)
      errors++
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`  Migrated: ${migrated}`)
  console.log(`  Skipped:  ${skipped}`)
  console.log(`  Errors:   ${errors}`)
  if (DRY_RUN) console.log('\n  (Dry run — no changes written)')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
