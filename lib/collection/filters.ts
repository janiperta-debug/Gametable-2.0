import type {
  CollectionCardItem,
  CollectionDomain,
  CollectionEntry,
  CollectionStatus,
} from '@/lib/types/collection'

export type CollectionCategoryFilter = 'all' | 'board-games' | 'rpgs' | 'miniatures' | 'trading-cards'

export type CollectionStatusFilter = 'all' | CollectionStatus | 'marketplace'

export type CollectionSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'rating-high'
  | 'rating-low'
  | 'year'
  | 'playtime'

export interface CollectionCategoryCounts {
  all: number
  'board-games': number
  rpgs: number
  miniatures: number
  'trading-cards': number
}

export interface CollectionStatusCounts {
  all: number
  owned: number
  wishlist: number
  marketplace: number
}

function compareBoardSpecificCards(left: CollectionCardItem['card'], right: CollectionCardItem['card'], field: 'rating' | 'yearPublished' | 'minPlayTime', direction: 1 | -1): number {
  if (left.kind !== 'board-rpg') return right.kind === 'board-rpg' ? 1 : 0
  if (right.kind !== 'board-rpg') return -1
  return direction * (left[field] - right[field])
}

const CATEGORY_DOMAINS: Record<Exclude<CollectionCategoryFilter, 'all'>, readonly CollectionDomain[]> = {
  'board-games': ['board_game'], rpgs: ['rpg'], miniatures: ['miniature'], 'trading-cards': ['tcg'],
}

export function domainsForCategory(category: CollectionCategoryFilter): readonly CollectionDomain[] | null {
  return category === 'all' ? null : CATEGORY_DOMAINS[category]
}

export function filterCardsByDomains(cards: readonly CollectionCardItem[], domains: readonly CollectionDomain[]): CollectionCardItem[] {
  const allowed = new Set<CollectionDomain>(domains)
  return cards.filter((item) => allowed.has(item.entry.domain))
}

export function filterCardsByCategory(cards: readonly CollectionCardItem[], category: CollectionCategoryFilter): CollectionCardItem[] {
  const domains = domainsForCategory(category)
  return domains ? filterCardsByDomains(cards, domains) : [...cards]
}

function isMarketplaceCard(item: CollectionCardItem): boolean {
  return item.card.kind === 'board-rpg' && item.card.forTrade === true
}

export function filterCardsByStatus(cards: readonly CollectionCardItem[], status: CollectionStatusFilter): CollectionCardItem[] {
  if (status === 'all') return [...cards]
  if (status === 'marketplace') return cards.filter(isMarketplaceCard)
  return cards.filter((item) => item.entry.status === status)
}

export function searchCards(cards: readonly CollectionCardItem[], query: string): CollectionCardItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return [...cards]
  return cards.filter((item) => (item.card.title || item.entry.displayName || '').toLowerCase().includes(normalized))
}

export function sortCards(cards: readonly CollectionCardItem[], sortBy: CollectionSortOption): CollectionCardItem[] {
  const sorted = [...cards]
  sorted.sort((left, right) => {
    const leftTitle = left.card.title || left.entry.displayName || ''
    const rightTitle = right.card.title || right.entry.displayName || ''
    switch (sortBy) {
      case 'name-asc': return leftTitle.localeCompare(rightTitle)
      case 'name-desc': return rightTitle.localeCompare(leftTitle)
      case 'rating-high': return compareBoardSpecificCards(left.card, right.card, 'rating', -1)
      case 'rating-low': return compareBoardSpecificCards(left.card, right.card, 'rating', 1)
      case 'year': return compareBoardSpecificCards(left.card, right.card, 'yearPublished', -1)
      case 'playtime': return compareBoardSpecificCards(left.card, right.card, 'minPlayTime', 1)
      default: return 0
    }
  })
  return sorted
}

export function applyCollectionControls(cards: readonly CollectionCardItem[], controls: { category?: CollectionCategoryFilter; status?: CollectionStatusFilter; searchQuery?: string; sortBy?: CollectionSortOption } = {}): CollectionCardItem[] {
  const { category = 'all', status = 'all', searchQuery = '', sortBy = 'name-asc' } = controls
  let filtered = filterCardsByCategory(cards, category)
  filtered = filterCardsByStatus(filtered, status)
  filtered = searchCards(filtered, searchQuery)
  return sortCards(filtered, sortBy)
}

export function getStatusCounts(cards: readonly CollectionCardItem[]): CollectionStatusCounts {
  return {
    all: cards.length,
    owned: cards.filter((item) => item.entry.status === 'owned').length,
    wishlist: cards.filter((item) => item.entry.status === 'wishlist').length,
    marketplace: cards.filter(isMarketplaceCard).length,
  }
}

export function getCategoryCounts(cards: readonly CollectionCardItem[]): CollectionCategoryCounts {
  const counts: CollectionCategoryCounts = { all: cards.length, 'board-games': 0, rpgs: 0, miniatures: 0, 'trading-cards': 0 }
  for (const item of cards) {
    switch (item.entry.domain) {
      case 'board_game': counts['board-games']++; break
      case 'rpg': counts.rpgs++; break
      case 'miniature': counts.miniatures++; break
      case 'tcg': counts['trading-cards']++; break
    }
  }
  return counts
}

export function hasVisibleCategory(category: CollectionCategoryFilter, count: number): boolean {
  return category === 'all' || count > 0
}

export interface MiniatureSystemOption { id: string; name: string }

export function getMiniatureSystemOptions(entries: readonly CollectionEntry[]): MiniatureSystemOption[] {
  const byId = new Map<string, string>()
  for (const entry of entries) {
    if (entry.domain !== 'miniature') continue
    const code = typeof entry.metadata.system === 'string' ? entry.metadata.system.trim() : ''
    const name = typeof entry.metadata.system_name === 'string' ? entry.metadata.system_name.trim() : ''
    const id = code || name
    if (!id) continue
    if (!byId.has(id)) byId.set(id, name || code || id)
  }
  return Array.from(byId, ([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name))
}
