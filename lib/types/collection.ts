export type CollectionDomain = 'board_game' | 'rpg' | 'tcg' | 'miniature'

export type CollectionStatus = 'owned' | 'wishlist' | 'previously_owned'

export type CollectionMetadata = Record<string, unknown>

export interface CollectionExpansionSummary {
  id: string
  name: string
  year: number | null
  image_url: string | null
  owned: boolean
}

export interface BoardRPGCollectionCardData {
  kind: 'board-rpg'
  id: string
  title: string
  image: string
  rating: number
  playerCount: string
  minPlayers: number
  maxPlayers: number
  playTime: string
  minPlayTime: number
  maxPlayTime: number
  category: string
  yearPublished: number
  owned: boolean
  wishlist: boolean
  forTrade?: boolean
  userGameId?: string
  ownedExpansionCount?: number
  totalExpansionCount?: number
  expansions?: CollectionExpansionSummary[]
}

export interface TCGCollectionCardData {
  kind: 'tcg'
  id: string
  title: string
  image: string
  quantity: number
  condition: string | null
  foil: boolean
  tcgSystem: string | null
  setName: string | null
  setCode: string | null
  rarity: string | null
}

export interface MiniatureCollectionCardData {
  kind: 'miniature'
  id: string
  title: string
  image: string
  modelCount: number | null
  pointsTotal: number | null
  paintStatus: string | null
  unitType: string | null
  faction: string | null
  system: string | null
  isWarlord: boolean
}

export interface BoardRPGCollectionCardItem {
  entry: CollectionEntry
  card: BoardRPGCollectionCardData
}

export interface TCGCollectionCardItem {
  entry: CollectionEntry
  card: TCGCollectionCardData
}

export interface MiniatureCollectionCardItem {
  entry: CollectionEntry
  card: MiniatureCollectionCardData
}

export type CollectionCardItem = BoardRPGCollectionCardItem | TCGCollectionCardItem | MiniatureCollectionCardItem

export function assertUnreachableCollectionCard(value: never): never {
  throw new Error(`Unsupported Collection card kind: ${String(value)}`)
}

export interface CollectionEntry {
  domain: CollectionDomain
  catalogId: string
  ownershipId: string
  displayName: string
  image: string | null
  status: CollectionStatus
  detailTarget: string | null
  metadata: CollectionMetadata
}
