"use client"

import { Bell, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navItems = ["Collection", "Discover", "Events", "Themes", "Messages", "Trophies", "Contact"]

  return (
    <header className="w-full px-6 py-4 relative">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side - Logo and Level */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="w-8 h-8 relative">
              <svg viewBox="0 0 32 32" className="w-full h-full text-yellow-400 fill-current">
                <path d="M16 2L20 8H28L22 14L24 22L16 18L8 22L10 14L4 8H12L16 2Z" />
                <circle cx="16" cy="16" r="4" className="fill-red-900" />
              </svg>
            </div>
            <span className="text-sm font-medium">Level 12</span>
          </div>
        </div>

        {/* Center - Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button key={item} className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-medium">
              {item}
            </button>
          ))}
        </nav>

        {/* Right side - Notifications, Profile, and Mobile Menu Button */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="w-5 h-5 text-yellow-400" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-300">
            <User className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-yellow-400 hover:text-yellow-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-yellow-400/20 md:hidden z-50">
          <nav className="flex flex-col p-6 gap-4">
            {navItems.map((item) => (
              <button
                key={item}
                className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-medium text-left py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
