"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { AppThemeProvider } from "@/components/app-theme-provider"
import type { ReactNode } from "react"

// Check if running as installed PWA
function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false)
  
  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    setIsPWA(isStandalone)
  }, [])
  
  return isPWA
}

// Register service worker
function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })
    }
  }, [])
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isPWA = useIsPWA()
  
  // Register service worker
  useServiceWorker()
  
  // For PWA, skip landing page and go directly to home
  const isLandingPage = pathname === "/" && !isPWA

  if (isLandingPage) {
    return <>{children}</>
  }
  
  // If on landing page but running as PWA, redirect to home
  if (pathname === "/" && isPWA) {
    return (
      <AppThemeProvider>
        <div className="min-h-screen room-environment">
          <Navigation />
          <main className="pt-16">{children}</main>
        </div>
      </AppThemeProvider>
    )
  }

  return (
    <AppThemeProvider>
      <div className="min-h-screen room-environment">
        <Navigation />
        <main className="pt-16">{children}</main>
      </div>
    </AppThemeProvider>
  )
}
