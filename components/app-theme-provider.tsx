"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Define all 19 manor theme names
export type AppThemeName =
  | "main-hall"
  | "library"
  | "conservatory"
  | "fireside-lounge"
  | "bar"
  | "garden"
  | "gallery"
  | "balcony"
  | "ballroom"
  | "maproom"
  | "observatory"
  | "theater-room"
  | "clock-tower"
  | "war-room"
  | "alchemist-laboratory"
  | "dungeon"
  | "underground-temple"
  | "crystal-cavern"
  | "treasure-vault"

export interface ManorTheme {
  id: AppThemeName
  name: string
  description: string
  floor: "Ground Floor" | "Second Floor" | "Basement"
  colors: {
    primary: string
    secondary: string
    accent?: string
  }
  atmosphere: string
  imageUrl?: string
}

export const MANOR_THEMES: ManorTheme[] = [
  // Ground Floor
  {
    id: "main-hall",
    name: "Main Hall",
    description: "Grand burgundy walls adorned with golden accents and marble columns",
    floor: "Ground Floor",
    colors: {
      primary: "Burgundy",
      secondary: "Gold",
      accent: "Cream Marble",
    },
    atmosphere: "Majestic and welcoming, the heart of the manor",
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Main%20hall%2001.jpg-DpsYcUHFaTwvTp9wXy5kieQgoDHKMM.jpeg",
  },
  {
    id: "library",
    name: "Library",
    description: "Rich deep brown shelves filled with ancient tomes and golden reading lamps",
    floor: "Ground Floor",
    colors: {
      primary: "Deep Brown",
      secondary: "Gold",
      accent: "Warm Cream",
    },
    atmosphere: "Scholarly and mysterious, filled with knowledge",
  },
  {
    id: "conservatory",
    name: "Conservatory",
    description: "Forest green botanical paradise with sunlight streaming through glass",
    floor: "Ground Floor",
    colors: {
      primary: "Forest Green",
      secondary: "Sunlight",
      accent: "Natural Light",
    },
    atmosphere: "Peaceful and organic, nature's sanctuary",
  },
  {
    id: "fireside-lounge",
    name: "Fireside Lounge",
    description: "Warm terracotta walls with golden firelight and comfortable seating",
    floor: "Ground Floor",
    colors: {
      primary: "Terracotta",
      secondary: "Gold",
      accent: "Flame Orange",
    },
    atmosphere: "Cozy and intimate, perfect for conversations",
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fireside%20Lounge%2001.jpg-M3u72S7v7OEudxT8hqP812tt9gR2Jb.jpeg",
  },
  {
    id: "bar",
    name: "Bar",
    description: "Sophisticated amber interior with brass fixtures and polished surfaces",
    floor: "Ground Floor",
    colors: {
      primary: "Amber",
      secondary: "Brass",
      accent: "Copper",
    },
    atmosphere: "Elegant and refined, for distinguished guests",
  },
  {
    id: "garden",
    name: "Garden",
    description: "Sage green foliage with golden sunlight and natural beauty",
    floor: "Ground Floor",
    colors: {
      primary: "Sage Green",
      secondary: "Gold",
      accent: "Natural Stone",
    },
    atmosphere: "Fresh and vibrant, outdoor elegance",
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Garden%2002.jpg-XxukuZGkzYw89WbYIH9btWaF2ddlvH.jpeg",
  },
  {
    id: "gallery",
    name: "Gallery",
    description: "Royal navy walls showcasing golden-framed masterpieces",
    floor: "Ground Floor",
    colors: {
      primary: "Royal Navy",
      secondary: "Gold",
      accent: "Ivory",
    },
    atmosphere: "Artistic and cultured, displaying fine art",
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gallery%2001.jpg-6ENDBJTG0rOy3yXPcrdwoNETWilXcm.jpeg",
  },

  // Second Floor
  {
    id: "balcony",
    name: "Balcony",
    description: "Cream stonework overlooking sunset vistas with warm golden hour lighting",
    floor: "Second Floor",
    colors: {
      primary: "Cream",
      secondary: "Sunset Orange",
      accent: "Rose Gold",
    },
    atmosphere: "Romantic and airy, with panoramic views",
  },
  {
    id: "ballroom",
    name: "Ballroom",
    description: "Golden grandeur with crystal white accents and sparkling chandeliers",
    floor: "Second Floor",
    colors: {
      primary: "Gold",
      secondary: "Crystal White",
      accent: "Champagne",
    },
    atmosphere: "Grand and ceremonial, for elegant gatherings",
  },
  {
    id: "maproom",
    name: "Map Room",
    description: "Sepia-toned maps and charts with gleaming brass instruments",
    floor: "Second Floor",
    colors: {
      primary: "Sepia",
      secondary: "Brass",
      accent: "Parchment",
    },
    atmosphere: "Adventurous and scholarly, for planning expeditions",
  },
  {
    id: "observatory",
    name: "Observatory",
    description: "Cosmic blue dome with silver telescope and starlight ambiance",
    floor: "Second Floor",
    colors: {
      primary: "Cosmic Blue",
      secondary: "Silver",
      accent: "Starlight",
    },
    atmosphere: "Mysterious and celestial, reaching for the stars",
  },
  {
    id: "theater-room",
    name: "Theater Room",
    description: "Rich velvet red seating with golden stage lighting and dramatic flair",
    floor: "Second Floor",
    colors: {
      primary: "Velvet Red",
      secondary: "Gold",
      accent: "Deep Crimson",
    },
    atmosphere: "Dramatic and entertaining, for grand performances",
  },
  {
    id: "clock-tower",
    name: "Clock Tower",
    description: "Brass clockwork mechanisms with bronze gears and timepiece elegance",
    floor: "Second Floor",
    colors: {
      primary: "Brass",
      secondary: "Bronze",
      accent: "Copper",
    },
    atmosphere: "Mechanical and precise, marking the passage of time",
  },
  {
    id: "war-room",
    name: "War Room",
    description: "Military green strategy tables with bronze instruments and tactical lighting",
    floor: "Second Floor",
    colors: {
      primary: "Military Green",
      secondary: "Bronze",
      accent: "Olive",
    },
    atmosphere: "Strategic and focused, for important decisions",
  },

  // Basement
  {
    id: "alchemist-laboratory",
    name: "Alchemist Laboratory",
    description: "Emerald green bottles and azure blue mystical lighting with bubbling experiments",
    floor: "Basement",
    colors: {
      primary: "Emerald",
      secondary: "Azure Blue",
      accent: "Mystical Teal",
    },
    atmosphere: "Magical and experimental, where science meets mystery",
  },
  {
    id: "dungeon",
    name: "Dungeon",
    description: "Honey-colored stone walls with bronze torch brackets and medieval charm",
    floor: "Basement",
    colors: {
      primary: "Honey Stone",
      secondary: "Bronze",
      accent: "Torch Flame",
    },
    atmosphere: "Historic and atmospheric, echoing with ancient stories",
  },
  {
    id: "underground-temple",
    name: "Underground Temple",
    description: "Sacred stone gray architecture with mystical teal illumination",
    floor: "Basement",
    colors: {
      primary: "Stone Gray",
      secondary: "Mystical Teal",
      accent: "Sacred Blue",
    },
    atmosphere: "Spiritual and reverent, a place of ancient worship",
  },
  {
    id: "crystal-cavern",
    name: "Crystal Cavern",
    description: "Rose quartz formations with amethyst lighting and crystalline beauty",
    floor: "Basement",
    colors: {
      primary: "Rose Quartz",
      secondary: "Amethyst",
      accent: "Crystal Clear",
    },
    atmosphere: "Ethereal and magical, sparkling with natural wonder",
  },
  {
    id: "treasure-vault",
    name: "Treasure Vault",
    description: "Golden walls lined with emerald accents and precious gem lighting",
    floor: "Basement",
    colors: {
      primary: "Gold",
      secondary: "Emerald",
      accent: "Precious Gems",
    },
    atmosphere: "Luxurious and secure, housing the manor's greatest treasures",
  },
]

