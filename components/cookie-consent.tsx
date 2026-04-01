"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n"
import Link from "next/link"

const COOKIE_CONSENT_KEY = "gametable-cookie-consent"

export function CookieConsent() {
  const t = useTranslations()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString()
    }))
    setIsVisible(false)
  }

  const acceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }))
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6">
      <div 
        className="max-w-4xl mx-auto rounded-lg border border-accent-gold/30 shadow-2xl"
        style={{ 
          background: "linear-gradient(135deg, hsl(345, 80%, 8%) 0%, hsl(345, 80%, 12%) 100%)",
          backdropFilter: "blur(20px)"
        }}
      >
        <div className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍪</span>
              <h3 className="font-cinzel text-lg text-accent-gold">
                {t("cookies.title")}
              </h3>
            </div>
            <button 
              onClick={acceptEssential}
              className="text-foreground/50 hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
            {t("cookies.description")}{" "}
            <Link href="/privacy" className="text-accent-gold hover:underline">
              {t("cookies.privacyPolicy")}
            </Link>
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={acceptAll}
              className="theme-accent-gold font-cinzel text-sm tracking-wide"
            >
              {t("cookies.acceptAll")}
            </Button>
            <Button
              onClick={acceptEssential}
              variant="outline"
              className="border-accent-gold/30 text-accent-gold hover:bg-accent-gold/10 font-cinzel text-sm tracking-wide"
            >
              {t("cookies.essentialOnly")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
