"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { User, Menu, X, Zap, LogOut, Bell, Loader2, Award, MessageCircle, Settings, Bookmark, Home, ShoppingBag, Mail, Archive, Users, Calendar, DoorOpen, Trophy, Phone } from "lucide-react"
import { useState, useEffect } from "react"
import { useAppTheme } from "@/components/app-theme-provider"
import { useTranslations } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ArchiveFrame } from "@/components/archive-frame"
import { ArchiveAvatarFrame } from "@/components/archive-avatar-frame"
import { NAV_ICONS, NAV_ICON_IMAGES, MOBILE_NAV_ROUTES, type MobileNavRoute } from "@/components/nav-icons"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { getUnreadCount } from "@/app/actions/messages"
import { getUnreadNotificationCount } from "@/app/actions/notifications"
import { xpProgressPercent } from "@/lib/xp-utils"

/** Mobile bottom-bar button: square Archive frame wrapping an SVG glyph (no label). */
function MobileNavButton({ item, active }: { item: { href: string; label: string }; active: boolean }) {
  const Icon = NAV_ICONS[item.href]
  const image = NAV_ICON_IMAGES[item.href]
  if (image) {
    return <Link href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} className="transition-transform hover:scale-105 active:scale-100"><img src={image || "/placeholder.svg"} alt="" className={`h-16 w-16 object-contain -translate-y-3 scale-110 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] ${active ? "brightness-125" : "brightness-95"}`} /></Link>
  }
  return <Link href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} className="transition-transform hover:scale-105 active:scale-100"><ArchiveFrame weight="thin" cornerSize="sm" className={`rounded-xl ${active ? "brightness-125" : "brightness-95"}`}><div className={`flex h-12 w-12 items-center justify-center ${active ? "text-accent-gold" : "text-accent-gold/85"}`}>{Icon && <Icon className="h-8 w-8" />}</div></ArchiveFrame></Link>
}

