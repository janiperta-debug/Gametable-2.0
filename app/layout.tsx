import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import "./theme-background.css"
import "./archive-typography.css"
import "./manual-entry.css"
import { AppShell } from "@/components/app-shell"
import { I18nProvider } from "@/lib/i18n"

export const metadata: Metadata = {
  title: "GameTable - Your Exclusive Gaming Manor",
  description:
    "Step into an elegant sanctuary where tabletop enthusiasts gather to discover remarkable games, forge lasting friendships, and create unforgettable gaming experiences.",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
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
  viewportFit: "cover",
  themeColor: "#120d09",
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

    >
      <head>
        <link rel="apple-touch-icon" href="/images/gametable-logo.png" />
        {/* Apply the persisted theme immediately; Main Hall is the mandatory default. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('gametable-app-theme');
                  var theme = savedTheme || 'main-hall';
                  document.documentElement.dataset.theme = theme;
                } catch (e) {
                  document.documentElement.dataset.theme = 'main-hall';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-body">
        <div className="app-background min-h-screen">
          <I18nProvider>
            <AppShell>{children}</AppShell>
          </I18nProvider>
        </div>
      </body>
    </html>
  )
}
