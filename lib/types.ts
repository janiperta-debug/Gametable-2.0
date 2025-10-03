// Game types matching Firebase structure
export interface Game {
  id: string
  name: string
  category: "boardgame" | "rpg" | "miniature" | "tradingcard"
  imageUrl?: string
  bggId?: number
  bggRating?: number
  minPlayers?: number
  maxPlayers?: number
  minPlaytime?: number
  maxPlaytime?: number
  yearPublished?: number
  description?: string
  source: "BGG" | "MANUAL"
  addedAt: Date
  userId: string
  forTrade?: boolean
  tradeNotes?: string
  wishlist?: boolean
}

// User profile type
export interface UserProfile {
  userId: string
  displayName: string
  email: string
  bio?: string
  location?: string
  photoURL?: string
  currentLevel: number
  prefersBoardGames: boolean
  prefersRPGs: boolean
  prefersOtherMiniatures: boolean
  prefersWarhammer: boolean
  lastXPUpdate?: Date
}

// Event type
export interface Event {
  id: string
  title: string
  description: string
  date: Date
  location: string
  maxAttendees?: number
  attendees: string[]
  createdBy: string
  isPublic: boolean
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  gameType?: string
}

// Types for conversations, notifications, and XP history
export interface Conversation {
  id: string
  participants: string[]
  lastMessage: string
  lastMessageTime: Date
  unreadBy: string[]
}

export interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
  read: boolean
}

export interface Notification {
  id: string
  userId: string
  type: "friend_request" | "event_invite" | "xp_award" | "message" | "event_update"
  message: string
  read: boolean
  createdAt: Date
  relatedId?: string
}

export interface XPHistory {
  id: string
  userId: string
  source: string
  amount: number
  description: string
  timestamp: Date
}
