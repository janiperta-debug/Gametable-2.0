"use client"

import { usePathname } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { AppThemeProvider } from "@/components/app-theme-provider"
import type { ReactNode } from "react"

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"

  if (isLandingPage) {
    return <>{children}</>
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
