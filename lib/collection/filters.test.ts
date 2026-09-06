import assert from 'node:assert/strict'
import test from 'node:test'

import { buildBoardRPGCardsFromEntries, buildCollectionCardsFromEntries } from './card'
import {
  applyCollectionControls,
  filterCardsByCategory,
  filterCardsByStatus,
  getCategoryCounts,
  hasVisibleCategory,
  getMiniatureSystemOptions,
  getStatusCounts,
  searchCards,
  sortCards,
} from './filters'
import type { CollectionEntry, CollectionStatus } from '@/lib/types/collection'

function makeEntry(overrides: Partial<CollectionEntry> = {}): CollectionEntry {
  return {
    domain: 'board_game',
    catalogId: 'catalog-1',
    ownershipId: 'ownership-1',
    displayName: 'Game',
    image: null,
    status: 'owned',
    detailTarget: '/game/catalog-1',
    metadata: {},
    ...overrides,
  }
}

function makeGameRow(
  id: string,
  name: string,
  category: string,
  status: CollectionStatus,
  game: Record<string, unknown> = {},
) {
  return {
    id,
    game_id: `catalog-${id}`,
    status,
    game: { id: `catalog-${id}`, name, category, ...game },
  }
}

const BOARD_RPG_ENTRIES: CollectionEntry[] = [
  makeEntry({
    domain: 'board_game',
    catalogId: 'catalog-bg-1',
    ownershipId: 'ownership-bg-1',
    displayName: 'Root',
    status: 'owned',
  }),
  makeEntry({
    domain: 'rpg',
    catalogId: 'catalog-rpg-1',
    ownershipId: 'ownership-rpg-1',
    displayName: 'The Dying Earth',
    status: 'wishlist',
  }),
]

const TCG_ENTRY = makeEntry({
  domain: 'tcg',
  catalogId: 'catalog-tcg-1',
  ownershipId: 'ownership-tcg-1',
  displayName: 'Lightning Bolt',
  status: 'owned',
  detailTarget: null,
})

const MINIATURE_ENTRY = makeEntry({
  domain: 'miniature',
  catalogId: 'catalog-mini-1',
  ownershipId: 'ownership-mini-1',
  displayName: 'Intercessor Squad',
  status: 'owned',
  detailTarget: null,
  metadata: { system: 'wh40k', system_name: 'Warhammer 40,000' },
})

function boardRpgCards(entries: CollectionEntry[] = BOARD_RPG_ENTRIES) {
  return buildBoardRPGCardsFromEntries(entries)
}

test('board game entries can be searched through the card boundary', () => {
  const cards = boardRpgCards()

  const results = searchCards(cards, 'root')

  assert.equal(results.length, 1)
  assert.equal(results[0].entry.domain, 'board_game')
  assert.equal(results[0].card.title, 'Root')
})

test('RPG entries can be searched through the card boundary', () => {
  const cards = boardRpgCards()

  const results = searchCards(cards, 'dying earth')

  assert.equal(results.length, 1)
  assert.equal(results[0].entry.domain, 'rpg')
  assert.equal(results[0].entry.status, 'wishlist')
})

test('search matches entry.displayName when the card title is empty', () => {
  const entry = makeEntry({ displayName: 'Only Entry Name' })
  const cards = buildBoardRPGCardsFromEntries([entry])
  ;(cards[0].card as { title: string }).title = ''

  const results = searchCards(cards, 'only entry')

  assert.equal(results.length, 1)
  assert.equal(results[0].entry.ownershipId, entry.ownershipId)
})

test('empty and blank search queries return all cards unchanged', () => {
  const cards = boardRpgCards()

  assert.equal(searchCards(cards, '').length, 2)
  assert.equal(searchCards(cards, '   ').length, 2)
})

