import assert from 'node:assert/strict'
import test from 'node:test'

import { getCollectionEntries } from './orchestrator'

test('empty collection returns an empty array', () => {
  assert.deepEqual(getCollectionEntries({}), [])
})

test('single board-game domain input maps to a CollectionEntry list', () => {
  const entries = getCollectionEntries({
    userGames: [
      {
        id: 'ownership-1',
        game_id: 'catalog-1',
        status: 'owned',
        game: {
          id: 'catalog-1',
          name: 'Terraforming Mars',
          category: 'board_game',
          image_url: 'https://example.com/tfm.jpg',
        },
      },
    ],
  })

  assert.equal(entries.length, 1)
  assert.equal(entries[0].domain, 'board_game')
  assert.equal(entries[0].catalogId, 'catalog-1')
  assert.equal(entries[0].ownershipId, 'ownership-1')
  assert.equal(entries[0].detailTarget, '/game/catalog-1')
  assert.equal(entries[0].status, 'owned')
})

test('single TCG domain input maps to a CollectionEntry list', () => {
  const entries = getCollectionEntries({
    tcgCollection: [
      {
        id: 'ownership-tcg-1',
        card_id: 'catalog-tcg-1',
        status: 'wishlist',
        quantity: 2,
        card: {
          id: 'catalog-tcg-1',
          name: 'Lightning Bolt',
          tcg_system: 'magic',
          set_code: 'M21',
          image_url: 'https://example.com/bolt.jpg',
        },
      },
    ],
  })

  assert.equal(entries.length, 1)
  assert.equal(entries[0].domain, 'tcg')
  assert.equal(entries[0].catalogId, 'catalog-tcg-1')
  assert.equal(entries[0].ownershipId, 'ownership-tcg-1')
  assert.equal(entries[0].status, 'wishlist')
  assert.equal(entries[0].detailTarget, null)
  assert.equal(entries[0].metadata.set_code, 'M21')
})

test('single miniature domain input maps to a CollectionEntry list', () => {
  const entries = getCollectionEntries({
    miniatureCollection: [
      {
        id: 'ownership-mini-1',
        unit_id: 'catalog-mini-1',
        status: 'owned',
        quantity: 5,
        paint_status: 'painted',
        unit: {
          id: 'catalog-mini-1',
          name: 'Intercessor Squad',
          type: 'unit',
          points: 200,
          model_count: 5,
          system: { code: 'wh40k', name: 'Warhammer 40,000' },
          faction: { name: 'Ultramarines' },
        },
      },
    ],
  })

  assert.equal(entries.length, 1)
  assert.equal(entries[0].domain, 'miniature')
  assert.equal(entries[0].catalogId, 'catalog-mini-1')
  assert.equal(entries[0].ownershipId, 'ownership-mini-1')
  assert.equal(entries[0].detailTarget, null)
  assert.equal(entries[0].metadata.system, 'wh40k')
  assert.equal(entries[0].metadata.faction, 'Ultramarines')
})

test('mixed domain inputs preserve each domain identity and return a deterministic merged list', () => {
  const entries = getCollectionEntries({
    userGames: [
      {
        id: 'ownership-game-1',
        game_id: 'catalog-game-1',
        status: 'owned',
        game: { id: 'catalog-game-1', name: 'Catan', category: 'board_game' },
      },
    ],
    tcgCollection: [
      {
        id: 'ownership-tcg-1',
        card_id: 'catalog-tcg-1',
        status: 'owned',
        quantity: 1,
        card: { id: 'catalog-tcg-1', name: 'Forest', tcg_system: 'magic' },
      },
    ],
    miniatureCollection: [
      {
        id: 'ownership-mini-1',
        unit_id: 'catalog-mini-1',
        status: 'owned',
        quantity: 1,
        unit: { id: 'catalog-mini-1', name: 'Intercessor', type: 'unit' },
      },
    ],
  })

  assert.equal(entries.length, 3)
  assert.deepEqual(entries.map((entry) => entry.domain), ['board_game', 'tcg', 'miniature'])
  assert.equal(entries[0].catalogId, 'catalog-game-1')
  assert.equal(entries[0].ownershipId, 'ownership-game-1')
  assert.equal(entries[1].catalogId, 'catalog-tcg-1')
  assert.equal(entries[1].ownershipId, 'ownership-tcg-1')
  assert.equal(entries[2].catalogId, 'catalog-mini-1')
  assert.equal(entries[2].ownershipId, 'ownership-mini-1')
})

