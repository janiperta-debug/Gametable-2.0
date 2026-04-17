// Room theme data with images and extracted color palettes
export interface RoomTheme {
  id: string
  name: string
  image: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  description: string
  atmosphere: string
  unlockLevel: number
  category: "Ground Floor" | "Second Floor" | "Basement"
  isActive?: boolean
  isUnlocked?: boolean
  canUnlock?: boolean
}

export const roomThemes: RoomTheme[] = [
  // Ground Floor Rooms
  {
    id: "main-hall",
    name: "Main Hall",
    image: "/themes/main-hall-preview.png",
    colors: {
      primary: "#8B1538", // Deep burgundy
      secondary: "#8B4513", // Rich mahogany
      accent: "#DAA520", // Golden accents
      background: "#F5F5DC", // Cream marble
    },
    description: "The grand entrance with burgundy elegance and golden accents",
    atmosphere: "Majestic and welcoming",
    unlockLevel: 5,
    category: "Ground Floor",
    isActive: true,
    isUnlocked: true,
  },
  {
    id: "library",
    name: "Library",
    image: "/themes/library-preview.png",
    colors: {
      primary: "#3C2415", // Deep mahogany
      secondary: "#8B4513", // Rich brown
      accent: "#DAA520", // Golden accents
      background: "#F5F5DC", // Cream
    },
    description: "Deep mahogany shelves filled with gaming wisdom",
    atmosphere: "Scholarly and contemplative",
    unlockLevel: 10,
    category: "Ground Floor",
    isActive: false,
    isUnlocked: true, // Temporarily unlocked for testing
  },
  {
    id: "conservatory",
    name: "Conservatory",
    image: "/themes/conservatory-preview.png",
    colors: {
      primary: "#228B22", // Forest green
      secondary: "#90EE90", // Light green
      accent: "#DAA520", // Golden accents
      background: "#F0FFF0", // Honeydew
    },
    description: "Lush greenery and natural light for peaceful gaming",
    atmosphere: "Fresh and rejuvenating",
    unlockLevel: 15,
    category: "Ground Floor",
    isActive: false,
    isUnlocked: true, // Temporarily unlocked for testing
    canUnlock: true,
  },
  {
    id: "fireside-lounge",
    name: "Fireside Lounge",
    image: "/themes/fireside-lounge-preview.png",
    colors: {
      primary: "#1C1C1C", // Obsidian (dark charcoal)
      secondary: "#708090", // Steel gray
      accent: "#FF4500", // Orange fire
      background: "#2F2F2F", // Dark stone
    },
    description: "Dramatic obsidian and steel with flickering orange flames",
    atmosphere: "Dark and sophisticated",
    unlockLevel: 20,
    category: "Ground Floor",
    isActive: false,
    isUnlocked: true, // Temporarily unlocked for testing
    canUnlock: true,
  },
  {
    id: "bar",
    name: "Gentleman's Bar",
    image: "/themes/gentlemans-bar-preview.png",
    colors: {
      primary: "#FFBF00", // Amber
      secondary: "#B87333", // Dark brass
      accent: "#DAA520", // Golden highlights
      background: "#FFF8DC", // Cornsilk
    },
    description: "Amber spirits and brass fixtures for social gaming",
    atmosphere: "Lively and social",
    unlockLevel: 25,
    category: "Ground Floor",
    isActive: false,
    isUnlocked: true, // Temporarily unlocked for testing
    canUnlock: true,
  },
  {
    id: "spa",
    name: "Spa",
    image: "/themes/spa-preview.png",
    colors: {
      primary: "#4A148C", // Deep purple (amethyst spa stones)
      secondary: "#D1C4E9", // Medium lavender
      accent: "#E6D7F0", // Soft lavender mist
      background: "#F5F0FA", // Very pale lavender
    },
    description: "Serene lavender sanctuary with amethyst accents and spa tranquility",
    atmosphere: "Peaceful and rejuvenating",
    unlockLevel: 30,
    category: "Ground Floor",
    isActive: false,
    isUnlocked: true, // Temporarily unlocked for testing
    canUnlock: true,
  },
  {
    id: "gallery",
    name: "Gallery",
    image: "/themes/gallery-preview.png",
    colors: {
      primary: "#000080", // Navy blue
      secondary: "#F5F5F5", // White walls
      accent: "#DAA520", // Golden frames
      background: "#FFFEF7", // Ivory
    },
    description: "Royal navy walls showcasing gaming masterpieces",
    atmosphere: "Refined and artistic",
    unlockLevel: 35,
    category: "Ground Floor",
    isActive: false,
    isUnlocked: true, // Temporarily unlocked for testing
    canUnlock: true,
  },

  // Second Floor Rooms
  {
    id: "ballroom",
    name: "Ballroom",
    image: "/themes/ballroom-preview.png",
    colors: {
      primary: "#F8F8FF", // Crystal white
      secondary: "#DAA520", // Golden
      accent: "#FFD700", // Pure gold
      background: "#FFFAF0", // Floral white
    },
    description: "Crystal white grandeur with golden accents",
    atmosphere: "Luxurious celebration",
    unlockLevel: 45,
    category: "Second Floor",
    isActive: false,
    isUnlocked: true,
    canUnlock: true,
  },
  {
    id: "map-room",
    name: "Map Room",
    image: "/themes/map-room-preview.png",
    colors: {
      primary: "#DEB887", // Burlywood
      secondary: "#B87333", // Dark brass
      accent: "#DAA520", // Golden compass
      background: "#F5F5DC", // Beige
    },
    description: "Sepia charts and brass instruments for strategic planning",
    atmosphere: "Adventurous strategy",
    unlockLevel: 50,
    category: "Second Floor",
    isActive: false,
    isUnlocked: true,
    canUnlock: true,
  },
  {
    id: "observatory",
    name: "Observatory",
    image: "/themes/observatory-preview.png",
    colors: {
      primary: "#8B0000", // Dark crimson
      secondary: "#C0C0C0", // Silver
      accent: "#708090", // Steel telescope
      background: "#2F1B14", // Dark background
    },
    description: "Dark crimson depths with silver starlight",
    atmosphere: "Cosmic contemplation",
    unlockLevel: 55,
    category: "Second Floor",
    isActive: false,
    isUnlocked: true,
    canUnlock: true,
  },
  {
    id: "theater-room",
    name: "Theater Room",
    image: "/themes/theater-preview.png",
    colors: {
      primary: "#663399", // Royal purple
      secondary: "#DAA520", // Golden stage lights
      accent: "#FFD700", // Gold trim
      background: "#2F1B14", // Dark brown
    },
    description: "Royal purple curtains and golden stage lights",
    atmosphere: "Dramatic entertainment",
    unlockLevel: 60,
    category: "Second Floor",
    isActive: false,
    isUnlocked: true,
    canUnlock: true,
  },
  {
    id: "clock-tower",
    name: "Clock Tower",
    image: "/themes/clock-tower-preview.png",
    colors: {
      primary: "#B0E0E6", // Ice blue
      secondary: "#708090", // Steel
      accent: "#C0C0C0", // Chrome
      background: "#F0F8FF", // Alice blue
    },
    description: "Ice blue precision with steel and chrome mechanisms",
    atmosphere: "Mechanical precision",
    unlockLevel: 65,
    category: "Second Floor",
    isActive: false,
    isUnlocked: true,
    canUnlock: true,
  },
  {
    id: "war-room",
    name: "War Room",
    image: "/themes/war-room-preview.png",
    colors: {
      primary: "#355E3B", // Hunter green
      secondary: "#CD7F32", // Bronze
      accent: "#B8860B", // Aged golden medals
      background: "#F5F5DC", // Beige maps
    },
    description: "Military green strategy with bronze battle plans",
    atmosphere: "Strategic command",
    unlockLevel: 70,
    category: "Second Floor",
    isActive: false,
    isUnlocked: true,
    canUnlock: true,
  },
  {
    id: "artroom",
    name: "Art Room",
    image: "/themes/art-room-preview.png",
    colors: {
      primary: "#2F2F2F", // Deep charcoal (charcoal drawing tools)
      secondary: "#E6C547", // Bright mustard
      accent: "#D4AF37", // Rich mustard yellow
      background: "#FFFEF7", // Warm cream
    },
    description: "Creative studio with rich mustard walls and charcoal drawing tools",
    atmosphere: "Artistic and inspiring",
    unlockLevel: 40,
    category: "Second Floor",
    isActive: false,
    isUnlocked: true,
    canUnlock: true,
  },

  // Basement Rooms
  {
    id: "alchemist-laboratory",
    name: "Alchemist Laboratory",
    image: "/themes/alchemist-laboratory-preview.png",
    colors: {
      primary: "#50C878", // Emerald
      secondary: "#007FFF", // Azure
      accent: "#DAA520", // Golden equipment
      background: "#F0F8FF", // Alice blue
    },
    description: "Emerald potions and azure mystical energies",
    atmosphere: "Magical and experimental",
    unlockLevel: 80,
    category: "Basement",
    isActive: false,
    isUnlocked: true, // Unlocked for testing
    canUnlock: true,
  },
  {
    id: "dungeon",
    name: "Dungeon",
    image: "/themes/dungeon-preview.png",
    colors: {
      primary: "#DAA520", // Honey gold
      secondary: "#CD7F32", // Bronze
      accent: "#B8860B", // Dark goldenrod
      background: "#F5DEB3", // Wheat stone
    },
    description: "Honey stone walls with bronze torch brackets",
    atmosphere: "Mysterious and ancient",
    unlockLevel: 85,
    category: "Basement",
    isActive: false,
    isUnlocked: true, // Unlocked for testing
    canUnlock: true,
  },
  {
    id: "underground-temple",
    name: "Underground Temple",
    image: "/themes/underground-temple-preview.png",
    colors: {
      primary: "#708090", // Slate gray
      secondary: "#008080", // Teal
      accent: "#DAA520", // Golden altar
      background: "#F8F8FF", // Ghost white
    },
    description: "Stone gray sanctity with teal sacred waters",
    atmosphere: "Sacred and timeless",
    unlockLevel: 75,
    category: "Basement",
    isActive: false,
    isUnlocked: true, // Unlocked for testing
    canUnlock: true,
  },
  {
    id: "crystal-cavern",
    name: "Crystal Cave",
    image: "/themes/crystal-cave-preview.png",
    colors: {
      primary: "#F7CAC9", // Rose quartz
      secondary: "#9966CC", // Amethyst
      accent: "#DAA520", // Golden veins
      background: "#E6E6FA", // Lavender
    },
    description: "Rose quartz formations and amethyst clusters",
    atmosphere: "Ethereal and enchanting",
    unlockLevel: 90,
    category: "Basement",
    isActive: false,
    isUnlocked: true, // Unlocked for testing
    canUnlock: true,
  },
  {
    id: "treasure-vault",
    name: "Treasure Vault",
    image: "/themes/treasure-vault-preview.png",
    colors: {
      primary: "#DAA520", // Golden treasures
      secondary: "#50C878", // Emerald gems
      accent: "#FFD700", // Pure gold
      background: "#FFF8DC", // Cornsilk
    },
    description: "Golden riches and emerald treasures beyond measure",
    atmosphere: "Opulent and rewarding",
    unlockLevel: 95,
    category: "Basement",
    isActive: false,
    isUnlocked: true, // Unlocked for testing
    canUnlock: true,
  },
]

// Helper functions
export function getRoomTheme(roomId: string): RoomTheme | undefined {
  return roomThemes.find((room) => room.id === roomId)
}

export function getActiveTheme(): RoomTheme {
  return roomThemes.find((room) => room.isActive) || roomThemes[0]
}

export function getRoomsByCategory(category: RoomTheme["category"]): RoomTheme[] {
  return roomThemes.filter((room) => room.category === category)
}

export type AppThemeName =
  | "main-hall"
  | "library"
  | "conservatory"
  | "fireside-lounge"
  | "bar"
  | "spa"
  | "gallery"
  | "ballroom"
  | "map-room"
  | "observatory"
  | "theater-room"
  | "clock-tower"
  | "war-room"
  | "artroom"
  | "alchemist-laboratory"
  | "dungeon"
  | "underground-temple"
  | "crystal-cavern"
  | "treasure-vault"