interface AppThemeContextType {
  currentAppTheme: AppThemeName
  setAppTheme: (theme: AppThemeName) => void
  getThemeData: (themeId: AppThemeName) => ManorTheme | undefined
  allThemes: ManorTheme[]
}

const APP_THEME_STORAGE_KEY = "gametable-app-theme"
const DEFAULT_THEME: AppThemeName = "main-hall"

// Create the context with a default value
const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined)

interface AppThemeProviderProps {
  children: ReactNode
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  // Load theme from localStorage or use default
  const [currentAppTheme, setCurrentAppTheme] = useState<AppThemeName>(() => {
    try {
      const saved = localStorage.getItem(APP_THEME_STORAGE_KEY)
      if (saved && MANOR_THEMES.some((theme) => theme.id === saved)) {
        return saved as AppThemeName
      }
    } catch (error) {
      console.warn("Failed to load theme from localStorage", error)
    }
    return DEFAULT_THEME
  })

  const setAppTheme = (theme: AppThemeName) => {
    setCurrentAppTheme(theme)
  }

  const getThemeData = (themeId: AppThemeName) => {
    return MANOR_THEMES.find((theme) => theme.id === themeId)
  }

  useEffect(() => {
    // Apply the theme to the document's data-theme attribute
    document.documentElement.dataset.theme = currentAppTheme

    // Apply background pattern for main-hall theme
    if (currentAppTheme === "main-hall") {
      document.body.classList.add("manor-bg-pattern")
    } else {
      document.body.classList.remove("manor-bg-pattern")
    }

    // Save the theme to localStorage
    try {
      localStorage.setItem(APP_THEME_STORAGE_KEY, currentAppTheme)
    } catch (error) {
      console.warn("Failed to save theme to localStorage", error)
    }
  }, [currentAppTheme])

  return (
    <AppThemeContext.Provider
      value={{
        currentAppTheme,
        setAppTheme,
        getThemeData,
        allThemes: MANOR_THEMES,
      }}
    >
      {children}
    </AppThemeContext.Provider>
  )
}

// Custom hook to use the AppThemeContext
export const useAppTheme = (): AppThemeContextType => {
  const context = useContext(AppThemeContext)
  if (context === undefined) {
    throw new Error("useAppTheme must be used within an AppThemeProvider")
  }
  return context
}