function DesktopNavButton({ item, active }: { item: { href: string; label: string }; active: boolean }) {
  const image = NAV_ICON_IMAGES[item.href]
  return <Link href={item.href} aria-current={active ? "page" : undefined} className="group shrink-0 transition-transform hover:scale-105"><ArchiveFrame weight="thin" cornerSize="sm" className={`rounded-xl ${active ? "brightness-125" : "brightness-95 group-hover:brightness-110"}`}><div className={`flex w-[84px] h-[80px] lg:w-[96px] lg:h-[90px] flex-col items-center justify-center gap-1 px-2 ${active ? "text-accent-gold" : "text-accent-gold/85"}`}>{image && <img src={image} alt="" className="h-12 w-12 lg:h-14 lg:w-14 object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]" />}<span className="font-cinzel text-[11px] lg:text-[12px] uppercase tracking-tight text-center leading-tight text-balance break-words hyphens-auto">{item.label}</span></div></ArchiveFrame></Link>
}

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isCrestMenuOpen, setIsCrestMenuOpen] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [mobileNavRoutes, setMobileNavRoutes] = useState<MobileNavRoute[]>(["/collection", "/discover", "/events", "/themes"])
  const { currentAppTheme } = useAppTheme()
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, loading } = useUser()
  const hasUnreadNotifications = unreadNotificationCount > 0

  useEffect(() => {
    async function fetchUnreadCounts() {
      if (!user) { setUnreadMessageCount(0); setUnreadNotificationCount(0); return }
      const [messageResult, notificationResult] = await Promise.all([getUnreadCount(), getUnreadNotificationCount()])
      setUnreadMessageCount(messageResult.count)
      setUnreadNotificationCount(notificationResult.count)
    }
    fetchUnreadCounts()
    if (!user) return
    const supabase = createClient()
    const messagesChannel = supabase.channel("nav-messages").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => fetchUnreadCounts()).on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => fetchUnreadCounts()).subscribe()
    const notificationsChannel = supabase.channel("nav-notifications").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchUnreadCounts()).on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchUnreadCounts()).on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchUnreadCounts()).subscribe()
    return () => { supabase.removeChannel(messagesChannel); supabase.removeChannel(notificationsChannel) }
  }, [user])

  useEffect(() => {
    const readRoutes = (preferences: Record<string, unknown> | null | undefined): MobileNavRoute[] => {
      const navigation = preferences?.navigation
      if (!navigation || typeof navigation !== "object" || Array.isArray(navigation)) return ["/collection", "/discover", "/events", "/themes"]
      const saved = (navigation as Record<string, unknown>).mobileBottomSlots
      if (!Array.isArray(saved)) return ["/collection", "/discover", "/events", "/themes"]
      const valid = saved.filter((value): value is MobileNavRoute =>
        typeof value === "string" && (MOBILE_NAV_ROUTES as readonly string[]).includes(value)
      )
      return valid.length === 4 && new Set(valid).size === 4 ? valid : ["/collection", "/discover", "/events", "/themes"]
    }

    setMobileNavRoutes(readRoutes(profile?.preferences))

    const handleNavigationUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ routes?: MobileNavRoute[] }>
      if (customEvent.detail?.routes) setMobileNavRoutes(customEvent.detail.routes)
    }
    window.addEventListener("gametable-navigation-updated", handleNavigationUpdate)
    return () => window.removeEventListener("gametable-navigation-updated", handleNavigationUpdate)
  }, [profile?.preferences])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (isCrestMenuOpen && !(e.target as Element).closest('.crest-menu-container')) setIsCrestMenuOpen(false) }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isCrestMenuOpen])

  const displayName = profile?.display_name || user?.email?.split('@')[0] || t("nav.guest")
  const userLevel = profile?.level ?? 1
  const userXp = profile?.xp ?? 0
  const handleLogout = async () => { const supabase = createClient(); await supabase.auth.signOut(); try { localStorage.removeItem("gametable-app-theme") } catch (e) {} setIsUserDropdownOpen(false); setIsCrestMenuOpen(false); router.push("/"); router.refresh() }
  const desktopNavItemsLeft = [{ href: "/collection", label: t("nav.collection") }, { href: "/discover", label: t("nav.community") }, { href: "/events", label: t("nav.events") }, { href: "/marketplace", label: t("nav.marketplace") }]
  const desktopNavItemsRight = [{ href: "/themes", label: t("nav.manor") }, { href: "/messages", label: t("nav.messages") }, { href: "/trophies", label: t("nav.trophies") }, { href: "/contact", label: t("nav.contact") }]
  const mobileNavItems = mobileNavRoutes.map(href => ({
    href,
    label: ({
      "/collection": t("nav.collection"),
      "/discover": t("nav.community"),
      "/events": t("nav.events"),
      "/themes": t("nav.themes"),
      "/marketplace": t("nav.marketplace"),
      "/messages": t("nav.messages"),
      "/trophies": t("nav.trophies"),
      "/contact": t("nav.contact"),
    } as Record<MobileNavRoute, string>)[href],
  }))
  const crestRouteIcons: Record<MobileNavRoute, typeof Home> = { "/collection": Archive, "/discover": Users, "/events": Calendar, "/themes": DoorOpen, "/marketplace": ShoppingBag, "/messages": MessageCircle, "/trophies": Trophy, "/contact": Phone }
  const crestVariableMenuItems = MOBILE_NAV_ROUTES.filter(href => !mobileNavRoutes.includes(href)).map(href => ({ href, label: ({ "/collection": t("nav.collection"), "/discover": t("nav.community"), "/events": t("nav.events"), "/themes": t("nav.themes"), "/marketplace": t("nav.marketplace"), "/messages": t("nav.messages"), "/trophies": t("nav.trophies"), "/contact": t("nav.contact") } as Record<MobileNavRoute, string>)[href], icon: crestRouteIcons[href], ...(href === "/messages" ? { badge: unreadMessageCount } : {}) }))
  const crestMenuItems = [{ href: "/home", label: t("nav.home"), icon: Home }, ...crestVariableMenuItems]
  const getCrestImage = (theme: string) => { const crestMap: { [key: string]: string } = { "main-hall": "/images/mainhall-crest-original.png", library: "/images/crests/library-crest.png", bar: "/images/bar-crest.png", "fireside-lounge": "/images/fireside-lounge-crest.png", spa: "/crests/spa-crest.png", conservatory: "/images/conservatory-crest.png", gallery: "/images/gallery-crest.png", artroom: "/crests/artroom-crest.png", ballroom: "/images/ballroom-crest.png", "map-room": "/images/map-room-crest.png", observatory: "/images/observatory-crest.png", "theater-room": "/images/theater-room-crest.png", "clock-tower": "/images/clock-tower-crest.png", "war-room": "/images/war-room-crest.png", "alchemist-laboratory": "/crests/alchemist-crest.png", dungeon: "/crests/dungeon-crest.png", "underground-temple": "/crests/temple-crest.png", "crystal-cavern": "/crests/crystal-crest.png", "treasure-vault": "/crests/treasure-crest.png" }; return crestMap[theme] || crestMap["main-hall"] }
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return <>
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 pointer-events-auto">
          <div className="flex items-center gap-3 lg:gap-4">
            <Link href="/notifications" aria-label={t("nav.notifications")} className="transition-transform hover:scale-105">
              <ArchiveFrame weight="thin" corners={false} className="rounded-lg">
                <div className="relative flex h-11 w-11 items-center justify-center text-[var(--archive-gold,#d9b65c)]">
                  <Bell className="h-5 w-5 text-[var(--archive-gold,#d9b65c)]" />
                  {hasUnreadNotifications && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}</span>}
                </div>
              </ArchiveFrame>
            </Link>
            <LanguageSwitcher variant="archive" />
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            {user && !loading && (
              <ArchiveFrame weight="thin" corners={false} className="rounded-lg">
                <div className="flex h-11 items-center gap-2 px-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent-gold bg-accent-gold/20">
                    <span className="font-cinzel text-sm font-bold text-accent-gold">{userLevel}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-cinzel text-xs uppercase tracking-wide text-foreground">Lvl {userLevel}</span>
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-background/50">
                      <div className="h-full rounded-full bg-accent-gold transition-all" style={{ width: `${xpProgressPercent(userXp, userLevel)}%` }} />
                    </div>
                  </div>
                </div>
              </ArchiveFrame>
            )}
            {!user && !loading ? (
              <ArchiveFrame weight="thin" corners={false} className="rounded-lg">
                <Link href="/auth/login" className="flex h-11 items-center gap-2 px-3 font-cinzel text-xs uppercase tracking-wide text-accent-gold transition-transform hover:scale-105">
                  <User className="h-4 w-4" />
                  <span>{t("nav.login")}</span>
                </Link>
              </ArchiveFrame>
            ) : (
              <div className="relative">
                <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} aria-label={t("nav.profile")} className="transition-transform hover:scale-105">
                  <ArchiveAvatarFrame size="lg" className="translate-y-1">
                    <div className="relative h-full w-full overflow-hidden rounded-full bg-accent-gold/20">
                      {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="absolute inset-0 h-full w-full object-cover object-center" /> : <User className="absolute inset-0 m-auto h-5 w-5 text-accent-gold" />}
                    </div>
                  </ArchiveAvatarFrame>
                </button>
                {isUserDropdownOpen && (
                  <ArchiveFrame weight="thin" corners={false} className="absolute right-0 mt-2 w-48 rounded-lg">
                    <div className="overflow-hidden rounded-[0.4rem] bg-[var(--archive-wood-base,#2b190c)]/90 backdrop-blur-sm">
                      <Link href="/profile" className="flex items-center space-x-3 px-4 py-3 transition-colors hover:bg-accent-gold/10" onClick={() => setIsUserDropdownOpen(false)}>
                        <User className="h-4 w-4 text-accent-gold" />
                        <span className="font-cinzel text-sm text-foreground">{t("nav.profile")}</span>
                      </Link>
                      <button className="flex w-full items-center space-x-3 border-t border-accent-gold/20 px-4 py-3 text-left transition-colors hover:bg-accent-gold/10" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 text-accent-gold" />
                        <span className="font-cinzel text-sm text-foreground">{t("nav.logout")}</span>
                      </button>
                    </div>
                  </ArchiveFrame>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    <nav className="hidden md:block fixed bottom-4 left-0 right-0 z-50 pointer-events-none"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between h-20 pointer-events-auto">{desktopNavItemsLeft.map(item => <DesktopNavButton key={item.href} item={item} active={isActive(item.href)} />)}<Link href="/home" aria-label={t("nav.home")} aria-current={isActive("/home") ? "page" : undefined} className="group shrink-0 transition-transform hover:scale-105"><ArchiveFrame round weight="thin" className={`${isActive("/home") ? "brightness-125" : "brightness-95 group-hover:brightness-110"}`}><div className="flex h-[92px] w-[92px] lg:h-[104px] lg:w-[104px] items-center justify-center"><img src={getCrestImage(currentAppTheme) || "/placeholder.svg"} alt="" className="w-16 h-16 lg:w-20 lg:h-20 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]" /></div></ArchiveFrame></Link>{desktopNavItemsRight.map(item => <DesktopNavButton key={item.href} item={item} active={isActive(item.href)} />)}</div></div></nav>

    <div className="md:hidden fixed left-0 right-0 z-50 px-4 pt-3 pb-2 flex items-center justify-between pointer-events-none" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <Link href="/notifications" className="relative pointer-events-auto w-14 h-14 flex items-center justify-center"><img src="/images/icons/avatar-frame.jpeg" alt="" className="absolute inset-0 w-14 h-14 object-contain" /><img src="/images/icons/bell.jpeg" alt="" className="w-9 h-9 object-contain z-10" />{hasUnreadNotifications && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold z-20">{unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}</span>}</Link>
      <div className="flex items-center gap-2 pointer-events-auto"><LanguageSwitcher /><Link href="/profile" className="relative w-14 h-14 flex items-center justify-center"><img src="/images/icons/avatar-frame.jpeg" alt="" className="absolute inset-0 w-14 h-14 object-contain" /><div className="w-9 h-9 rounded-full bg-accent-gold/20 flex items-center justify-center overflow-hidden z-10">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-accent-gold" />}</div></Link></div>
    </div>

    <div className="md:hidden !fixed !top-auto !bottom-0 left-0 right-0 z-50"><div className="crest-menu-container absolute -top-8 left-1/2 -translate-x-1/2 z-20"><button onClick={(e) => { e.stopPropagation(); setIsCrestMenuOpen(!isCrestMenuOpen) }} aria-label="Open menu" className={`transition-opacity duration-200 ${isCrestMenuOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}><ArchiveAvatarFrame size="xl"><img src={getCrestImage(currentAppTheme)} alt="Menu" className="w-12 h-12 object-contain relative z-10 translate-y-[1px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]" /></ArchiveAvatarFrame></button>{isCrestMenuOpen && <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64"><ArchiveFrame className="w-64 animate-archive-unfurl"><div className="p-1.5 pt-9">{crestMenuItems.map((item, index) => <Link key={item.href} href={item.href} className={`flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-accent-gold/10 transition-colors ${index !== crestMenuItems.length - 1 ? "border-b border-accent-gold/10" : ""}`} onClick={() => setIsCrestMenuOpen(false)}><item.icon className="w-5 h-5 text-accent-gold" /><div className="flex-1"><span className="text-foreground font-cinzel text-sm uppercase tracking-wide">{item.label}</span></div>{item.badge && item.badge > 0 && <span className="bg-red-500 text-white text-[10px] rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">{item.badge > 99 ? "99+" : item.badge}</span>}</Link>)}{user && <button className="flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-accent-gold/10 transition-colors w-full text-left border-t border-accent-gold/20" onClick={handleLogout}><LogOut className="w-5 h-5 text-accent-gold" /><span className="text-foreground font-cinzel text-sm uppercase tracking-wide">{t("nav.logout")}</span></button>}</div></ArchiveFrame><button onClick={(e) => { e.stopPropagation(); setIsCrestMenuOpen(false) }} aria-label="Close menu" style={{ "--crest-rise": "150px" } as Record<string, string>} className="animate-archive-crest-rise absolute -top-7 left-1/2 -translate-x-1/2 z-30"><ArchiveAvatarFrame size="xl"><img src={getCrestImage(currentAppTheme)} alt="Close menu" className="w-12 h-12 object-contain relative z-10 translate-y-[1px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]" /></ArchiveAvatarFrame></button></div>}</div><div className="flex items-center justify-center gap-3 px-3 pt-2 pb-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">{mobileNavItems.slice(0, 2).map(item => <MobileNavButton key={item.href} item={item} active={isActive(item.href)} />)}<div className="w-16" />{mobileNavItems.slice(2).map(item => <MobileNavButton key={item.href} item={item} active={isActive(item.href)} />)}</div></div>
  </>
}