test('existing Board/RPG sorting behavior is preserved', () => {
  const entries = [
    makeEntry({ catalogId: 'c1', ownershipId: 'o1', displayName: 'Beta' }),
    makeEntry({ catalogId: 'c2', ownershipId: 'o2', displayName: 'Alpha' }),
    makeEntry({ catalogId: 'c3', ownershipId: 'o3', displayName: 'Gamma' }),
  ]
  const cards = buildBoardRPGCardsFromEntries(entries)
  const byId = new Map(cards.map((item) => [item.entry.catalogId, item]))

  byId.get('c1')!.card.rating = 7
  byId.get('c1')!.card.yearPublished = 2001
  byId.get('c1')!.card.minPlayTime = 60
  byId.get('c2')!.card.rating = 9
  byId.get('c2')!.card.yearPublished = 1999
  byId.get('c2')!.card.minPlayTime = 30
  byId.get('c3')!.card.rating = 5
  byId.get('c3')!.card.yearPublished = 2010
  byId.get('c3')!.card.minPlayTime = 45

  assert.deepEqual(
    sortCards(cards, 'name-asc').map((item) => item.card.title),
    ['Alpha', 'Beta', 'Gamma'],
  )
  assert.deepEqual(
    sortCards(cards, 'name-desc').map((item) => item.card.title),
    ['Gamma', 'Beta', 'Alpha'],
  )
  assert.deepEqual(
    sortCards(cards, 'rating-high').map((item) => item.card.rating),
    [9, 7, 5],
  )
  assert.deepEqual(
    sortCards(cards, 'rating-low').map((item) => item.card.rating),
    [5, 7, 9],
  )
  assert.deepEqual(
    sortCards(cards, 'year').map((item) => item.card.yearPublished),
    [2010, 2001, 1999],
  )
  assert.deepEqual(
    sortCards(cards, 'playtime').map((item) => item.card.minPlayTime),
    [30, 45, 60],
  )
})

test('existing ownership/status filtering is preserved via entry.status', () => {
  const cards = boardRpgCards()

  const owned = filterCardsByStatus(cards, 'owned')
  assert.equal(owned.length, 1)
  assert.equal(owned[0].entry.displayName, 'Root')

  const wishlist = filterCardsByStatus(cards, 'wishlist')
  assert.equal(wishlist.length, 1)
  assert.equal(wishlist[0].entry.domain, 'rpg')

  assert.equal(filterCardsByStatus(cards, 'all').length, 2)

  assert.deepEqual(getStatusCounts(cards), { all: 2, owned: 1, wishlist: 1 })
})

test('domain filtering never includes TCG/miniatures in the current Board/RPG views', () => {
  const allEntries = [...BOARD_RPG_ENTRIES, TCG_ENTRY, MINIATURE_ENTRY]
  const cards = buildBoardRPGCardsFromEntries(allEntries)

  assert.equal(cards.length, 2)
  assert.ok(cards.every((item) => item.entry.domain === 'board_game' || item.entry.domain === 'rpg'))

  const boardGames = filterCardsByCategory(cards, 'board-games')
  assert.equal(boardGames.length, 1)
  assert.equal(boardGames[0].entry.domain, 'board_game')

  const rpgs = filterCardsByCategory(cards, 'rpgs')
  assert.equal(rpgs.length, 1)
  assert.equal(rpgs[0].entry.domain, 'rpg')

  assert.equal(filterCardsByCategory(cards, 'miniatures').length, 0)
  assert.equal(filterCardsByCategory(cards, 'trading-cards').length, 0)

  assert.deepEqual(getCategoryCounts(cards), {
    all: 2,
    'board-games': 1,
    rpgs: 1,
    miniatures: 0,
    'trading-cards': 0,
  })
})

