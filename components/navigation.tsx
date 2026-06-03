"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { User, Menu, X, Zap, LogOut, Bell, Loader2, Award, MessageCircle, Settings, Bookmark, Home, ShoppingBag, Mail, Archive, Users, Calendar, DoorOpen, Trophy, Phone } from "lucide-react"
import { useState, useEffect } from "react"
import { useAppTheme } from "@/components/app-theme-provider"
import { useTranslations } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { getUnreadCount } from "@/app/actions/messages"
import { getUnreadNotificationCount } from "@/app/actions/notifications"
import { xpProgressPercent } from "@/lib/xp-utils"

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isCrestMenuOpen, setIsCrestMenuOpen] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const { currentAppTheme } = useAppTheme()
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
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

  // Close crest menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isCrestMenuOpen && !(e.target as Element).closest('.crest-menu-container')) {
        setIsCrestMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isCrestMenuOpen])
  
  // Get display name from profile, fallback to email or "Guest"
  const displayName = profile?.display_name || user?.email?.split('@')[0] || t("nav.guest")
  const userLevel = profile?.level ?? 1
  const userXp = profile?.xp ?? 0

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Clear theme cache on logout so next user gets default
    try {
      localStorage.removeItem("gametable-app-theme")
    } catch (e) {}
    setIsUserDropdownOpen(false)
    setIsCrestMenuOpen(false)
    router.push("/")
    router.refresh()
  }

  // Desktop bottom nav items (split into left and right groups, crest in middle)
  const desktopNavItemsLeft = [
    { href: "/collection", label: t("nav.collection"), iconImg: "/images/nav-icons/collection.png" },
    { href: "/discover", label: t("nav.community"), iconImg: "/images/nav-icons/community.png" },
    { href: "/events", label: t("nav.events"), iconImg: "/images/nav-icons/events.png" },
    { href: "/marketplace", label: t("nav.marketplace"), iconImg: "/images/nav-icons/marketplace.png" },
  ]
  
  const desktopNavItemsRight = [
    { href: "/themes", label: t("nav.manor"), iconImg: "/images/nav-icons/manor.png" },
    { href: "/messages", label: t("nav.messages"), iconImg: "/images/nav-icons/messages.png" },
    { href: "/trophies", label: t("nav.trophies"), iconImg: "/images/nav-icons/trophies.png" },
    { href: "/contact", label: t("nav.contact"), iconImg: "/images/nav-icons/contact.png" },
  ]

  // Mobile bottom nav items (4 main items)
  const mobileNavItems = [
    { href: "/collection", label: t("nav.collection"), icon: "/images/icons/chest.jpeg" },
    { href: "/discover", label: t("nav.community"), icon: "/images/icons/community.jpeg" },
    { href: "/events", label: t("nav.events"), icon: "/images/icons/calendar.jpeg" },
    { href: "/themes", label: t("nav.themes"), icon: "/images/icons/door.jpeg" },
  ]

  // Crest menu items (shown when crest is tapped on mobile)
  const crestMenuItems = [
    { href: "/home", label: t("nav.home"), icon: Home },
    { href: "/marketplace", label: t("nav.marketplace"), icon: ShoppingBag },
    { href: "/messages", label: t("nav.messages"), icon: MessageCircle, badge: unreadMessageCount },
    { href: "/trophies", label: t("nav.trophies"), icon: Award },
    { href: "/contact", label: t("nav.contact"), icon: Mail },
  ]

  const getCrestImage = (theme: string) => {
    const crestMap: { [key: string]: string } = {
      "main-hall": "/images/mainhall-crest-original.png",
      library: "/images/crests/library-crest.png",
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

  // Get nav button frame images for current theme
  const getNavButtonFrame = (theme: string) => {
    const frameMap: { [key: string]: string } = {
      "main-hall": "/images/nav-frames/main-hall-button.png",
      // Add more themes here as they become available
    }
    return frameMap[theme] || frameMap["main-hall"]
  }

  const getNavButtonRoundFrame = (theme: string) => {
    const frameMap: { [key: string]: string } = {
      "main-hall": "/images/nav-frames/main-hall-button-round.png",
      // Add more themes here as they become available
    }
    return frameMap[theme] || frameMap["main-hall"]
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          DESKTOP NAVIGATION - TOP BAR (right side only, left is EMPTY)
          ═══════════════════════════════════════════════════════ */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-16 pointer-events-auto">
            {/* Right side items: XP Progress, Notifications, Language, Profile */}
            <div className="flex items-center gap-3 lg:gap-4">
              {/* XP Progress Badge */}
              {user && !loading && (
                <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-accent-gold/20">
                  <div className="w-8 h-8 rounded-full bg-accent-gold/20 border-2 border-accent-gold flex items-center justify-center">
                    <span className="text-accent-gold font-cinzel text-sm font-bold">{userLevel}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-xs font-cinzel uppercase tracking-wide">Lvl {userLevel}</span>
                    <div className="w-20 h-1.5 bg-background/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-gold rounded-full transition-all"
                        style={{ width: `${xpProgressPercent(userXp, userLevel)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Bell */}
              <Link
                href="/notifications"
                className="relative p-2 hover:bg-card/50 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-accent-gold" />
                {hasUnreadNotifications && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </Link>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Profile Avatar with Dropdown */}
              {!user && !loading ? (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 lg:gap-2 bg-accent-gold text-background px-3 py-1.5 rounded-lg hover:bg-accent-gold/90 transition-colors font-cinzel text-xs uppercase tracking-wide"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("nav.login")}</span>
                </Link>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-card/50 transition-colors"
                  >
                    {/* User avatar */}
                    <div className="w-10 h-10 bg-accent-gold/20 border-2 border-accent-gold rounded-full flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-accent-gold" />
                      )}
                    </div>
                    {/* Dropdown arrow */}
                    <svg
                      className={`w-3 h-3 text-accent-gold transition-transform ${isUserDropdownOpen ? "rotate-180" : ""}`}
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
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          DESKTOP NAVIGATION - BOTTOM BAR (4 buttons + crest + 4 buttons)
          ═══════════════════════════════════════════════════════ */}
      <nav className="hidden md:block fixed bottom-2 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-[1920px] mx-auto px-0">
          <div className="flex items-center justify-center gap-0 -space-x-6 lg:-space-x-8 pointer-events-auto">
            {/* Left 4 buttons */}
            {desktopNavItemsLeft.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-center w-[230px] h-[95px] lg:w-[260px] lg:h-[106px] transition-all hover:scale-105 ${
                  isActive(item.href) ? "brightness-125" : ""
                }`}
              >
                <img 
                  src={getNavButtonFrame(currentAppTheme)} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <span className="relative z-10 font-cinzel text-[11px] lg:text-sm uppercase tracking-wide text-center text-accent-gold font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {item.label}
                </span>
              </Link>
            ))}

            {/* Center crest button - home */}
            <Link
              href="/home"
              className="relative flex items-center justify-center w-[142px] h-[142px] lg:w-[165px] lg:h-[165px] transition-all hover:scale-105"
            >
              <img 
                src={getNavButtonRoundFrame(currentAppTheme)} 
                alt="" 
                className="absolute inset-0 w-full h-full object-contain"
              />
              <img
                src={getCrestImage(currentAppTheme)}
                alt="Home"
                className="relative z-10 w-20 h-20 lg:w-24 lg:h-24 object-contain"
              />
            </Link>

            {/* Right 4 buttons */}
            {desktopNavItemsRight.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-center w-[230px] h-[95px] lg:w-[260px] lg:h-[106px] transition-all hover:scale-105 ${
                  isActive(item.href) ? "brightness-125" : ""
                }`}
              >
                <img 
                  src={getNavButtonFrame(currentAppTheme)} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <span className="relative z-10 font-cinzel text-[11px] lg:text-sm uppercase tracking-wide text-center text-accent-gold font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          MOBILE NAVIGATION - TOP BAR (Bell & Profile)
          ═══════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 pt-3 pb-2 flex items-center justify-between pointer-events-none">
        {/* Notifications Bell with decorative frame */}
        <Link
          href="/notifications"
          className="relative pointer-events-auto w-14 h-14 flex items-center justify-center"
        >
          {/* Decorative frame */}
          <img
            src="/images/icons/avatar-frame.jpeg"
            alt=""
            className="absolute inset-0 w-14 h-14 object-contain"
          />
          {/* Bell icon */}
          <img
            src="/images/icons/bell.jpeg"
            alt=""
            className="w-9 h-9 object-contain z-10"
          />
          {hasUnreadNotifications && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold z-20">
              {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
            </span>
          )}
        </Link>

        {/* Right side: Language Switcher + Profile Avatar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* Profile Avatar with decorative frame */}
          <Link
            href="/profile"
            className="relative w-14 h-14 flex items-center justify-center"
          >
            {/* Decorative frame */}
            <img
              src="/images/icons/avatar-frame.jpeg"
              alt=""
              className="absolute inset-0 w-14 h-14 object-contain"
            />
            {/* User avatar inside frame */}
            <div className="w-9 h-9 rounded-full bg-accent-gold/20 flex items-center justify-center overflow-hidden z-10">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-accent-gold" />
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MOBILE NAVIGATION - BOTTOM BAR
          ═══════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Floating Center Crest - Opens Menu (positioned above the nav bar) */}
        <div className="crest-menu-container absolute -top-8 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsCrestMenuOpen(!isCrestMenuOpen)
            }}
            className={`relative w-16 h-16 rounded-full border-2 border-yellow-600 shadow-lg shadow-black/50 flex items-center justify-center bg-[#1a0808] ${
              isCrestMenuOpen ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-[#1a0808]" : ""
            }`}
          >
            {/* Decorative frame around crest */}
            <img
              src="/images/icons/avatar-frame.jpeg"
              alt=""
              className="absolute inset-0 w-16 h-16 object-contain"
            />
            <img
              src={getCrestImage(currentAppTheme)}
              alt="Menu"
              className="w-11 h-11 object-contain relative z-10"
            />
          </button>

          {/* Crest popup menu - more solid background */}
          {isCrestMenuOpen && (
            <div 
              className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 rounded-xl shadow-2xl border border-accent-gold/30 overflow-hidden"
              style={{ 
                background: "linear-gradient(to bottom, rgba(61,21,21,0.98), rgba(26,8,8,0.99))"
              }}
            >
              {crestMenuItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-accent-gold/10 transition-colors ${
                    index !== crestMenuItems.length - 1 ? "border-b border-accent-gold/10" : ""
                  }`}
                  onClick={() => setIsCrestMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-accent-gold" />
                  <div className="flex-1">
                    <span className="text-foreground font-cinzel text-sm uppercase tracking-wide">
                      {item.label}
                    </span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              ))}
              
              {/* Logout button */}
              {user && (
                <button
                  className="flex items-center gap-4 px-5 py-4 hover:bg-accent-gold/10 transition-colors w-full text-left border-t border-accent-gold/20"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 text-accent-gold" />
                  <span className="text-foreground font-cinzel text-sm uppercase tracking-wide">
                    {t("nav.logout")}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* The actual nav bar */}
        <nav className="navbar-bg backdrop-blur-sm border-t border-accent-gold/20 safe-area-bottom">
          <div className="flex items-end justify-around px-2 pt-2 pb-3">
            {/* First two nav items */}
            {mobileNavItems.slice(0, 2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 min-w-[70px] py-1 ${
                  isActive(item.href) ? "opacity-100" : "opacity-70"
                }`}
              >
                <img
                  src={item.icon}
                  alt=""
                  className="w-14 h-14 object-contain"
                />
                <span className={`font-cinzel text-[10px] uppercase tracking-wide ${
                  isActive(item.href) ? "text-accent-gold" : "text-foreground/70"
                }`}>
                  {item.label}
                </span>
              </Link>
            ))}

            {/* Spacer for floating crest */}
            <div className="min-w-[80px]" />

            {/* Last two nav items */}
            {mobileNavItems.slice(2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 min-w-[70px] py-1 ${
                  isActive(item.href) ? "opacity-100" : "opacity-70"
                }`}
              >
                <img
                  src={item.icon}
                  alt=""
                  className="w-14 h-14 object-contain"
                />
                <span className={`font-cinzel text-[10px] uppercase tracking-wide ${
                  isActive(item.href) ? "text-accent-gold" : "text-foreground/70"
                }`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  )
}
