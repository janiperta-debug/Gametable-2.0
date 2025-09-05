import type React from "react"
import type { Metadata } from "next"
import { Inter, Charm, Cinzel, Marcellus, Merriweather } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { AppThemeProvider } from "@/components/app-theme-provider"

const inter = Inter({ subsets: ["latin"] })

const charm = Charm({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-charm",
})

const cinzel = Cinzel({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-cinzel",
})

const marcellus = Marcellus({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-marcellus",
})

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-merriweather",
})

export const metadata: Metadata = {
  title: "GameTable - Your Exclusive Gaming Manor",
  description:
    "Step into an elegant sanctuary where tabletop enthusiasts gather to discover remarkable games, forge lasting friendships, and create unforgettable gaming experiences.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${charm.variable} ${cinzel.variable} ${marcellus.variable} ${merriweather.variable}`}
    >
      <body className={inter.className}>
        <AppThemeProvider>
          <div className="min-h-screen room-environment">
            <Navigation />
            <main>{children}</main>
          </div>
        </AppThemeProvider>
      </body>
    </html>
  )
}
