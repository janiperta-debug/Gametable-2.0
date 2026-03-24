"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"

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
      style={{ background: "#1a1008" }}
    >
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`
      }} />

      <LandingNav opened={opened} />
      <HeroSection opened={opened} />
      {!opened && <CountdownSection />}
      <StatementSection />
      <PlayersSection />
      <FeaturesSection />
      <ToolsSection />
      <ManifestoSection />
      <CtaSection opened={opened} />
      <LandingFooter />
    </div>
  )
}

/* ────────────────────────────────────────────
   NAV
   ──────────────────────────────────────────── */
function LandingNav({ opened }: { opened: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-6 lg:px-12 py-4 border-b border-[#c9a84c]/20"
      style={{ background: "rgba(26,16,8,0.92)", backdropFilter: "blur(20px)" }}
    >
      <a href="/" className="flex items-center gap-2.5 no-underline">
        <Image
          src="/images/gametable-logo.png"
          alt="GameTable logo"
          width={36}
          height={36}
          className="shrink-0"
        />
        <span className="font-cinzel text-xl text-[#c9a84c] tracking-wide leading-none">
          GameTable
        </span>
      </a>

      <ul className="hidden md:flex items-center gap-8 list-none">
        <li>
          <button onClick={() => scrollTo("kenelle")} className="font-cinzel text-xs font-medium text-[#f0e6d0]/60 hover:text-[#c9a84c] tracking-wide transition-colors bg-transparent border-none cursor-pointer">
            Kenelle
          </button>
        </li>
        <li>
          <button onClick={() => scrollTo("ominaisuudet")} className="font-cinzel text-xs font-medium text-[#f0e6d0]/60 hover:text-[#c9a84c] tracking-wide transition-colors bg-transparent border-none cursor-pointer">
            Ominaisuudet
          </button>
        </li>
        <li>
          <button onClick={() => scrollTo("tyokalut")} className="font-cinzel text-xs font-medium text-[#f0e6d0]/60 hover:text-[#c9a84c] tracking-wide transition-colors bg-transparent border-none cursor-pointer">
            Työkalut
          </button>
        </li>
        <li>
          {opened ? (
            <Link
              href={APP_URL}
              className="font-cinzel text-xs font-bold tracking-wide px-5 py-2 rounded-sm no-underline transition-all hover:opacity-90"
              style={{ background: "#c9a84c", color: "#1a1008" }}
            >
              Astu Kartanoon →
            </Link>
          ) : (
            <span
              className="font-cinzel text-xs font-bold tracking-wide px-5 py-2 rounded-sm opacity-50 cursor-not-allowed"
              style={{ border: "1px solid #c9a84c", color: "#c9a84c" }}
            >
              Astu Kartanoon →
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}

/* ────────────────────────────────────────────
   HERO
   ──────────────────────────────────────────── */
function HeroSection({ opened }: { opened: boolean }) {
  return (
    <section className="min-h-screen relative flex flex-col items-center justify-center text-center px-5 pt-24 pb-16">
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 opacity-10">
        <div className="text-[#c9a84c] text-9xl font-cinzel">✦</div>
      </div>

      {/* Main heading */}
      <div className="relative z-10 max-w-4xl mx-auto opacity-0 animate-[fadeUp_0.8s_0.2s_forwards]">
        <h1 
          className="font-cinzel font-semibold leading-tight tracking-tight text-[#f0e6d0] mb-8"
          style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)", letterSpacing: "-0.02em" }}
        >
          Kaikkien<br />
          pöytäpelaajien<br />
          <span className="text-[#c9a84c]">koti.</span>
        </h1>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-8 opacity-60">
          <div className="w-16 h-px bg-[#c9a84c]" />
          <span className="font-cinzel text-[#c9a84c] text-sm">✦</span>
          <div className="w-16 h-px bg-[#c9a84c]" />
        </div>

        {/* Subtitle */}
        <p className="font-cormorant text-lg md:text-xl text-[#f0e6d0]/70 max-w-2xl mx-auto mb-4 uppercase tracking-widest">
          Kartano avaa ovensa
        </p>

        <p className="text-base text-[#f0e6d0]/60 max-w-xl mx-auto mb-10 leading-relaxed">
          Lautapelaajasta roolipelaajaan, miniatyyrimaalarista kortinkerääjään — yksi kartano koko harrastukselle.
        </p>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   COUNTDOWN SECTION
   ──────────────────────────────────────────── */
function CountdownSection() {
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
    <section className="py-12 px-5 border-t border-b border-[#c9a84c]/20" style={{ background: "#1a1008" }}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Countdown label */}
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#c9a84c]/60 mb-6">
          Ovet avautuvat
        </p>

        {/* Countdown timer */}
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
          <CountdownUnit value={timeLeft.days} label="Päivää" />
          <span className="font-cinzel text-3xl text-[#c9a84c]/40">:</span>
          <CountdownUnit value={timeLeft.hours} label="Tuntia" />
          <span className="font-cinzel text-3xl text-[#c9a84c]/40">:</span>
          <CountdownUnit value={timeLeft.minutes} label="Minuuttia" />
          <span className="font-cinzel text-3xl text-[#c9a84c]/40">:</span>
          <CountdownUnit value={timeLeft.seconds} label="Sekuntia" />
        </div>

        {/* Visitor counter */}
        <p className="text-sm text-[#f0e6d0]/50 mb-8">
          <span className="text-[#c9a84c] font-semibold">{visitorCount}</span> pelaajaa odottaa ovien avautumista
        </p>

        {/* Locked button */}
        <button
          disabled
          className="font-cinzel text-sm font-bold tracking-wide px-8 py-4 rounded-sm cursor-not-allowed opacity-60 transition-all"
          style={{ border: "2px solid #c9a84c", color: "#c9a84c", background: "transparent" }}
        >
          Astu Kartanoon →
        </button>

        <p className="text-xs text-[#f0e6d0]/40 mt-4">
          Kartano avaa ovensa 1.4.2026
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
  return (
    <div className="flex items-center justify-center gap-8 md:gap-16 py-8 border-t border-[#c9a84c]/10">
      <StatItem value="50+" label="pelaajaa kartanossa" />
      <div className="w-px h-8 bg-[#c9a84c]/20" />
      <StatItem value="1 000+" label="peliä kokoelmissa" />
      <div className="w-px h-8 bg-[#c9a84c]/20" />
      <StatItem value="0 €" label="jäsenyys, aina" />
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
    <section className="py-16 lg:py-20 px-5 lg:px-12" style={{ background: "#1a1008" }}>
      <StatsRow />
    </section>
  )
}

/* ────────────────────────────────────────────
   PLAYERS (Kenelle)
   ──────────────────────────────────────────── */
const playerTypes = [
  {
    key: "lautapelit",
    type: "Lautapelaaja",
    icon: "♟️",
    desc: "Luetteloi kokoelmasi, löydä pelikavereita ja seuraa jokaista peli-iltaa.",
  },
  {
    key: "roolipelit",
    type: "Roolipelaaja",
    icon: "🎲",
    desc: "Löydä pelinjohtajia ja pelaajia, hallinnoi kampanjoita ja pidä hahmohistoriasi tallessa.",
  },
  {
    key: "miniatyyrit",
    type: "Miniatyyriharrastaja",
    icon: "⚔️",
    desc: "Tallenna armeijasilistasi, jaa maalaamasi miniatyyrit ja löydä muita wargame-harrastajia.",
  },
  {
    key: "kortit",
    type: "Kortinkerääjä",
    icon: "🃏",
    desc: "Hallinnoi kokoelmaasi, rakenna pakkoja ja kauppaa korttiyhteisön sisällä.",
  },
]

function PlayersSection() {
  return (
    <section id="kenelle" className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#c9a84c]/10">
      <div className="max-w-6xl mx-auto">
        <div className="reveal text-center mb-12">
          <div className="font-cinzel text-xs font-medium uppercase tracking-[0.3em] text-[#c9a84c] mb-4">
            Kenelle
          </div>
          <h2 className="font-cinzel font-semibold tracking-tight text-[#f0e6d0] leading-tight"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            Sinulle — lajityypistä riippumatta.
          </h2>
        </div>

        {/* Player grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 reveal">
          {playerTypes.map((p) => (
            <div 
              key={p.key} 
              className="p-6 rounded-lg transition-all hover:border-[#c9a84c]/40"
              style={{ background: "#241a0f", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <span className="text-3xl block mb-4">{p.icon}</span>
              <div className="font-cinzel text-lg font-semibold text-[#f0e6d0] mb-2">{p.type}</div>
              <p className="text-sm text-[#f0e6d0]/60 leading-relaxed">{p.desc}</p>
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
const features = [
  {
    number: "01",
    title: "Kokoelma",
    subtitle: "Kaikki pelisi yhdessä paikassa.",
    desc: "Lautapelit, RPG-kirjat, miniatyyrit, keräilykortit — kaikki lajityypit saman kokoelman alla.",
  },
  {
    number: "02",
    title: "Yhteisö",
    subtitle: "Löydä oman lajisi pelaajat.",
    desc: "Etsi pelaajia lajityypin ja sijainnin mukaan. Yksityisviestit, yhteisöprofiilit ja kauppapaikka.",
  },
  {
    number: "03",
    title: "Tapahtumat",
    subtitle: "Peli-illat. Turnaukset. Kampanjat.",
    desc: "Luo tapahtumia tai liity niihin — sisäänrakennettu ilmoittautuminen ja pelilistan hallinta.",
  },
]

function FeaturesSection() {
  return (
    <section id="ominaisuudet" className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#c9a84c]/10" style={{ background: "#1f150c" }}>
      <div className="max-w-6xl mx-auto">
        <div className="reveal text-center mb-12">
          <div className="font-cinzel text-xs font-medium uppercase tracking-[0.3em] text-[#c9a84c] mb-4">
            Ominaisuudet
          </div>
          <h2 className="font-cinzel font-semibold tracking-tight text-[#f0e6d0] leading-tight"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            Kolme pilaria harrastuksellesi.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal">
          {features.map((f) => (
            <div key={f.number} className="text-center">
              <div className="font-cinzel text-6xl font-light text-[#c9a84c]/20 mb-4">{f.number}</div>
              <div className="font-cinzel text-xl font-semibold text-[#c9a84c] mb-2">{f.title}</div>
              <div className="font-cormorant text-lg italic text-[#f0e6d0]/80 mb-3">{f.subtitle}</div>
              <p className="text-sm text-[#f0e6d0]/50 leading-relaxed">{f.desc}</p>
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
const tools = [
  { name: "Armeijanrakentaja", status: "Tulossa", desc: "Miniatyyriharrastajille" },
  { name: "Hahmonrakentaja", status: "Tulossa", desc: "RPG-pelaajille" },
  { name: "Pakkainrakentaja", status: "Suunnitteilla", desc: "Kortinkerääjille" },
  { name: "Kampanjapäiväkirja", status: "Suunnitteilla", desc: "Seikkailuille" },
]

function ToolsSection() {
  return (
    <section id="tyokalut" className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#c9a84c]/10">
      <div className="max-w-6xl mx-auto">
        <div className="reveal text-center mb-12">
          <div className="font-cinzel text-xs font-medium uppercase tracking-[0.3em] text-[#c9a84c] mb-4">
            Työkalut
          </div>
          <h2 className="font-cinzel font-semibold tracking-tight text-[#f0e6d0] leading-tight"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            Kasvava arsenaalisi.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 reveal">
          {tools.map((t) => (
            <div 
              key={t.name} 
              className="p-6 rounded-lg text-center"
              style={{ background: "#241a0f", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <div className="font-cinzel text-lg font-semibold text-[#f0e6d0] mb-2">{t.name}</div>
              <p className="text-xs text-[#f0e6d0]/50 mb-3">{t.desc}</p>
              <span 
                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                style={{ 
                  background: t.status === "Tulossa" ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.1)",
                  color: "#c9a84c"
                }}
              >
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   MANIFESTO (Pull quote)
   ──────────────────────────────────────────── */
function ManifestoSection() {
  return (
    <section className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#c9a84c]/10" style={{ background: "#1f150c" }}>
      <div className="max-w-3xl mx-auto text-center reveal">
        <span className="font-cinzel text-4xl text-[#c9a84c]/30 block mb-6">❧</span>
        <blockquote 
          className="font-cormorant italic text-[#f0e6d0]/80 leading-relaxed"
          style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
        >
          "Pöytäpelaaminen on yksi harrastus — ei neljää erillistä yhteisöä jotka eivät puhu toisilleen."
        </blockquote>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   CTA BOTTOM
   ──────────────────────────────────────────── */
function CtaSection({ opened }: { opened: boolean }) {
  return (
    <section className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#c9a84c]/10">
      <div className="max-w-2xl mx-auto text-center reveal">
        <div className="font-cinzel text-xs font-medium uppercase tracking-[0.3em] text-[#c9a84c] mb-6">
          {opened ? "Tervetuloa" : "Pian"}
        </div>
        
        {opened ? (
          <Link
            href={APP_URL}
            className="inline-block font-cinzel text-sm font-bold tracking-wide px-10 py-4 rounded-sm no-underline transition-all hover:opacity-90"
            style={{ background: "#c9a84c", color: "#1a1008", boxShadow: "0 8px 32px rgba(201,168,76,0.3)" }}
          >
            Astu Kartanoon →
          </Link>
        ) : (
          <button
            disabled
            className="font-cinzel text-sm font-bold tracking-wide px-10 py-4 rounded-sm cursor-not-allowed opacity-60"
            style={{ border: "2px solid #c9a84c", color: "#c9a84c", background: "transparent" }}
          >
            Astu Kartanoon →
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
  return (
    <footer className="py-12 px-5 lg:px-12 border-t border-[#c9a84c]/10" style={{ background: "#1a1008" }}>
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
            <span className="font-cinzel text-lg text-[#c9a84c]/60">GameTable</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link href="/terms-page" className="text-[#f0e6d0]/40 hover:text-[#c9a84c] transition-colors no-underline font-cinzel text-xs uppercase tracking-wider">
              Ehdot
            </Link>
            <Link href="/privacy-page" className="text-[#f0e6d0]/40 hover:text-[#c9a84c] transition-colors no-underline font-cinzel text-xs uppercase tracking-wider">
              Tietosuoja
            </Link>
            <Link href="/contact" className="text-[#f0e6d0]/40 hover:text-[#c9a84c] transition-colors no-underline font-cinzel text-xs uppercase tracking-wider">
              Yhteystiedot
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