test('TCG entries produce visible cards and participate in Collection controls without rendering miniatures', () => {
    const cards = buildCollectionCardsFromEntries([...BOARD_RPG_ENTRIES, TCG_ENTRY, MINIATURE_ENTRY])
    const tcgCard = cards.find((item) => item.entry.domain === 'tcg')

    assert.equal(cards.length, 3)
    if (!tcgCard) assert.fail('Expected a TCG card')
    assert.equal(tcgCard.card.kind, 'tcg')
    if (tcgCard.card.kind === 'tcg') {
      assert.equal(tcgCard.card.title, 'Lightning Bolt')
      assert.equal(tcgCard.card.quantity, 1)
    }
    assert.ok(cards.every((item) => item.entry.domain !== 'miniature'))
    assert.deepEqual(getCategoryCounts(cards), {
      all: 3,
      'board-games': 1,
      rpgs: 1,
      miniatures: 0,
      'trading-cards': 1,
    })
    assert.equal(hasVisibleCategory('trading-cards', 1), true)
    assert.equal(hasVisibleCategory('trading-cards', 0), false)
    assert.deepEqual(filterCardsByCategory(cards, 'trading-cards').map((item) => item.entry.displayName), ['Lightning Bolt'])
    assert.deepEqual(filterCardsByCategory(cards, 'all').map((item) => item.entry.domain), ['board_game', 'rpg', 'tcg'])
    assert.equal(searchCards(cards, 'lightning bolt')[0].entry.domain, 'tcg')
    assert.deepEqual(
      applyCollectionControls(cards, { sortBy: 'name-asc' }).map((item) => item.entry.displayName),
      ['Lightning Bolt', 'Root', 'The Dying Earth'],
    )
})

test('TCG card data preserves identity, domain-specific quantity, and no detail route', () => {
    const entry = makeEntry({
      domain: 'tcg',
      catalogId: 'tcg-card-id',
      ownershipId: 'tcg-collection-id',
      displayName: 'Black Lotus',
      image: 'https://example.com/black-lotus.jpg',
      detailTarget: null,
      metadata: {
        quantity: 4,
        tcg_system: 'magic',
        set_name: 'Limited Edition Alpha',
        set_code: 'LEA',
        rarity: 'rare',
      },
    })
    const [item] = buildCollectionCardsFromEntries([entry])

    assert.equal(item.entry.catalogId, 'tcg-card-id')
    assert.equal(item.entry.ownershipId, 'tcg-collection-id')
    assert.notEqual(item.entry.catalogId, item.entry.ownershipId)
    assert.equal(item.entry.detailTarget, null)
    assert.notEqual(item.entry.detailTarget, `/game/${item.entry.catalogId}`)
    assert.equal(item.card.kind, 'tcg')
    if (item.card.kind === 'tcg') {
      assert.equal(item.card.id, 'tcg-card-id')
      assert.equal(item.card.title, 'Black Lotus')
      assert.equal(item.card.image, 'https://example.com/black-lotus.jpg')
      assert.equal(item.card.quantity, 4)
      assert.equal(item.card.setName, 'Limited Edition Alpha')
      assert.equal(item.card.setCode, 'LEA')
      assert.equal(item.card.rarity, 'rare')
      assert.equal(item.card.tcgSystem, 'magic')
    }
})

test('miniatures system options are derived only from the user\'s own miniature entries', () => {
  const options = getMiniatureSystemOptions([MINIATURE_ENTRY, ...BOARD_RPG_ENTRIES])

  assert.deepEqual(options, [{ id: 'wh40k', name: 'Warhammer 40,000' }])
  assert.ok(!options.some((option) => option.id === 'age-of-sigmar'))
})

test('a newly owned miniatures system becomes available automatically', () => {
  const aosEntry = makeEntry({
    domain: 'miniature',
    catalogId: 'catalog-mini-2',
    ownershipId: 'ownership-mini-2',
    displayName: 'Liberators',
    detailTarget: null,
    metadata: { system: 'age-of-sigmar', system_name: 'Age of Sigmar' },
  })

  const options = getMiniatureSystemOptions([MINIATURE_ENTRY, aosEntry])

  assert.deepEqual(options, [
    { id: 'age-of-sigmar', name: 'Age of Sigmar' },
    { id: 'wh40k', name: 'Warhammer 40,000' },
  ])
})

