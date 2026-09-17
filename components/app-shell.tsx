"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { AppThemeProvider } from "@/components/app-theme-provider"
import type { ReactNode } from "react"

function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    setIsPWA(isStandalone)
  }, [])

  return isPWA
}

function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service Worker registration failed:", error)
      })
    }
  }, [])
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isPWA = useIsPWA()
  useServiceWorker()

  const isLandingPage = pathname === "/" && !isPWA

  if (isLandingPage) {
    return <>{children}</>
  }

  return (
    <AppThemeProvider>
      <style>{`
        html,
        body,
        .app-background {
          background: var(--app-background, #d0bda0) !important;
          background-color: var(--app-background, #d0bda0) !important;
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
        <main className="pb-28 md:pb-32">{children}</main>
      </div>
    </AppThemeProvider>
  )
}
