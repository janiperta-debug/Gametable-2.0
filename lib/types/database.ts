// Database types matching Supabase schema

export interface Game {
  id: string
  bgg_id: number | null
  name: string
  year: number | null
  category: string | null
  min_players: number | null
  max_players: number | null
  min_playtime: number | null
  max_playtime: number | null
  bgg_rating: number | null
  image_url: string | null
  thumbnail_url: string | null
  description: string | null
  created_at: string | null
}

export interface UserGame {
  id: string
  user_id: string
  game_id: string
  status: 'owned' | 'wishlist' | 'previously_owned'
  condition: 'mint' | 'like_new' | 'good' | 'fair' | 'poor' | null
  personal_rating: number | null
  play_count: number
  notes: string | null
  added_at: string | null
}

export interface UserGameWithGame extends UserGame {
  game: Game
}

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  xp: number
  level: number
  location: string | null
  theme: string
  show_collection: boolean
  firebase_uid: string | null
  preferences: Record<string, unknown>
  unlocked_themes: string[]
  created_at: string | null
}

// BGG API types
export interface BGGSearchResult {
  id: number
  name: string
  yearPublished: number | null
}

export interface BGGGameDetails {
  id: number
  name: string
  yearPublished: number | null
  minPlayers: number | null
  maxPlayers: number | null
  minPlaytime: number | null
  maxPlaytime: number | null
  rating: number | null
  image: string | null
  thumbnail: string | null
  description: string | null
}
