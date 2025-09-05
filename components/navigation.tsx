"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { NotificationDropdown } from "./notification-system"

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar-bg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Level */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <img src="/images/ornate-crest.png" alt="GameTable Crest" className="w-8 h-8" />
              </Link>
              <span className="text-accent-gold font-cinzel text-sm font-medium">Level 12</span>
            </div>
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/collection"
              className="text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm"
            >
              Collection
            </Link>
            <Link
              href="/discover"
              className="text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm"
            >
              Discover
            </Link>
            <Link
              href="/events"
              className="text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm"
            >
              Events
            </Link>
            <Link
              href="/themes"
              className="text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm"
            >
              Themes
            </Link>
            <Link
              href="/messages"
              className="text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm"
            >
              Messages
            </Link>
            <Link
              href="/trophies"
              className="text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm"
            >
              Trophies
            </Link>
            <Link
              href="/contact"
              className="text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm"
            >
              Contact
            </Link>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-4">
            <NotificationDropdown />
            <Link
              href="/profile"
              className="w-8 h-8 bg-accent-gold rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <User className="w-4 h-4 text-background" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
