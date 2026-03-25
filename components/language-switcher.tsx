"use client"

import { useI18n, type Locale } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  className?: string
  variant?: "default" | "compact"
}

export function LanguageSwitcher({ className, variant = "default" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n()

  const toggleLocale = () => {
    setLocale(locale === "fi" ? "en" : "fi")
  }

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLocale}
        className={cn(
          "h-8 px-2 text-xs font-medium tracking-wide uppercase",
          "text-muted-foreground hover:text-foreground hover:bg-accent-gold/10",
          "transition-colors",
          className
        )}
      >
        {locale === "fi" ? "EN" : "FI"}
      </Button>
    )
  }

  return (
    <div className={cn("flex items-center gap-1 rounded-lg bg-surface-dark/50 p-1", className)}>
      <LocaleButton
        targetLocale="fi"
        currentLocale={locale}
        onClick={() => setLocale("fi")}
      />
      <LocaleButton
        targetLocale="en"
        currentLocale={locale}
        onClick={() => setLocale("en")}
      />
    </div>
  )
}

interface LocaleButtonProps {
  targetLocale: Locale
  currentLocale: Locale
  onClick: () => void
}

function LocaleButton({ targetLocale, currentLocale, onClick }: LocaleButtonProps) {
  const isActive = targetLocale === currentLocale
  const label = targetLocale.toUpperCase()

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-md text-xs font-medium tracking-wide transition-all duration-200",
        isActive
          ? "bg-accent-gold text-background shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-accent-gold/10"
      )}
      aria-pressed={isActive}
      aria-label={`Switch to ${targetLocale === "fi" ? "Finnish" : "English"}`}
    >
      {label}
    </button>
  )
}
