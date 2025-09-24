"use client"

import Link from "next/link"
import { User, Bell, LogOut, ChevronDown, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  // Mock user data - in real app this would come from auth context
  const user = {
    name: "Jani Perta",
    level: 1,
    xp: 30,
    avatar: "/placeholder.svg?height=32&width=32"
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar-bg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <img src="/images/ornate-crest.png" alt="GameTable Crest" className="w-8 h-8" />
            </Link>
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

          {/* Right side - User Info Box and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* User Info Dropdown - Desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent-gold/10 transition-colors"
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 bg-accent-gold rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-background" />
                    </div>
                    
                    {/* User Info */}
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground font-cinzel">{user.name}</div>
                      <div className="text-xs text-accent-gold font-cinzel">
                        Lvl {user.level} ⚡ {user.xp} XP
                      </div>
                    </div>
                    
                    {/* Dropdown Arrow */}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-56 room-furniture">
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="flex items-center cursor-pointer">
                      <Bell className="w-4 h-4 mr-3" />
                      <span className="font-body">Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer">
                      <User className="w-4 h-4 mr-3" />
                      <span className="font-body">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem className="flex items-center cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="font-body">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-accent-gold hover:text-foreground transition-colors p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 navbar-bg backdrop-blur-sm border-t border-accent-gold/20">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile User Info */}
              <div className="flex items-center space-x-3 pb-4 border-b border-accent-gold/20">
                <div className="w-10 h-10 bg-accent-gold rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-background" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground font-cinzel">{user.name}</div>
                  <div className="text-xs text-accent-gold font-cinzel">
                    Level {user.level} ⚡ {user.xp} XP
                  </div>
                </div>
              </div>

              {/* Mobile Navigation Links */}
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

              {/* Mobile User Actions */}
              <div className="pt-4 border-t border-accent-gold/20 space-y-2">
                <Link
                  href="/notifications"
                  className="flex items-center text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Bell className="w-4 h-4 mr-3" />
                  Notifications
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center text-foreground hover:text-accent-gold transition-colors font-cinzel text-sm py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </Link>
                <button className="flex items-center text-destructive hover:text-destructive/80 transition-colors font-cinzel text-sm py-2 w-full text-left">
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}