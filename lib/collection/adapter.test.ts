import assert from 'node:assert/strict'
import test from 'node:test'

import {
  mapMiniatureCollectionToCollectionEntry,
  mapTCGCollectionToCollectionEntry,
  mapUserGameToCollectionEntry,
} from './adapter'

test('mapUserGameToCollectionEntry maps board-game ownership to a shared collection entry', () => {
  const entry = mapUserGameToCollectionEntry({
    id: 'ownership-uuid-1',
    game_id: 'catalog-uuid-1',
    status: 'owned',
    game: {
      id: 'catalog-uuid-1',
      name: 'Terraforming Mars',
      image_url: 'https://example.com/tfm.jpg',
      thumbnail_url: 'https://example.com/tfm-thumb.jpg',
      category: 'board_game',
      year: 2016,
      min_players: 1,
      max_players: 5,
      min_playtime: 60,
      max_playtime: 120,
      bgg_rating: 8.4,
    },
  })

  assert.equal(entry.domain, 'board_game')
  assert.equal(entry.catalogId, 'catalog-uuid-1')
  assert.equal(entry.ownershipId, 'ownership-uuid-1')
  assert.equal(entry.displayName, 'Terraforming Mars')
  assert.equal(entry.image, 'https://example.com/tfm.jpg')
  assert.equal(entry.status, 'owned')
  assert.equal(entry.detailTarget, '/game/catalog-uuid-1')
  assert.equal(entry.metadata.category, 'board_game')
  assert.equal((entry.metadata.players as { min: number | null; max: number | null }).max, 5)
})

test('mapUserGameToCollectionEntry maps RPG entries using the RPG domain', () => {
  const entry = mapUserGameToCollectionEntry({
    id: 'ownership-uuid-rpg',
    game_id: 'catalog-uuid-rpg',
    status: 'wishlist',
    game: {
      id: 'catalog-uuid-rpg',
      name: 'The Dying Earth',
      category: 'rpg',
      image_url: 'https://example.com/rpg.jpg',
    },
  })

  assert.equal(entry.domain, 'rpg')
  assert.equal(entry.status, 'wishlist')
  assert.equal(entry.detailTarget, '/game/catalog-uuid-rpg')
})

test('mapTCGCollectionToCollectionEntry maps TCG rows with null detailTarget and key metadata (no status column)', () => {
  const entry = mapTCGCollectionToCollectionEntry({
    id: 'ownership-tcg-1',
    card_id: 'catalog-tcg-1',
    quantity: 3,
    condition: 'near_mint',
    foil: true,
    card: {
      id: 'catalog-tcg-1',
      name: 'Lightning Bolt',
      tcg_system: 'magic',
      set_name: 'Core Set 2021',
      set_code: 'M21',
      rarity: 'common',
      image_url: 'https://example.com/lightning-bolt.jpg',
      mana_cost: '{R}',
      type_line: 'Instant',
      cmc: 1,
      external_id: 'external-1',
    },
  })

  assert.equal(entry.domain, 'tcg')
  assert.equal(entry.catalogId, 'catalog-tcg-1')
  assert.equal(entry.ownershipId, 'ownership-tcg-1')
  assert.notEqual(entry.catalogId, entry.ownershipId)
  assert.equal(entry.status, 'owned')
  assert.equal(entry.detailTarget, null)
  assert.equal(entry.metadata.tcg_system, 'magic')
  assert.equal(entry.metadata.set_code, 'M21')
  assert.equal(entry.metadata.quantity, 3)
  assert.equal(entry.metadata.condition, 'near_mint')
  assert.equal(entry.metadata.foil, true)
  assert.equal('status' in entry.metadata, false)
})

test('mapMiniatureCollectionToCollectionEntry maps mini_army_units rows using owned/model_count/points_total/paint_status', () => {
  const entry = mapMiniatureCollectionToCollectionEntry({
    id: 'ownership-mini-1',
    unit_id: 'catalog-mini-1',
    owned: true,
    model_count: 5,
    points_total: 200,
    paint_status: 'painted',
    custom_name: 'Alpha Squad',
    is_warlord: false,
    unit: {
      id: 'catalog-mini-1',
      name: 'Intercessor Squad',
      unit_type: 'infantry',
      base_points: 190,
      model_count_min: 5,
      model_count_max: 10,
      faction: {
        name: 'Ultramarines',
        system: {
          code: 'wh40k',
          name: 'Warhammer 40,000',
        },
      },
    },
  })

  assert.equal(entry.domain, 'miniature')
  assert.equal(entry.catalogId, 'catalog-mini-1')
  assert.equal(entry.ownershipId, 'ownership-mini-1')
  assert.notEqual(entry.catalogId, entry.ownershipId)
  assert.equal(entry.status, 'owned')
  assert.equal(entry.detailTarget, null)
  assert.equal(entry.displayName, 'Alpha Squad')
  assert.equal(entry.metadata.system, 'wh40k')
  assert.equal(entry.metadata.system_name, 'Warhammer 40,000')
  assert.equal(entry.metadata.faction, 'Ultramarines')
  assert.equal(entry.metadata.model_count, 5)
  assert.equal(entry.metadata.points_total, 200)
  assert.equal(entry.metadata.paint_status, 'painted')
  assert.equal(entry.metadata.unit_type, 'infantry')
})

test('mapMiniatureCollectionToCollectionEntry rejects owned=false rows rather than inventing wishlist semantics', () => {
  assert.throws(() =>
    mapMiniatureCollectionToCollectionEntry({
      id: 'ownership-mini-unowned',
      unit_id: 'catalog-mini-unowned',
      owned: false,
      unit: { id: 'catalog-mini-unowned', name: 'Unowned Unit' },
    }),
  )
})

test('domain mapper keeps catalog identity separate from ownership identity', () => {
  const entry = mapUserGameToCollectionEntry({
    id: 'ownership-separate-id',
    game_id: 'catalog-separate-id',
    status: 'owned',
    game: {
      id: 'catalog-separate-id',
      name: 'Catan',
      category: 'board_game',
    },
  })

  assert.notEqual(entry.catalogId, entry.ownershipId)
  assert.equal(entry.catalogId, 'catalog-separate-id')
  assert.equal(entry.ownershipId, 'ownership-separate-id')
})