test('unowned catalog systems do not appear as filter options', () => {
  const options = getMiniatureSystemOptions([MINIATURE_ENTRY])

  assert.equal(options.length, 1)
  assert.ok(!options.some((option) => option.name === 'Age of Sigmar'))
  assert.equal(getMiniatureSystemOptions([]).length, 0)
  assert.equal(getMiniatureSystemOptions(BOARD_RPG_ENTRIES).length, 0)
})

test('miniature entries without system metadata produce no filter option', () => {
  const noSystem = makeEntry({
    domain: 'miniature',
    catalogId: 'catalog-mini-3',
    ownershipId: 'ownership-mini-3',
    displayName: 'Mystery Unit',
    detailTarget: null,
    metadata: {},
  })

  assert.deepEqual(getMiniatureSystemOptions([noSystem]), [])
})

test('empty filtered results behave correctly', () => {
  const cards = boardRpgCards()

  assert.deepEqual(searchCards(cards, 'no-such-game'), [])
  assert.deepEqual(filterCardsByStatus(cards, 'previously_owned'), [])
  assert.deepEqual(filterCardsByCategory(cards, 'miniatures'), [])
  assert.deepEqual(getStatusCounts([]), { all: 0, owned: 0, wishlist: 0 })
  assert.deepEqual(getCategoryCounts([]), {
    all: 0,
    'board-games': 0,
    rpgs: 0,
    miniatures: 0,
    'trading-cards': 0,
  })
  assert.deepEqual(getMiniatureSystemOptions([]), [])
})

test('applyCollectionControls composes category, status, search and sort', () => {
  const entries = [
    makeEntry({
      domain: 'board_game',
      catalogId: 'c1',
      ownershipId: 'o1',
      displayName: 'Terraforming Mars',
      status: 'owned',
    }),
    makeEntry({
      domain: 'board_game',
      catalogId: 'c2',
      ownershipId: 'o2',
      displayName: 'Terraforming Venus',
      status: 'wishlist',
    }),
    makeEntry({
      domain: 'rpg',
      catalogId: 'c3',
      ownershipId: 'o3',
      displayName: 'Terraforming the RPG',
      status: 'owned',
    }),
  ]
  const cards = buildBoardRPGCardsFromEntries(entries)

  const results = applyCollectionControls(cards, {
    category: 'board-games',
    status: 'owned',
    searchQuery: 'terraforming',
    sortBy: 'name-desc',
  })

  assert.deepEqual(
    results.map((item) => item.entry.displayName),
    ['Terraforming Mars'],
  )

  const allSorted = applyCollectionControls(cards, { sortBy: 'name-asc' })
  assert.deepEqual(
    allSorted.map((item) => item.entry.displayName),
    ['Terraforming Mars', 'Terraforming the RPG', 'Terraforming Venus'],
  )
})

test('search and sorting work on cards built from user game rows', () => {
  const rows = [
    makeGameRow('ownership-a', 'Catan', 'board_game', 'owned', { year: 1995 }),
    makeGameRow('ownership-b', 'Cyberpunk RED', 'rpg', 'owned', { year: 2020 }),
  ]
  const entries = rows.map((row) =>
    makeEntry({
      domain: row.game.category === 'rpg' ? 'rpg' : 'board_game',
      catalogId: row.game_id,
      ownershipId: row.id,
      displayName: row.game.name,
      status: row.status,
      metadata: { year: (row.game as { year?: number }).year },
    }),
  )

  const cards = buildBoardRPGCardsFromEntries(entries)

  assert.equal(searchCards(cards, 'cyberpunk')[0].entry.domain, 'rpg')
  assert.equal(searchCards(cards, 'catan')[0].entry.domain, 'board_game')
})
