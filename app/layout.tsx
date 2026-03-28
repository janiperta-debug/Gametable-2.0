import type React from "react"
import type { Metadata } from "next"
import { Inter, Charm, Cinzel, Marcellus, Merriweather, Cormorant_Garamond, DM_Sans, Crimson_Pro } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { I18nProvider } from "@/lib/i18n"

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

const cormorantGaramond = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  style: ["normal", "italic"],
})

const dmSans = DM_Sans({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "GameTable - Your Exclusive Gaming Manor",
  description:
    "Step into an elegant sanctuary where tabletop enthusiasts gather to discover remarkable games, forge lasting friendships, and create unforgettable gaming experiences.",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GameTable",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3d1515",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${charm.variable} ${cinzel.variable} ${marcellus.variable} ${merriweather.variable} ${cormorantGaramond.variable} ${dmSans.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/images/gametable-logo.png" />
        {/* Inline script to apply theme from localStorage before React hydrates - prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('gametable-app-theme');
                  if (theme) {
                    document.documentElement.dataset.theme = theme;
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={merriweather.className}>
        <I18nProvider>
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  )
}
