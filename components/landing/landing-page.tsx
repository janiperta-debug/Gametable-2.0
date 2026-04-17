"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations, useI18n } from "@/lib/i18n"
import { CookieConsent } from "@/components/cookie-consent"

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */
const OPENING_DATE = new Date("2026-04-01T10:00:00+03:00")
const APP_URL = "/home"

/* ────────────────────────────────────────────
   Scroll-reveal hook
   ──────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const els = ref.current.querySelectorAll(".reveal")
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible")
        })
      },
      { threshold: 0.08 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return ref
}

/* ────────────────────────────────────────────
   Smooth scroll helper
   ──────────────────────────────────────────── */
function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: "smooth" })
}

/* ────────────────────────────────────────────
   Check if opening date has passed
   ──────────────────────────────────────────── */
function isOpened() {
  return new Date() >= OPENING_DATE
}

/* ════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════ */
export function LandingPage() {
  const wrapperRef = useReveal()
  const [opened, setOpened] = useState(isOpened())

  // Check opening status periodically
  useEffect(() => {
    if (opened) return
    const interval = setInterval(() => {
      if (isOpened()) {
        setOpened(true)
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [opened])

  return (
    <div
      ref={wrapperRef}
      className="min-h-screen font-dm-sans text-[#f0e6d0] overflow-x-hidden"
      style={{ background: "linear-gradient(180deg, #3d1515 0%, #2a0f0f 50%, #1a0808 100%)" }}
    >
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`
      }} />

      <LandingNav opened={opened} />
      <HeroSection />
      {!opened && <CountdownSection />}
      <StatementSection />
      <PlayersSection />
      <FeaturesSection />
      <ToolsSection />
      <ManifestoSection />
      <CtaSection opened={opened} />
      <LandingFooter />
      <CookieConsent />
    </div>
  )
}

/* ────────────────────────────────────────────
   LANGUAGE SWITCHER (Landing-specific styling)
   ──────────────────────────────────────────── */
function LandingLanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  
  return (
    <div className="flex items-center gap-1 rounded bg-[#1a0808]/50 p-0.5">
      <button
        onClick={() => setLocale("fi")}
        className={`px-2 py-1 rounded text-xs font-medium tracking-wide transition-all ${
          locale === "fi" 
            ? "bg-[#c9a84c] text-[#1a0808]" 
            : "text-[#f0e6d0]/60 hover:text-[#c9a84c]"
        }`}
      >
        FI
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`px-2 py-1 rounded text-xs font-medium tracking-wide transition-all ${
          locale === "en" 
            ? "bg-[#c9a84c] text-[#1a0808]" 
            : "text-[#f0e6d0]/60 hover:text-[#c9a84c]"
        }`}
      >
        EN
      </button>
    </div>
  )
}

/* ────────────────────────────────────────────
   NAV
   ──────────────────────────────────────────── */
function LandingNav({ opened }: { opened: boolean }) {
  const t = useTranslations()
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-6 lg:px-12 py-4 border-b border-[#c9a84c]/20"
      style={{ background: "rgba(61,21,21,0.92)", backdropFilter: "blur(20px)" }}
    >
      <a href="/" className="flex items-center gap-2.5 no-underline">
        <Image
          src="/images/gametable-logo.png"
          alt="GameTable logo"
          width={36}
          height={36}
          className="shrink-0"
        />
        <span className="font-charm text-2xl text-[#c9a84c] leading-none">
          GameTable
        </span>
      </a>

      <ul className="hidden md:flex items-center gap-8 list-none">
        <li>
          <button onClick={() => scrollTo("kenelle")} className="font-cinzel text-xs font-medium text-[#f0e6d0]/60 hover:text-[#c9a84c] tracking-wide transition-colors bg-transparent border-none cursor-pointer">
            {t("landing.nav.forWhom")}
          </button>
        </li>
        <li>
          <button onClick={() => scrollTo("ominaisuudet")} className="font-cinzel text-xs font-medium text-[#f0e6d0]/60 hover:text-[#c9a84c] tracking-wide transition-colors bg-transparent border-none cursor-pointer">
            {t("landing.nav.features")}
          </button>
        </li>
        <li>
          <button onClick={() => scrollTo("tyokalut")} className="font-cinzel text-xs font-medium text-[#f0e6d0]/60 hover:text-[#c9a84c] tracking-wide transition-colors bg-transparent border-none cursor-pointer">
            {t("landing.nav.tools")}
          </button>
        </li>
        <li>
          <LandingLanguageSwitcher />
        </li>
        <li>
          {opened ? (
            <Link
              href={APP_URL}
              className="font-cinzel text-xs font-bold tracking-wide px-5 py-2 rounded-sm no-underline transition-all hover:opacity-90"
              style={{ background: "#c9a84c", color: "#1a1008" }}
            >
              {t("landing.nav.enterManor")} →
            </Link>
          ) : (
            <span
              className="font-cinzel text-xs font-bold tracking-wide px-5 py-2 rounded-sm opacity-50 cursor-not-allowed"
              style={{ border: "1px solid #c9a84c", color: "#c9a84c" }}
            >
              {t("landing.nav.enterManor")} →
            </span>
          )}
        </li>
      </ul>

      {/* Mobile: language switcher + CTA button */}
      <div className="md:hidden flex items-center gap-3">
        <LandingLanguageSwitcher />
        {opened && (
          <Link
            href={APP_URL}
            className="font-cinzel text-[10px] font-bold tracking-wide px-3 py-1.5 rounded-sm no-underline transition-all hover:opacity-90"
            style={{ background: "#c9a84c", color: "#1a1008" }}
          >
            {t("landing.nav.enterManor")} →
          </Link>
        )}
      </div>
    </nav>
  )
}

/* ────────────────────────────────────────────
   HERO
   ──────────────────────────────────────────── */
function HeroSection() {
  const t = useTranslations()
  const [opened, setOpened] = useState<boolean>(isOpened())
  
  useEffect(() => {
    if (opened) return
    const interval = setInterval(() => {
      if (isOpened()) {
        setOpened(true)
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [opened])
  
  return (
    <section className="min-h-screen relative flex flex-col items-center justify-center text-center px-5 pt-24 pb-16">
      {/* Theme background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/themes/main-hall-preview.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay gradient for text readability */}
        <div 
          className="absolute inset-0" 
          style={{ 
            background: "linear-gradient(180deg, rgba(61,21,21,0.7) 0%, rgba(42,15,15,0.85) 50%, rgba(26,8,8,0.95) 100%)" 
          }} 
        />
      </div>

      {/* Main heading */}
      <div className="relative z-10 max-w-4xl mx-auto opacity-0 animate-[fadeUp_0.8s_0.2s_forwards]">
        <h1 
          className="font-cinzel font-semibold leading-tight tracking-tight text-[#f0e6d0] mb-8"
          style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)", letterSpacing: "-0.02em" }}
        >
          {t("landing.hero.title1")}<br />
          {t("landing.hero.title2")}<br />
          <span className="text-[#c9a84c]">{t("landing.hero.title3")}</span>
        </h1>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-8 opacity-60">
          <div className="w-16 h-px bg-[#c9a84c]" />
          <span className="font-cinzel text-[#c9a84c] text-sm">✦</span>
          <div className="w-16 h-px bg-[#c9a84c]" />
        </div>

        {/* Subtitle - becomes a link when manor is open */}
        {opened ? (
          <Link 
            href={APP_URL}
            className="font-cormorant text-lg md:text-xl text-[#c9a84c] hover:text-[#c9a84c]/80 max-w-2xl mx-auto mb-4 uppercase tracking-widest block transition-colors no-underline hover:underline"
          >
            {t("landing.hero.subtitleOpen")} →
          </Link>
        ) : (
          <p className="font-cormorant text-lg md:text-xl text-[#f0e6d0]/70 max-w-2xl mx-auto mb-4 uppercase tracking-widest">
            {t("landing.hero.subtitle")}
          </p>
        )}

        <p className="text-base text-[#f0e6d0]/60 max-w-xl mx-auto mb-10 leading-relaxed">
          {t("landing.hero.description")}
        </p>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   COUNTDOWN SECTION
   ──────────────────────────────────────────── */
function CountdownSection() {
  const t = useTranslations()
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [visitorCount, setVisitorCount] = useState(146)

  // Countdown timer
  useEffect(() => {
    function updateCountdown() {
      const now = new Date()
      const diff = OPENING_DATE.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  // Simulated visitor counter (increments randomly every 8-12 seconds)
  useEffect(() => {
    const randomInterval = () => Math.floor(Math.random() * 4000) + 8000 // 8-12 seconds
    
    let timeout: NodeJS.Timeout
    const incrementVisitors = () => {
      setVisitorCount(prev => prev + 1)
      timeout = setTimeout(incrementVisitors, randomInterval())
    }
    
    timeout = setTimeout(incrementVisitors, randomInterval())
    return () => clearTimeout(timeout)
  }, [])

  return (
    <section className="py-12 px-5 border-t border-b border-[#c9a84c]/20" style={{ background: "rgba(42,15,15,0.8)" }}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Countdown label */}
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#c9a84c]/60 mb-6">
          {t("landing.countdown.label")}
        </p>

        {/* Countdown timer */}
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
          <CountdownUnit value={timeLeft.days} label={t("landing.countdown.days")} />
          <span className="font-cinzel text-3xl text-[#c9a84c]/40">:</span>
          <CountdownUnit value={timeLeft.hours} label={t("landing.countdown.hours")} />
          <span className="font-cinzel text-3xl text-[#c9a84c]/40">:</span>
          <CountdownUnit value={timeLeft.minutes} label={t("landing.countdown.minutes")} />
          <span className="font-cinzel text-3xl text-[#c9a84c]/40">:</span>
          <CountdownUnit value={timeLeft.seconds} label={t("landing.countdown.seconds")} />
        </div>

        {/* Visitor counter */}
        <p className="text-sm text-[#f0e6d0]/50 mb-8">
          <span className="text-[#c9a84c] font-semibold">{visitorCount}</span> {t("landing.countdown.visitors")}
        </p>

        {/* Locked button */}
        <button
          disabled
          className="font-cinzel text-sm font-bold tracking-wide px-8 py-4 rounded-sm cursor-not-allowed opacity-60 transition-all"
          style={{ border: "2px solid #c9a84c", color: "#c9a84c", background: "transparent" }}
        >
          {t("landing.countdown.enterManor")} →
        </button>

        <p className="text-xs text-[#f0e6d0]/40 mt-4">
          {t("landing.countdown.openingDate")}
        </p>
      </div>
    </section>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className="font-cinzel text-4xl md:text-6xl font-bold text-[#c9a84c] leading-none"
        style={{ minWidth: "80px" }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div className="font-cinzel text-[10px] uppercase tracking-widest text-[#f0e6d0]/40 mt-2">
        {label}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   STATS SECTION (below countdown)
   ──────────────────────────────────────────── */
function StatsRow() {
  const t = useTranslations()
  
  return (
    <div className="flex items-center justify-center gap-8 md:gap-16 py-8 border-t border-[#c9a84c]/10">
      <StatItem value="50+" label={t("landing.stats.players")} />
      <div className="w-px h-8 bg-[#c9a84c]/20" />
      <StatItem value="1 000+" label={t("landing.stats.games")} />
      <div className="w-px h-8 bg-[#c9a84c]/20" />
      <StatItem value="0 €" label={t("landing.stats.membership")} />
    </div>
  )
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-cinzel text-2xl md:text-3xl font-bold text-[#c9a84c]">{value}</div>
      <div className="text-xs text-[#f0e6d0]/50 mt-1">{label}</div>
    </div>
  )
}

/* ────────────────────────────────────────────
   STATEMENT
   ──────────────────────────────────────────── */
function StatementSection() {
  return (
    <section className="py-16 lg:py-20 px-5 lg:px-12" style={{ background: "transparent" }}>
      <StatsRow />
    </section>
  )
}

/* ────────────────────────────────────────────
   PLAYERS (Kenelle)
   ──────────────────────────────────────────── */
function PlayersSection() {
  const t = useTranslations()
  
  const playerTypes = [
    {
      key: "boardGamer",
      icon: "♟️",
    },
    {
      key: "roleplayer",
      icon: "🎲",
    },
    {
      key: "miniatures",
      icon: "⚔️",
    },
    {
      key: "cardCollector",
      icon: "🃏",
    },
  ]
  
  return (
    <section id="kenelle" className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#c9a84c]/10">
      <div className="max-w-6xl mx-auto">
        <div className="reveal text-center mb-12">
          <div className="font-cinzel text-xs font-medium uppercase tracking-[0.3em] text-[#c9a84c] mb-4">
            {t("landing.forWhom.label")}
          </div>
          <h2 className="font-cinzel font-semibold tracking-tight text-[#f0e6d0] leading-tight"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            {t("landing.forWhom.title")}
          </h2>
        </div>

        {/* Player grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 reveal">
          {playerTypes.map((p) => (
            <div 
              key={p.key} 
              className="p-6 rounded-lg transition-all hover:border-[#c9a84c]/40"
              style={{ background: "rgba(61,21,21,0.6)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <span className="text-3xl block mb-4">{p.icon}</span>
              <div className="font-cinzel text-lg font-semibold text-[#f0e6d0] mb-2">
                {t(`landing.forWhom.${p.key}.type`)}
              </div>
              <p className="text-sm text-[#f0e6d0]/60 leading-relaxed">
                {t(`landing.forWhom.${p.key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   FEATURES (Ominaisuudet)
   ──────────────────────────────────────────── */
function FeaturesSection() {
  const t = useTranslations()
  
  const features = ["collection", "community", "events"]
  
  return (
    <section id="ominaisuudet" className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#c9a84c]/10" style={{ background: "rgba(42,15,15,0.5)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="reveal text-center mb-12">
          <div className="font-cinzel text-xs font-medium uppercase tracking-[0.3em] text-[#c9a84c] mb-4">
            {t("landing.features.label")}
          </div>
          <h2 className="font-cinzel font-semibold tracking-tight text-[#f0e6d0] leading-tight"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            {t("landing.features.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal">
          {features.map((f) => (
            <div key={f} className="text-center">
              <div className="font-cinzel text-6xl font-light text-[#c9a84c]/20 mb-4">
                {t(`landing.features.${f}.number`)}
              </div>
              <div className="font-cinzel text-xl font-semibold text-[#c9a84c] mb-2">
                {t(`landing.features.${f}.title`)}
              </div>
              <div className="font-cormorant text-lg italic text-[#f0e6d0]/80 mb-3">
                {t(`landing.features.${f}.subtitle`)}
              </div>
              <p className="text-sm text-[#f0e6d0]/50 leading-relaxed">
                {t(`landing.features.${f}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   TOOLS (Työkalut)
   ──────────────────────────────────────────── */
function ToolsSection() {
  const t = useTranslations()
  
  const tools = ["armyBuilder", "characterBuilder", "deckBuilder", "campaignDiary"]
  
  return (
    <section id="tyokalut" className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#c9a84c]/10">
      <div className="max-w-6xl mx-auto">
        <div className="reveal text-center mb-12">
          <div className="font-cinzel text-xs font-medium uppercase tracking-[0.3em] text-[#c9a84c] mb-4">
            {t("landing.tools.label")}
          </div>
          <h2 className="font-cinzel font-semibold tracking-tight text-[#f0e6d0] leading-tight"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            {t("landing.tools.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 reveal">
          {tools.map((tool) => {
            const status = t(`landing.tools.${tool}.status`)
            const isComingSoon = status === "Tulossa" || status === "Coming Soon"
            
            return (
              <div 
                key={tool} 
                className="p-6 rounded-lg text-center"
                style={{ background: "rgba(61,21,21,0.6)", border: "1px solid rgba(201,168,76,0.15)" }}
              >
                <div className="font-cinzel text-lg font-semibold text-[#f0e6d0] mb-2">
                  {t(`landing.tools.${tool}.name`)}
                </div>
                <p className="text-xs text-[#f0e6d0]/50 mb-3">
                  {t(`landing.tools.${tool}.desc`)}
                </p>
                <span 
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    background: isComingSoon ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.1)",
                    color: "#c9a84c"
                  }}
                >
                  {status}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   MANIFESTO (Pull quote)
   ──────────────────────────────────────────── */
function ManifestoSection() {
  const t = useTranslations()
  
  return (
    <section className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#c9a84c]/10" style={{ background: "rgba(42,15,15,0.5)" }}>
      <div className="max-w-3xl mx-auto text-center reveal">
        <span className="font-cinzel text-4xl text-[#c9a84c]/30 block mb-6">❧</span>
        <blockquote 
          className="font-cormorant italic text-[#f0e6d0]/80 leading-relaxed"
          style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
        >
          &ldquo;{t("landing.manifesto.quote")}&rdquo;
        </blockquote>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   CTA BOTTOM
   ──────────────────────────────────────────── */
function CtaSection({ opened }: { opened: boolean }) {
  const t = useTranslations()
  
  return (
    <section className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#c9a84c]/10">
      <div className="max-w-2xl mx-auto text-center reveal">
        <div className="font-cinzel text-xs font-medium uppercase tracking-[0.3em] text-[#c9a84c] mb-6">
          {opened ? t("landing.cta.welcome") : t("landing.cta.soon")}
        </div>
        
        {opened ? (
          <Link
            href={APP_URL}
            className="inline-block font-cinzel text-sm font-bold tracking-wide px-10 py-4 rounded-sm no-underline transition-all hover:opacity-90"
            style={{ background: "#c9a84c", color: "#1a1008", boxShadow: "0 8px 32px rgba(201,168,76,0.3)" }}
          >
            {t("landing.nav.enterManor")} →
          </Link>
        ) : (
          <button
            disabled
            className="font-cinzel text-sm font-bold tracking-wide px-10 py-4 rounded-sm cursor-not-allowed opacity-60"
            style={{ border: "2px solid #c9a84c", color: "#c9a84c", background: "transparent" }}
          >
            {t("landing.nav.enterManor")} →
          </button>
        )}
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   FOOTER
   ──────────────────────────────────────────── */
function LandingFooter() {
  const t = useTranslations()
  
  return (
    <footer className="py-12 px-5 lg:px-12 border-t border-[#c9a84c]/10" style={{ background: "rgba(26,8,8,0.9)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/gametable-logo.png"
              alt="GameTable logo"
              width={28}
              height={28}
              className="shrink-0 opacity-60"
            />
            <span className="font-charm text-xl text-[#c9a84c]/60">GameTable</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link href="/terms-page" className="text-[#f0e6d0]/40 hover:text-[#c9a84c] transition-colors no-underline font-cinzel text-xs uppercase tracking-wider">
              {t("landing.footer.terms")}
            </Link>
            <Link href="/privacy-page" className="text-[#f0e6d0]/40 hover:text-[#c9a84c] transition-colors no-underline font-cinzel text-xs uppercase tracking-wider">
              {t("landing.footer.privacy")}
            </Link>
            <Link href="/contact" className="text-[#f0e6d0]/40 hover:text-[#c9a84c] transition-colors no-underline font-cinzel text-xs uppercase tracking-wider">
              {t("landing.footer.contact")}
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-8 pt-6 border-t border-[#c9a84c]/10">
          <p className="text-xs text-[#f0e6d0]/30">
            © 2026 GameTable · Janope
          </p>
        </div>
      </div>
    </footer>
  )
}
