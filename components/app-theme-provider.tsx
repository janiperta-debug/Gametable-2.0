"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/useUser"
import { roomThemes, getRoomTheme, type RoomTheme, type AppThemeName } from "@/lib/room-themes"
import { isThemeUnlocked } from "@/lib/theme-entitlements"

export type { AppThemeName }
export type ManorTheme = RoomTheme
export const MANOR_THEMES = roomThemes

interface AppThemeContextType {
  currentAppTheme: AppThemeName
  setAppTheme: (theme: AppThemeName) => Promise<void>
  getThemeData: (themeId: AppThemeName) => ManorTheme | undefined
  allThemes: ManorTheme[]
  isThemeUnlocked: (themeId: AppThemeName) => boolean
}

const APP_THEME_STORAGE_KEY = "gametable-app-theme"
const DEFAULT_THEME: AppThemeName = "main-hall"

const getStoredTheme = (): AppThemeName => {
  if (typeof window === "undefined") return DEFAULT_THEME

  try {
    const saved = localStorage.getItem(APP_THEME_STORAGE_KEY) as AppThemeName | null
    return saved && getRoomTheme(saved) ? saved : DEFAULT_THEME
  } catch (error) {
    console.warn("Failed to load theme from localStorage", error)
    return DEFAULT_THEME
  }
}

const darkenHex = (hex: string, factor = 0.84): string => {
  const normalized = hex.replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return hex

  const channels = [0, 2, 4].map((offset) =>
    Math.max(0, Math.min(255, Math.round(Number.parseInt(normalized.slice(offset, offset + 2), 16) * factor)))
  )

  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined)

interface AppThemeProviderProps {
  children: ReactNode
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const [currentAppTheme, setCurrentAppTheme] = useState<AppThemeName>(getStoredTheme)
  const [isLoadedFromDB, setIsLoadedFromDB] = useState(false)
  const { user, profile } = useUser()

  const canUseTheme = (themeId: AppThemeName) => {
    const theme = getRoomTheme(themeId)
    return !!theme && isThemeUnlocked(theme, profile)
  }

  useEffect(() => {
    if (!user || isLoadedFromDB || !profile) return

    const dbTheme = profile.preferred_theme as AppThemeName | null
    const validTheme = dbTheme && canUseTheme(dbTheme) ? dbTheme : getStoredTheme()
    const resolvedTheme = canUseTheme(validTheme) ? validTheme : DEFAULT_THEME

    setCurrentAppTheme(resolvedTheme)
    setIsLoadedFromDB(true)

    try {
      localStorage.setItem(APP_THEME_STORAGE_KEY, resolvedTheme)
    } catch (error) {
      console.warn("Failed to save theme to localStorage", error)
    }
  }, [user, profile, isLoadedFromDB])

  useEffect(() => {
    if (user) return
    setCurrentAppTheme(getStoredTheme())
  }, [user])

  const setAppTheme = async (theme: AppThemeName) => {
    if (!canUseTheme(theme)) return

    setCurrentAppTheme(theme)

    try {
      localStorage.setItem(APP_THEME_STORAGE_KEY, theme)
    } catch (error) {
      console.warn("Failed to save theme to localStorage", error)
    }

    if (user) {
      const supabase = createClient()
      await supabase
        .from("profiles")
        .update({ preferred_theme: theme })
        .eq("id", user.id)
    }
  }

  useEffect(() => {
    const theme = getRoomTheme(currentAppTheme) ?? getRoomTheme(DEFAULT_THEME)
    const themeFill = theme?.colors.background ?? "#F5F5DC"
    const appBackground = darkenHex(themeFill)

    document.documentElement.dataset.theme = currentAppTheme
    document.documentElement.style.setProperty("--app-theme-fill", themeFill)
    document.documentElement.style.setProperty("--app-background", appBackground)

    // Publish the resolved colour directly as well. This prevents legacy CSS
    // rules that set html/body to transparent, white, or surface-dark from
    // breaking the theme-derived canvas.
    document.documentElement.style.backgroundColor = appBackground
    document.body.style.backgroundColor = appBackground

    if (currentAppTheme === "main-hall") document.body.classList.add("manor-bg-pattern")
    else document.body.classList.remove("manor-bg-pattern")
  }, [currentAppTheme])

  return (
    <AppThemeContext.Provider
      value={{
        currentAppTheme,
        setAppTheme,
        getThemeData: getRoomTheme,
        allThemes: MANOR_THEMES,
        isThemeUnlocked: (themeId) => canUseTheme(themeId),
      }}
    >
      {children}
    </AppThemeContext.Provider>
  )
}

export const useAppTheme = (): AppThemeContextType => {
  const context = useContext(AppThemeContext)
  if (context === undefined) throw new Error("useAppTheme must be used within an AppThemeProvider")
  return context
}
