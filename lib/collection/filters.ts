import type {
  CollectionCardItem,
  CollectionDomain,
  CollectionEntry,
  CollectionStatus,
} from '@/lib/types/collection'

/**
 * Category values used by the current Collection UI. The visible control
 * labels are Board/RPG-oriented; this module only makes the underlying
 * filtering CollectionEntry/domain-aware.
 */
export type CollectionCategoryFilter = 'all' | 'board-games' | 'rpgs' | 'miniatures' | 'trading-cards'

export type CollectionStatusFilter = 'all' | CollectionStatus

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
}

const CATEGORY_DOMAINS: Record<Exclude<CollectionCategoryFilter, 'all'>, readonly CollectionDomain[]> = {
  'board-games': ['board_game'],
  rpgs: ['rpg'],
  miniatures: ['miniature'],
  'trading-cards': ['tcg'],
}

/**
 * Domains that back each category. Board/RPG categories are mapped strictly
 * by CollectionEntry.domain, so TCG and miniature entries can never leak
 * into the Board/RPG views even though they share the entries list.
 */
export function domainsForCategory(category: CollectionCategoryFilter): readonly CollectionDomain[] | null {
  if (category === 'all') {
    return null
  }
  return CATEGORY_DOMAINS[category]
}

export function filterCardsByDomains(
  cards: readonly CollectionCardItem[],
  domains: readonly CollectionDomain[],
): CollectionCardItem[] {
  const allowed = new Set<CollectionDomain>(domains)
  return cards.filter((item) => allowed.has(item.entry.domain))
}

export function filterCardsByCategory(
  cards: readonly CollectionCardItem[],
  category: CollectionCategoryFilter,
): CollectionCardItem[] {
  const domains = domainsForCategory(category)
  if (!domains) {
    return [...cards]
  }
  return filterCardsByDomains(cards, domains)
}

export function filterCardsByStatus(
  cards: readonly CollectionCardItem[],
  status: CollectionStatusFilter,
): CollectionCardItem[] {
  if (status === 'all') {
    return [...cards]
  }
  return cards.filter((item) => item.entry.status === status)
}

export function searchCards(cards: readonly CollectionCardItem[], query: string): CollectionCardItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return [...cards]
  }
  return cards.filter((item) => {
    const title = item.card.title || item.entry.displayName || ''
    return title.toLowerCase().includes(normalized)
  })
}

/**
 * Name sorts use the common display identity (entry.displayName with the
 * card title as fallback). Rating/year/playtime sorts read the
 * Board/RPG-specific card payload; entries without those fields sort as 0.
 */
export function sortCards(
  cards: readonly CollectionCardItem[],
  sortBy: CollectionSortOption,
): CollectionCardItem[] {
  const sorted = [...cards]

  sorted.sort((left, right) => {
    const leftTitle = left.card.title || left.entry.displayName || ''
    const rightTitle = right.card.title || right.entry.displayName || ''
    const leftBoardCard = left.card.kind === 'board-rpg' ? left.card : null
    const rightBoardCard = right.card.kind === 'board-rpg' ? right.card : null

    switch (sortBy) {
      case 'name-asc':
        return leftTitle.localeCompare(rightTitle)
      case 'name-desc':
        return rightTitle.localeCompare(leftTitle)
      case 'rating-high':
        return (rightBoardCard?.rating || 0) - (leftBoardCard?.rating || 0)
      case 'rating-low':
        return (leftBoardCard?.rating || 0) - (rightBoardCard?.rating || 0)
      case 'year':
        return (rightBoardCard?.yearPublished || 0) - (leftBoardCard?.yearPublished || 0)
      case 'playtime':
        return (leftBoardCard?.minPlayTime || 0) - (rightBoardCard?.minPlayTime || 0)
      default:
        return 0
    }
  })

  return sorted
}

/**
 * Applies the current Collection controls in domain → status → search → sort
 * order, operating purely on the CollectionEntry/CollectionCardItem boundary.
 */
export function applyCollectionControls(
  cards: readonly CollectionCardItem[],
  controls: {
    category?: CollectionCategoryFilter
    status?: CollectionStatusFilter
    searchQuery?: string
    sortBy?: CollectionSortOption
  } = {},
): CollectionCardItem[] {
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
  }
}

export function getCategoryCounts(cards: readonly CollectionCardItem[]): CollectionCategoryCounts {
  const counts: CollectionCategoryCounts = {
    all: cards.length,
    'board-games': 0,
    rpgs: 0,
    miniatures: 0,
    'trading-cards': 0,
  }

  for (const item of cards) {
    switch (item.entry.domain) {
      case 'board_game':
        counts['board-games']++
        break
      case 'rpg':
        counts.rpgs++
        break
      case 'miniature':
        counts.miniatures++
        break
      case 'tcg':
        counts['trading-cards']++
        break
    }
  }

  return counts
}

export function hasVisibleCategory(category: CollectionCategoryFilter, count: number): boolean {
  return category === 'all' || count > 0
}

export interface MiniatureSystemOption {
  /** Stable system code, e.g. 'wh40k'. */
  id: string
  /** Human-readable system name, e.g. 'Warhammer 40,000'. */
  name: string
}

/**
 * Derives the available Miniatures system filters from the user's own
 * CollectionEntry rows (metadata.system / metadata.system_name), never from
 * the catalog. A system only appears once at least one of the user's
 * miniature entries represents it, so owning a new system makes it available
 * automatically and unowned catalog systems never appear.
 */
export function getMiniatureSystemOptions(entries: readonly CollectionEntry[]): MiniatureSystemOption[] {
  const byId = new Map<string, string>()

  for (const entry of entries) {
    if (entry.domain !== 'miniature') {
      continue
    }

    const code = typeof entry.metadata.system === 'string' ? entry.metadata.system.trim() : ''
    const name = typeof entry.metadata.system_name === 'string' ? entry.metadata.system_name.trim() : ''

    const id = code || name
    if (!id) {
      continue
    }

    if (!byId.has(id)) {
      byId.set(id, name || code || id)
    }
  }

  return Array.from(byId, ([id, name]) => ({ id, name })).sort((left, right) =>
    left.name.localeCompare(right.name),
  )
}
