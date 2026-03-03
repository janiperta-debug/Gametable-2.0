"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import fiTranslations from "./locales/fi.json"
import enTranslations from "./locales/en.json"

export type Locale = "fi" | "en"

type TranslationValue = string | { [key: string]: TranslationValue }
type Translations = { [key: string]: TranslationValue }

const translations: Record<Locale, Translations> = {
  fi: fiTranslations,
  en: enTranslations,
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

const STORAGE_KEY = "gametable-locale"
const DEFAULT_LOCALE: Locale = "fi"

function getNestedValue(obj: Translations, path: string): string | undefined {
  const keys = path.split(".")
  let current: TranslationValue | undefined = obj

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as { [key: string]: TranslationValue })[key]
    } else {
      return undefined
    }
  }

  return typeof current === "string" ? current : undefined
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize locale from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (stored === "fi" || stored === "en")) {
      setLocaleState(stored as Locale)
    }
    setIsInitialized(true)
  }, [])

  // Update localStorage and html lang attribute when locale changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, locale)
      document.documentElement.lang = locale
    }
  }, [locale, isInitialized])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const translation = getNestedValue(translations[locale], key)

      if (!translation) {
        // Fallback to English if key not found in current locale
        const fallback = getNestedValue(translations.en, key)
        if (!fallback) {
          console.warn(`[i18n] Missing translation for key: ${key}`)
          return key
        }
        return interpolate(fallback, params)
      }

      return interpolate(translation, params)
    },
    [locale]
  )

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text

  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key]?.toString() ?? `{{${key}}}`
  })
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

export function useTranslation() {
  const { t, locale } = useI18n()
  return { t, locale }
}