test('identity preservation keeps catalog and ownership ids separate for all domains', () => {
  const entries = getCollectionEntries({
    userGames: [
      {
        id: 'ownership-game-1',
        game_id: 'catalog-game-1',
        status: 'owned',
        game: { id: 'catalog-game-1', name: 'Root', category: 'board_game' },
      },
    ],
    tcgCollection: [
      {
        id: 'ownership-tcg-1',
        card_id: 'catalog-tcg-1',
        status: 'owned',
        card: { id: 'catalog-tcg-1', name: 'Island', tcg_system: 'magic' },
      },
    ],
    miniatureCollection: [
      {
        id: 'ownership-mini-1',
        unit_id: 'catalog-mini-1',
        status: 'owned',
        unit: { id: 'catalog-mini-1', name: 'Captain', type: 'unit' },
      },
    ],
  })

  for (const entry of entries) {
    assert.notEqual(entry.catalogId, entry.ownershipId)
  }
})

test('status values are preserved without silent coercion', () => {
  const entries = getCollectionEntries({
    userGames: [
      {
        id: 'ownership-wishlist',
        game_id: 'catalog-wishlist',
        status: 'wishlist',
        game: { id: 'catalog-wishlist', name: 'Wishlist title', category: 'rpg' },
      },
    ],
  })

  assert.equal(entries[0].status, 'wishlist')
})

test('current useCollection-style board-game query data maps through the orchestrator without UI changes', () => {
  const currentQueryRows = [
    {
      id: 'user-game-123',
      user_id: 'user-456',
      game_id: 'game-789',
      status: 'owned',
      added_at: '2026-01-01T00:00:00Z',
      game: {
        id: 'game-789',
        name: 'Root',
        category: 'board_game',
        image_url: 'https://example.com/root.jpg',
        thumbnail_url: 'https://example.com/root-thumb.jpg',
        min_players: 2,
        max_players: 4,
        min_playtime: 45,
        max_playtime: 90,
        bgg_rating: 8.2,
        year: 2018,
      },
      expansions: [],
      ownedExpansionCount: 0,
      totalExpansionCount: 0,
    },
    {
      id: 'user-game-456',
      user_id: 'user-456',
      game_id: 'game-rpg-123',
      status: 'wishlist',
      added_at: '2026-01-02T00:00:00Z',
      game: {
        id: 'game-rpg-123',
        name: 'The Dying Earth',
        category: 'rpg',
        image_url: 'https://example.com/dying-earth.jpg',
        year: 2020,
      },
      expansions: [],
      ownedExpansionCount: 0,
      totalExpansionCount: 0,
    },
  ] as const

  const entries = getCollectionEntries({ userGames: currentQueryRows as any })

  assert.equal(entries.length, 2)
  assert.equal(entries[0].domain, 'board_game')
  assert.equal(entries[0].catalogId, 'game-789')
  assert.equal(entries[0].ownershipId, 'user-game-123')
  assert.equal(entries[0].status, 'owned')
  assert.equal(entries[0].detailTarget, '/game/game-789')

  assert.equal(entries[1].domain, 'rpg')
  assert.equal(entries[1].catalogId, 'game-rpg-123')
  assert.equal(entries[1].ownershipId, 'user-game-456')
  assert.equal(entries[1].status, 'wishlist')
  assert.equal(entries[1].detailTarget, '/game/game-rpg-123')
})
