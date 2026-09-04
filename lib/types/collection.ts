export type CollectionDomain = 'board_game' | 'rpg' | 'tcg' | 'miniature'

export type CollectionStatus = 'owned' | 'wishlist' | 'previously_owned'

export type CollectionMetadata = Record<string, unknown>

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
