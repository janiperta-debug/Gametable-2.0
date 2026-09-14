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

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined)

interface AppThemeProviderProps {
  children: ReactNode
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const [currentAppTheme, setCurrentAppTheme] = useState<AppThemeName>(DEFAULT_THEME)
  const [isLoadedFromDB, setIsLoadedFromDB] = useState(false)
  const { user, profile } = useUser()

  const canUseTheme = (themeId: AppThemeName) => {
    const theme = getRoomTheme(themeId)
    return !!theme && isThemeUnlocked(theme, profile)
  }

  useEffect(() => {
    if (user && profile?.preferred_theme && !isLoadedFromDB) {
      const dbTheme = profile.preferred_theme as AppThemeName
      const validTheme = canUseTheme(dbTheme) ? dbTheme : DEFAULT_THEME
      setCurrentAppTheme(validTheme)
      setIsLoadedFromDB(true)
      try {
        localStorage.setItem(APP_THEME_STORAGE_KEY, validTheme)
      } catch (error) {
        console.warn("Failed to save theme to localStorage", error)
      }
    }
  }, [user, profile, isLoadedFromDB])

  useEffect(() => {
    if (!user) {
      try {
        const saved = localStorage.getItem(APP_THEME_STORAGE_KEY) as AppThemeName | null
        if (saved && canUseTheme(saved)) setCurrentAppTheme(saved)
        else setCurrentAppTheme(DEFAULT_THEME)
      } catch (error) {
        console.warn("Failed to load theme from localStorage", error)
      }
    }
  }, [user, profile])

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
    document.documentElement.dataset.theme = currentAppTheme

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
