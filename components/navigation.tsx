"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Menu, X, Zap, LogOut, Bell, Loader2, MessageCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useAppTheme } from "@/components/app-theme-provider"
import { useTranslations } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { getUnreadCount } from "@/app/actions/messages"
import { getUnreadNotificationCount } from "@/app/actions/notifications"

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const { currentAppTheme } = useAppTheme()
  const t = useTranslations()
  const router = useRouter()
  const { user, profile, loading } = useUser()

  const hasUnreadNotifications = unreadNotificationCount > 0

  // Fetch unread message and notification counts
  useEffect(() => {
    async function fetchUnreadCounts() {
      if (!user) {
        setUnreadMessageCount(0)
        setUnreadNotificationCount(0)
        return
      }
      const [messageResult, notificationResult] = await Promise.all([
        getUnreadCount(),
        getUnreadNotificationCount()
      ])
      setUnreadMessageCount(messageResult.count)
      setUnreadNotificationCount(notificationResult.count)
    }
    fetchUnreadCounts()

    // Subscribe to new messages and notifications for real-time badge updates
    if (!user) return
    
    const supabase = createClient()
    const messagesChannel = supabase
      .channel("nav-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => fetchUnreadCounts()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => fetchUnreadCounts()
      )
      .subscribe()

    const notificationsChannel = supabase
      .channel("nav-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchUnreadCounts()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchUnreadCounts()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchUnreadCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(notificationsChannel)
    }
  }, [user])
  
  // Get display name from profile, fallback to email or "Guest"
  const displayName = profile?.display_name || user?.email?.split('@')[0] || t("nav.guest")
  const userLevel = profile?.level ?? 1
  const userXp = profile?.xp ?? 0

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsUserDropdownOpen(false)
    router.push("/")
    router.refresh()
  }

  const navItems = [
    { href: "/collection", label: t("nav.collection") },
    { href: "/discover", label: t("nav.community") },
    { href: "/marketplace", label: t("nav.marketplace") },
    { href: "/events", label: t("nav.events") },
    { href: "/themes", label: t("nav.themes") },
    { href: "/messages", label: t("nav.messages"), badge: unreadMessageCount },
    { href: "/trophies", label: t("nav.trophies") },
    { href: "/contact", label: t("nav.contact") },
  ] as { href: string; label: string; badge?: number }[]

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
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 h-16">
          {/* Crest - Left Side */}
          <Link href="/home" className="hover:opacity-80 transition-opacity flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getCrestImage(currentAppTheme)}
              alt="GameTable Crest"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
          </Link>

          {/* Center - Desktop Navigation Links */}
          <div className="hidden md:flex items-center justify-center gap-3 lg:gap-5 xl:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-foreground hover:text-accent-gold transition-colors font-cinzel text-[11px] lg:text-xs uppercase tracking-wide whitespace-nowrap"
              >
                {item.label}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1.5 lg:gap-2 bg-card/50 backdrop-blur-sm px-2 py-1 rounded-lg hover:bg-card transition-colors border border-accent-gold/20"
              >
                {/* Notification indicator */}
                {hasUnreadNotifications ? (
                  <Zap className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-red-500 fill-red-500" />
                ) : (
                  <Zap className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-accent-gold" />
                )}

                {/* User avatar */}
                <div className="w-5 h-5 lg:w-6 lg:h-6 bg-accent-gold rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-background" />
                </div>

                {/* User info - stacked on medium, inline on large */}
                <div className="hidden md:flex flex-col lg:flex-row lg:items-center lg:gap-2">
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-accent-gold" />
                  ) : (
                    <>
                      <span className="text-foreground font-cinzel text-[10px] lg:text-xs font-medium whitespace-nowrap leading-tight uppercase">
                        {displayName}
                      </span>
                      <span className="text-accent-gold text-[9px] lg:text-xs whitespace-nowrap leading-tight">
                        LVL {userLevel} ♦ {userXp} XP
                      </span>
                    </>
                  )}
                </div>

                {/* Dropdown arrow */}
                <svg
                  className={`w-2.5 h-2.5 lg:w-3 lg:h-3 text-accent-gold transition-transform ${isUserDropdownOpen ? "rotate-180" : ""}`}
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
                    <span className="text-foreground font-cinzel text-sm">{t("nav.profile")}</span>
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-accent-gold/10 transition-colors"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <Bell className="w-4 h-4 text-accent-gold" />
                    <span className="text-foreground font-cinzel text-sm">{t("nav.notifications")}</span>
                    {hasUnreadNotifications && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>}
                  </Link>
                  <button
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-accent-gold/10 transition-colors w-full text-left border-t border-accent-gold/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 text-accent-gold" />
                    <span className="text-foreground font-cinzel text-sm">{t("nav.logout")}</span>
                  </button>
                </div>
              )}
            </div>

            <button
              className="md:hidden text-accent-gold hover:text-foreground transition-colors p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
