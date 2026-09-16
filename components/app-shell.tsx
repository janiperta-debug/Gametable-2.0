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

  // The active theme is owned by AppThemeProvider, which writes
  // document.documentElement.dataset.theme for the whole application.
  // Do not derive the global background from the current route: the route
  // is not the selected application theme.

  // For PWA, skip landing page and go directly to home
  const isLandingPage = pathname === "/" && !isPWA

  // Home page has its own full background, no room-environment needed
  const isHomePage = pathname === "/home"

  if (isLandingPage) {
    return <>{children}</>
  }

  // Home page - keep the single app-background layer from app/layout.tsx.
  if (isHomePage) {
    return (
      <AppThemeProvider>
        <style>{`
          .app-background {
            background: hsl(var(--surface-dark)) !important;
            background-image: none !important;
          }

          .room-environment,
          .room-environment::before,
          .room-environment::after,
          .manor-bg-pattern {
            background: transparent !important;
            background-image: none !important;
          }
        `}</style>
        <div className="min-h-screen">
          <Navigation />
          <main className="pt-16 pb-28 md:pt-0 md:pb-32">{children}</main>
        </div>
      </AppThemeProvider>
    )
  }

  // If on landing page but running as PWA, redirect to home
  if (pathname === "/" && isPWA) {
    return (
      <AppThemeProvider>
        <style>{`
          .app-background {
            background: hsl(var(--surface-dark)) !important;
            background-image: none !important;
          }

          .room-environment,
          .room-environment::before,
          .room-environment::after,
          .manor-bg-pattern {
            background: transparent !important;
            background-image: none !important;
          }
        `}</style>
        <div className="min-h-screen">
          <Navigation />
          <main className="pt-16 pb-28 md:pt-0 md:pb-32">{children}</main>
        </div>
      </AppThemeProvider>
    )
  }

  return (
    <AppThemeProvider>
      <style>{`
        .app-background {
          background: hsl(var(--surface-dark)) !important;
          background-image: none !important;
        }

        .room-environment,
        .room-environment::before,
        .room-environment::after,
        .manor-bg-pattern {
          background: transparent !important;
          background-image: none !important;
        }
      `}</style>
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-16 pb-28 md:pt-0 md:pb-32">{children}</main>
      </div>
    </AppThemeProvider>
  )
}
