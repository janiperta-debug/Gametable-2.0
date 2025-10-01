"use client"

import Link from "next/link"
import { User, Menu, X, Zap, LogOut, Bell } from "lucide-react"
import { useState } from "react"
import { useAppTheme } from "@/components/app-theme-provider"

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const { currentAppTheme } = useAppTheme()

  const hasUnreadNotifications = true

  const navItems = [
    { href: "/collection", label: "Collection" },
    { href: "/discover", label: "Community" }, // Renamed Discover to Community
    { href: "/events", label: "Events" },
    { href: "/themes", label: "Themes" },
    { href: "/messages", label: "Messages" },
    { href: "/trophies", label: "Trophies" },
    { href: "/contact", label: "Contact" },
  ]

  const getCrestImage = (theme: string) => {
    const crestMap: { [key: string]: string } = {
      "main-hall": "/images/mainhall-crest-original.png",
      library: "/images/library-crest.png",
      bar: "/images/bar-crest.png",
      "fireside-lounge": "/images/fireside-lounge-crest.png",
      spa: "/crests/spa-crest.png",
      conservatory: "/images/conservatory-crest.png",
      gallery: "/images/gallery-crest.png",
      artroom: "/crests/artroom-crest.png",
      ballroom: "/images/ballroom-crest.png",
      "map-room": "/images/map-room-crest.png",
      observatory: "/images/observatory-crest.png",
      "theater-room": "/images/theater-room-crest.png",
      "clock-tower": "/images/clock-tower-crest.png",
      "war-room": "/images/war-room-crest.png",
      "alchemist-laboratory": "/crests/alchemist-crest.png",
      dungeon: "/crests/dungeon-crest.png",
      "underground-temple": "/crests/temple-crest.png",
      "crystal-cavern": "/crests/crystal-crest.png",
      "treasure-vault": "/crests/treasure-crest.png",
    }
    return crestMap[theme] || crestMap["main-hall"]
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar-bg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <img
                src={getCrestImage(currentAppTheme) || "/placeholder.svg"}
                alt="GameTable Crest"
                className="w-10 h-10"
              />
            </Link>
          </div>

          {/* Center - Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm uppercase tracking-wide"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2 sm:space-x-3 bg-card/50 backdrop-blur-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-card transition-colors border border-accent-gold/20"
              >
                {/* Notification indicator */}
                <div className="relative">
                  {hasUnreadNotifications ? (
                    <Zap className="w-4 h-4 text-red-500 fill-red-500" />
                  ) : (
                    <Zap className="w-4 h-4 text-accent-gold" />
                  )}
                </div>

                {/* User avatar */}
                <div className="w-8 h-8 bg-accent-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-background" />
                </div>

                {/* User info - hidden on mobile */}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-foreground font-cinzel text-sm font-medium">JANI PERTA</span>
                  <span className="text-accent-gold text-xs">LVL 1 ♦ 30 XP</span>
                </div>

                {/* Dropdown arrow */}
                <svg
                  className={`w-4 h-4 text-accent-gold transition-transform ${isUserDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card backdrop-blur-sm rounded-lg shadow-lg border border-accent-gold/20 overflow-hidden">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-accent-gold/10 transition-colors"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <User className="w-4 h-4 text-accent-gold" />
                    <span className="text-foreground font-cinzel text-sm">Profile</span>
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-accent-gold/10 transition-colors"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <Bell className="w-4 h-4 text-accent-gold" />
                    <span className="text-foreground font-cinzel text-sm">Notifications</span>
                    {hasUnreadNotifications && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>}
                  </Link>
                  <button
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-accent-gold/10 transition-colors w-full text-left border-t border-accent-gold/20"
                    onClick={() => {
                      setIsUserDropdownOpen(false)
                      // Add logout logic here
                    }}
                  >
                    <LogOut className="w-4 h-4 text-accent-gold" />
                    <span className="text-foreground font-cinzel text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>

            <button
              className="md:hidden text-accent-gold hover:text-foreground transition-colors p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 navbar-bg backdrop-blur-sm border-t border-accent-gold/20">
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
