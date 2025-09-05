"use client"

import Link from "next/link"
import { User, Menu, X } from "lucide-react"
import { NotificationDropdown } from "./notification-system"
import { useState } from "react"

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { href: "/collection", label: "Collection" },
    { href: "/discover", label: "Discover" },
    { href: "/events", label: "Events" },
    { href: "/themes", label: "Themes" },
    { href: "/messages", label: "Messages" },
    { href: "/trophies", label: "Trophies" },
    { href: "/contact", label: "Contact" },
  ]

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

          {/* Center - Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side - Notifications, Profile, and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <NotificationDropdown />
            <Link
              href="/profile"
              className="w-8 h-8 bg-accent-gold rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <User className="w-4 h-4 text-background" />
            </Link>

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
