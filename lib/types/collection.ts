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

export interface CollectionCardItem {
  entry: CollectionEntry
  card: BoardRPGCollectionCardData
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
