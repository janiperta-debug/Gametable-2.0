"use client"

import { useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"

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

/* ════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════ */
export function LandingPage() {
  const wrapperRef = useReveal()

  return (
    <div
      ref={wrapperRef}
      className="min-h-screen font-dm-sans text-[#f2ece0] overflow-x-hidden"
      style={{ background: "#0c0906" }}
    >
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-55" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`
      }} />

      <LandingNav />
      <HeroSection />
      <StatementSection />
      <PlayersSection />
      <CoreFeaturesSection />
      <RoomsSection />
      <ManifestoSection />
      <CtaSection />
      <LandingFooter />
    </div>
  )
}

/* ────────────────────────────────────────────
   NAV
   ──────────────────────────────────────────── */
function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-6 lg:px-12 py-4 border-b border-[#f2ece0]/[0.07]"
      style={{ background: "rgba(12,9,6,0.82)", backdropFilter: "blur(20px)" }}
    >
      <a href="/" className="flex items-center gap-2.5 no-underline">
        <Image
          src="/images/gametable-logo.png"
          alt="GameTable logo"
          width={36}
          height={36}
          className="shrink-0"
        />
        <span className="font-charm text-2xl text-[#f2ece0] tracking-wide leading-none">
          Gametable
        </span>
      </a>

      <ul className="hidden md:flex items-center gap-8 list-none">
        <li>
          <button onClick={() => scrollTo("kokoelma")} className="text-xs font-medium text-[#7a6e5a] hover:text-[#f2ece0] tracking-wide transition-colors bg-transparent border-none cursor-pointer font-dm-sans">
            Kokoelma
          </button>
        </li>
        <li>
          <button onClick={() => scrollTo("yhteiso")} className="text-xs font-medium text-[#7a6e5a] hover:text-[#f2ece0] tracking-wide transition-colors bg-transparent border-none cursor-pointer font-dm-sans">
            {"Yhteis\u00f6"}
          </button>
        </li>
        <li>
          <button onClick={() => scrollTo("tapahtumat")} className="text-xs font-medium text-[#7a6e5a] hover:text-[#f2ece0] tracking-wide transition-colors bg-transparent border-none cursor-pointer font-dm-sans">
            Tapahtumat
          </button>
        </li>
        <li>
          <button onClick={() => scrollTo("huoneet")} className="text-xs font-medium text-[#7a6e5a] hover:text-[#f2ece0] tracking-wide transition-colors bg-transparent border-none cursor-pointer font-dm-sans">
            Huoneet
          </button>
        </li>
        <li>
          <a
            href="https://www.gametable.site"
            className="text-xs font-bold tracking-wide px-5 py-2 rounded-sm no-underline transition-opacity hover:opacity-85"
            style={{ background: "#c9953a", color: "#0c0906", letterSpacing: "0.05em" }}
          >
            {"Astu Kartanoon \u2192"}
          </a>
        </li>
      </ul>
    </nav>
  )
}

/* ────────────────────────────────────────────
   HERO
   ──────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="min-h-screen relative flex flex-col justify-end overflow-hidden">
      {/* BG image with effects to soften resolution */}
      <div className="absolute inset-0">
        {/* Base image with slight blur to mask grain */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Main%20hall%2001.jpg-DpsYcUHFaTwvTp9wXy5kieQgoDHKMM.jpeg')`,
            filter: "blur(1.5px) saturate(1.15) contrast(1.05)",
          }}
        />
        {/* Warm color wash to unify tones */}
        <div className="absolute inset-0" style={{ background: "rgba(30,20,8,0.18)", mixBlendMode: "multiply" }} />
        {/* Bottom-heavy gradient for text readability */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(12,9,6,0.4) 0%, rgba(12,9,6,0.1) 25%, rgba(12,9,6,0.3) 55%, rgba(12,9,6,0.92) 85%, rgba(12,9,6,1) 100%)"
        }} />
        {/* Vignette edges */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(12,9,6,0.6) 100%)"
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 lg:px-12 pb-16 lg:pb-20 max-w-[900px]">
        <div className="flex items-center gap-3 mb-7 opacity-0 animate-[fadeUp_0.8s_0.1s_forwards]">
          <div className="w-9 h-px bg-[#c9953a] opacity-60" />
          <span className="font-cormorant text-xs font-medium uppercase tracking-[0.22em] text-[#c9953a] opacity-80">
            {"Kaikkien p\u00f6yt\u00e4pelaajien kartano"}
          </span>
        </div>

        <h1 className="font-cormorant font-semibold leading-none tracking-tight text-[#f2ece0] mb-6 opacity-0 animate-[fadeUp_0.8s_0.2s_forwards]"
          style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)", letterSpacing: "-0.02em" }}
        >
          Kaikkien<br />
          {"p\u00f6yt\u00e4pelaajien"}<br />
          <em className="italic text-[#e8c060] font-light">koti.</em>
        </h1>

        <p className="text-base font-light text-[#c8bca8] leading-relaxed max-w-[560px] mb-9 opacity-0 animate-[fadeUp_0.8s_0.35s_forwards]"
          style={{ lineHeight: 1.85 }}
        >
          {"Ensimm\u00e4inen alusta joka tunnustaa "}
          <strong className="text-[#f2ece0] font-medium">{"kaikki p\u00f6yt\u00e4pelit tasa-arvoisina"}</strong>
          {" \u2014 lautapelaajasta roolipelaajaan, mininatyyrimalaarista kortinker\u00e4\u00e4j\u00e4\u00e4n. Yksi koti koko harrastukselle."}
        </p>

        <div className="flex items-center gap-4 opacity-0 animate-[fadeUp_0.8s_0.5s_forwards]">
          <a
            href="https://www.gametable.site"
            className="inline-block px-9 py-4 rounded-sm text-sm font-bold no-underline tracking-wide transition-opacity hover:opacity-85"
            style={{ background: "#c9953a", color: "#0c0906", boxShadow: "0 8px 32px rgba(201,149,58,0.3)", letterSpacing: "0.05em" }}
          >
            {"Astu Kartanoon \u2192"}
          </a>
          <button
            onClick={() => scrollTo("kokoelma")}
            className="font-cormorant italic text-base text-[#c8bca8] hover:text-[#f2ece0] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-2"
          >
            {"Tutustu \u2193"}
          </button>
        </div>
      </div>

      {/* Social proof */}
      <div className="absolute bottom-0 right-5 lg:right-12 z-10 pb-16 lg:pb-20 flex flex-col items-end gap-2 opacity-0 animate-[fadeUp_0.8s_0.7s_forwards] hidden sm:flex">
        {[
          { val: "50+", label: "pelaajaa kartanossa" },
          { val: "1 v", label: "toiminnassa" },
          { val: "0\u20ac", label: "j\u00e4senyys, aina" },
        ].map((s) => (
          <div key={s.val} className="flex items-center gap-3 rounded-md px-4 py-2.5"
            style={{ background: "rgba(12,9,6,0.7)", border: "1px solid rgba(242,236,224,0.13)", backdropFilter: "blur(10px)" }}
          >
            <div>
              <div className="font-cormorant text-2xl font-semibold text-[#c9953a] leading-none">{s.val}</div>
              <div className="text-[0.72rem] text-[#7a6e5a] font-normal">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   STATEMENT
   ──────────────────────────────────────────── */
function StatementSection() {
  return (
    <section className="py-16 lg:py-20 px-5 lg:px-12 border-t border-b border-[#f2ece0]/[0.07]" style={{ background: "#100d09" }}>
      <div className="max-w-[780px] mx-auto text-center reveal">
        <span className="font-cormorant text-3xl text-[#c9953a] opacity-40 block mb-7">&#10087;</span>
        <h2 className="font-cormorant font-normal italic text-[#c8bca8] leading-relaxed"
          style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.5, letterSpacing: "-0.01em" }}
        >
          Muut alustat valitsevat puolensa.<br />
          <strong className="not-italic font-semibold text-[#f2ece0]">GameTable ei valitse.</strong><br />
          {"T\u00e4\u00e4ll\u00e4 jokainen p\u00f6yt\u00e4peli on yht\u00e4 arvokas."}
        </h2>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   PLAYERS (Who is this for)
   ──────────────────────────────────────────── */
const playerTypes = [
  {
    key: "lautapelit",
    type: "Lautapelaaja",
    icon: "\u265F\uFE0F",
    desc: "Luetteloi kokoelmasi, l\u00f6yd\u00e4 pelikavereita ja seuraa jokaista peli-iltaa. Carcassonnesta Gloomhaveniin.",
    gradient: "linear-gradient(90deg, #c9953a, #e8c060)",
  },
  {
    key: "roolipelit",
    type: "Roolipelaaja",
    icon: "\uD83C\uDFB2",
    desc: "L\u00f6yd\u00e4 pelinjohtajia ja pelaajia, hallinnoi kampanjoita ja pid\u00e4 hahmohistoriasi tallessa sessio toisensa j\u00e4lkeen.",
    gradient: "linear-gradient(90deg, #6b3fa0, #9b6fd4)",
  },
  {
    key: "miniatyyrit",
    type: "Miniatyyriharrastaja",
    icon: "\u2694\uFE0F",
    desc: "Tallenna armeijasilistasi, jaa maalaamasi miniatyyrit ja l\u00f6yd\u00e4 muita Warhammer- ja wargame-harrastajia.",
    gradient: "linear-gradient(90deg, #2a7a4a, #4aaa6a)",
  },
  {
    key: "kortit",
    type: "Kortinker\u00e4\u00e4j\u00e4",
    icon: "\uD83C\uDCCF",
    desc: "Hallinnoi kokoelmaasi, rakenna pakkoja ja kauppaa korttiyhteison sis\u00e4ll\u00e4. Pok\u00e9mon, Magic, Lorcana ja muut.",
    gradient: "linear-gradient(90deg, #1a4a8a, #3a7acc)",
  },
]

function PlayersSection() {
  return (
    <section className="py-16 lg:py-24 px-5 lg:px-12">
      <div className="reveal">
        <div className="font-cormorant text-xs font-medium uppercase tracking-[0.2em] text-[#c9953a] mb-2.5 flex items-center gap-2.5">
          <span className="w-7 h-px bg-[#c9953a] opacity-60 inline-block" />
          Kenelle
        </div>
        <h2 className="font-cormorant font-semibold tracking-tight text-[#f2ece0] mb-10 leading-none"
          style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.02em" }}
        >
          {"Sinulle \u2014 "}<em className="italic text-[#e8c060] font-light">lajityypist{"\\u00e4".replace("\\u00e4", "\u00e4")} riippumatta.</em>
        </h2>
      </div>

      {/* Player grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-xl overflow-hidden border border-[#f2ece0]/[0.07] reveal rd1"
        style={{ background: "rgba(242,236,224,0.07)" }}
      >
        {playerTypes.map((p) => (
          <div key={p.key} className="relative overflow-hidden p-7 lg:p-9 transition-colors group"
            style={{ background: "#1e1912" }}
          >
            {/* Top accent bar on hover */}
            <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: p.gradient }}
            />
            <span className="text-3xl block mb-4">{p.icon}</span>
            <div className="font-cormorant text-xl font-semibold text-[#f2ece0] mb-2 tracking-tight">{p.type}</div>
            <p className="text-xs text-[#7a6e5a] font-light leading-relaxed" style={{ lineHeight: 1.7 }}>{p.desc}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-[#c9953a] opacity-70">
              <span className="font-cormorant text-sm">&#10087;</span> Tervetuloa
            </div>
          </div>
        ))}
      </div>

      {/* = Sinu00e4 */}
      <div className="mt-px rounded-b-xl px-7 py-6 flex items-center gap-4 overflow-hidden reveal rd2"
        style={{ background: "#1e1912", border: "1px solid rgba(242,236,224,0.07)", borderTop: "none" }}
      >
        <span className="font-cormorant text-5xl lg:text-6xl font-light text-[#c9953a] opacity-50 leading-none">=</span>
        <span className="font-cormorant text-5xl lg:text-6xl font-semibold text-[#f2ece0] italic leading-none tracking-tight">{"Sin\u00e4"}</span>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   CORE FOUR FEATURES
   ──────────────────────────────────────────── */
function CoreFeaturesSection() {
  return (
    <section id="kokoelma" className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#f2ece0]/[0.07]" style={{ background: "#100d09" }}>
      {/* 01 – Collection */}
      <FeatureBlock
        number="01"
        kicker="Kokoelma"
        title={<>Kaikki pelisi.<br /><em className="italic text-[#e8c060] font-light">Yhdess{"\\u00e4".replace("\\u00e4", "\u00e4")} paikassa.</em></>}
        desc={<>Lautapelit, RPG-kirjat, miniatyyrit, ker{"\\u00e4".replace("\\u00e4", "\u00e4")}ilykortit &mdash; <strong className="text-[#c8bca8] font-medium">kaikki lajityypit saman kokoelman alla</strong>, ei erikseen. Luetteloi, arvioi, seuraa pelikertoja ja historias.</>}
        items={[
          "Lautapelit, RPG, miniatyyrit, kortit \u2014 kaikki tuetusti",
          "Pelauskertojen ja sessioiden seuranta",
          "Arvostelut ja henkil\u00f6kohtaiset muistiinpanot",
          "Haluamislista ja toivomuslista",
          "Jako \u2014 n\u00e4yt\u00e4 kokoelmasi muille",
        ]}
        visual={<CollectionMock />}
      />

      {/* 02 – Community */}
      <div id="yhteiso">
        <FeatureBlock
          number="02"
          kicker={"Yhteis\u00f6"}
          title={<>{"L\u00f6yd\u00e4 "}<em className="italic text-[#e8c060] font-light">oman lajisi</em><br />pelaajat.</>}
          desc={<>Etsi pelaajia juuri sinun harrastuksestasi &mdash; <strong className="text-[#c8bca8] font-medium">lajityyppi, sijainti, saatavuus</strong>. Yksityisviestit, {"yhteis\u00f6profiilit"} ja kauppapaikka kaikki saman {"yhteis\u00f6n"} {"sis\u00e4ll\u00e4"}.</>}
          items={[
            "Hae pelaajia lajityypin ja sijainnin mukaan",
            "L\u00f6yd\u00e4 pelinjohtajia kampanjaan tai maalauspartneri",
            "Yksityiset viestit ja sessioiden koordinointi",
            "Kauppapaikka \u2014 osta, myy ja vaihda yhteis\u00f6ss\u00e4",
            "Profiilit jotka kertovat mit\u00e4 oikeasti harrastat",
          ]}
          visual={<CommunityMock />}
          reverse
        />
      </div>

      {/* 03 – Events */}
      <div id="tapahtumat">
        <FeatureBlock
          number="03"
          kicker="Tapahtumat"
          title={<>Peli-illat.<br /><em className="italic text-[#e8c060] font-light">Turnaukset. Kampanjat.</em></>}
          desc={<>Luo tapahtumia tai liity niihin &mdash; <strong className="text-[#c8bca8] font-medium">{"sis\u00e4\u00e4nrakennettu ilmoittautuminen"}</strong>, pelilistan hallinta ja osallistujien koordinointi. Kaikki {"p\u00f6yt\u00e4pelityypit"} tuettuina.</>}
          items={[
            "Peli-illat, kampanjasessiot, turnaukset",
            "Maalaus- ja showcase-tapahtumat",
            "Sis\u00e4\u00e4nrakennettu ilmoittautuminen",
            "Pelilistan hallinta ja \u00e4\u00e4nestys",
            "Avoimet ja suljetut tapahtumat",
          ]}
          visual={<EventsMock />}
        />
      </div>

      {/* 04 – Tools */}
      <FeatureBlock
        number="04"
        kicker={"Ty\u00f6kalut"}
        title={<>Kasvava<br /><em className="italic text-[#e8c060] font-light">arsenaalisi.</em></>}
        desc={<>Kokoelma, {"yhteis\u00f6"} ja tapahtumat ovat vasta alku. GameTable rakentaa jatkuvasti uusia {"ty\u00f6kaluja"} jotka <strong className="text-[#c8bca8] font-medium">{"syvent\u00e4v\u00e4t harrastustasi"}</strong> &mdash; {"lajityypist\u00e4 riippumatta"}.</>}
        items={[
          "Armeijanrakentaja miniatyyriharrastajille",
          "Hahmonrakentaja RPG-pelaajille",
          "Pakkainrakentaja kortinker\u00e4\u00e4jille",
          "Kampanjap\u00e4iv\u00e4kirja seikkailuille",
          "Tilastokeskus kaikelle pelaamiselle",
        ]}
        visual={<ToolsMock />}
        reverse
        last
      />
    </section>
  )
}

/* Feature block layout */
function FeatureBlock({
  number, kicker, title, desc, items, visual, reverse, last,
}: {
  number: string
  kicker: string
  title: React.ReactNode
  desc: React.ReactNode
  items: string[]
  visual: React.ReactNode
  reverse?: boolean
  last?: boolean
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center reveal ${!last ? "mb-16 lg:mb-24 pb-16 lg:pb-24 border-b border-[#f2ece0]/[0.07]" : ""}`}>
      <div className={reverse ? "lg:order-2" : ""}>
        <div className="font-cormorant font-light text-[#c9953a] opacity-[0.12] leading-none -mb-4 lg:-mb-6"
          style={{ fontSize: "clamp(3.5rem, 5vw, 5rem)", letterSpacing: "-0.04em" }}
        >
          {number}
        </div>
        <div className="font-cormorant text-xs font-medium uppercase tracking-[0.2em] text-[#c9953a] mb-2.5 flex items-center gap-2.5">
          <span className="w-7 h-px bg-[#c9953a] opacity-60 inline-block" />
          {kicker}
        </div>
        <h2 className="font-cormorant font-semibold text-[#f2ece0] mb-4 leading-none tracking-tight"
          style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", letterSpacing: "-0.02em" }}
        >
          {title}
        </h2>
        <p className="text-[0.95rem] text-[#7a6e5a] font-light mb-6" style={{ lineHeight: 1.9 }}>
          {desc}
        </p>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-2.5 text-[0.82rem] text-[#7a6e5a] font-light" style={{ lineHeight: 1.5 }}>
              <span className="text-[#c9953a] opacity-60 font-cormorant text-xs shrink-0 mt-0.5">&#10087;</span>
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        {visual}
      </div>
    </div>
  )
}

/* ── Mock cards ── */

function MockCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6"
      style={{ background: "#1e1912", border: "1px solid rgba(242,236,224,0.13)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}
    >
      <div className="font-cormorant text-xs italic text-[#c9953a] tracking-wide mb-4 opacity-80">{title}</div>
      {children}
    </div>
  )
}

function MockGameRow({ icon, name, type, badge }: { icon: string; name: string; type: string; badge: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-1.5 text-xs"
      style={{ background: "#252018", border: "1px solid rgba(242,236,224,0.07)" }}
    >
      <span className="text-base shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[#f2ece0]">{name}</div>
        <div className="text-[0.62rem] text-[#7a6e5a]">{type}</div>
      </div>
      <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide shrink-0"
        style={{ background: "rgba(201,149,58,0.12)", color: "#c9953a", border: "1px solid rgba(201,149,58,0.22)" }}
      >
        {badge}
      </span>
    </div>
  )
}

function CollectionMock() {
  return (
    <MockCard title={"Kokoelmani \u2014 84 nimikett\u00e4"}>
      <MockGameRow icon={"\u265F\uFE0F"} name="Gloomhaven" type={"Lautapeli \u00b7 Euro \u00b7 2017"} badge="14 sessiota" />
      <MockGameRow icon={"\uD83C\uDFB2"} name="Player's Handbook 5e" type={"RPG \u00b7 D&D"} badge="Kampanja" />
      <MockGameRow icon={"\u2694\uFE0F"} name="Space Marines 2.0" type={"Miniatyyri \u00b7 Warhammer 40K"} badge="Maalattu" />
      <MockGameRow icon={"\uD83C\uDCCF"} name="Pikachu VMAX" type={"Pok\u00e9mon TCG \u00b7 Rare Holo"} badge="PSA 9" />
      <MockGameRow icon={"\u265F\uFE0F"} name="Pandemic Legacy S1" type={"Lautapeli \u00b7 Kampanja"} badge={"L\u00e4p\u00e4isty"} />
    </MockCard>
  )
}

function CommunityMock() {
  const players = [
    { icon: "\uD83C\uDFB2", name: "Mikael K.", tags: ["D&D 5e", "Pathfinder", "Helsinki"] },
    { icon: "\u265F\uFE0F", name: "Sara L.", tags: ["Euro", "Yksinpeli", "Espoo"] },
    { icon: "\u2694\uFE0F", name: "Petteri M.", tags: ["Warhammer", "Maalaus", "Vantaa"] },
    { icon: "\uD83C\uDCCF", name: "Aino V.", tags: ["Pok\u00e9mon TCG", "Magic", "Tampere"] },
  ]
  return (
    <MockCard title="Pelaajia l\u00e4hialueeltasi">
      {players.map((p) => (
        <div key={p.name} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-1.5"
          style={{ background: "#252018", border: "1px solid rgba(242,236,224,0.07)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
            style={{ background: "rgba(201,149,58,0.22)" }}
          >
            {p.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-[#f2ece0]">{p.name}</div>
            <div className="flex gap-1 flex-wrap mt-1">
              {p.tags.map((t) => (
                <span key={t} className="text-[0.56rem] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(201,149,58,0.12)", color: "#c9953a", border: "1px solid rgba(201,149,58,0.22)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button className="text-[0.65rem] font-bold px-2.5 py-1 rounded-sm shrink-0 border-none cursor-pointer font-dm-sans"
            style={{ background: "#c9953a", color: "#0c0906" }}
          >
            Viesti
          </button>
        </div>
      ))}
    </MockCard>
  )
}

function EventsMock() {
  const events = [
    { date: "14", month: "Helmi", name: "Lautapeli-ilta \u2014 Gloomhaven jatkuu", sub: "\u265F\uFE0F Kampanja \u00b7 Helsinki \u00b7 4/6 paikkaa", count: 4 },
    { date: "18", month: "Helmi", name: "D&D 5e \u2014 Uusi kampanja alkaa", sub: "\uD83C\uDFB2 RPG \u00b7 Espoo \u00b7 3/5 paikkaa", count: 3 },
    { date: "22", month: "Helmi", name: "Pok\u00e9mon TCG -turnaus", sub: "\uD83C\uDCCF TCG \u00b7 Tampere \u00b7 12/20 paikkaa", count: 12 },
    { date: "01", month: "Maalis", name: "Warhammer 40K maalausilta", sub: "\u2694\uFE0F Miniatyyri \u00b7 Vantaa \u00b7 5/8 paikkaa", count: 5 },
  ]
  return (
    <MockCard title={"Tapahtumat l\u00e4hialueella"}>
      {events.map((e) => (
        <div key={e.name} className="flex items-center gap-3 px-3.5 py-3 rounded-lg mb-1.5"
          style={{ background: "#252018", border: "1px solid rgba(242,236,224,0.07)" }}
        >
          <div className="text-center min-w-[32px]">
            <div className="font-cormorant text-lg font-semibold text-[#c9953a] leading-none">{e.date}</div>
            <div className="text-[0.55rem] text-[#7a6e5a] uppercase tracking-wide">{e.month}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-[#f2ece0]">{e.name}</div>
            <div className="text-[0.62rem] text-[#7a6e5a] mt-0.5">{e.sub}</div>
          </div>
          <div className="text-[0.65rem] text-[#7a6e5a] flex items-center gap-1 shrink-0">
            {e.count} {"\u2192"}
          </div>
        </div>
      ))}
    </MockCard>
  )
}

function ToolsMock() {
  const tools = [
    { icon: "\u2694\uFE0F", name: "Armeijanrakentaja", badge: "Tulossa", desc: "Rakenna, tallenna ja jaa miniatyyriarmeijoita. Pisteytyslaskuri ja yksikk\u00f6listat.", coming: false },
    { icon: "\uD83C\uDFB2", name: "Hahmonrakentaja", badge: "Tulossa", desc: "RPG-hahmojen hallinta \u2014 ominaisuudet, varusteet ja kampanjahistoria.", coming: false },
    { icon: "\uD83C\uDCCF", name: "Pakkainrakentaja", badge: "Tulossa", desc: "Rakenna ja optimoi korttipakkoja, analysoi metatrendej\u00e4.", coming: false },
    { icon: "\uD83D\uDCD6", name: "Kampanjap\u00e4iv\u00e4kirja", badge: "Suunnitteilla", desc: "Sessiomuistiinpanot, NPC:t, kartat \u2014 el\u00e4v\u00e4 arkisto seikkailullesi.", coming: true },
  ]
  return (
    <MockCard title={"Ty\u00f6kalupakki"}>
      {tools.map((t) => (
        <div key={t.name} className={`rounded-lg p-3.5 mb-1.5 cursor-pointer transition-colors ${t.coming ? "opacity-45" : ""}`}
          style={{ background: "#252018", border: "1px solid rgba(242,236,224,0.07)" }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{t.icon}</span>
            <span className="font-semibold text-xs text-[#f2ece0]">{t.name}</span>
            <span className="ml-auto text-[0.56rem] font-bold px-1.5 py-0.5 rounded-sm"
              style={t.coming
                ? { background: "rgba(242,236,224,0.05)", color: "#7a6e5a", border: "1px solid rgba(242,236,224,0.07)" }
                : { background: "rgba(201,149,58,0.12)", color: "#c9953a", border: "1px solid rgba(201,149,58,0.22)" }
              }
            >
              {t.badge}
            </span>
          </div>
          <div className="text-[0.7rem] text-[#7a6e5a] font-light leading-relaxed">{t.desc}</div>
        </div>
      ))}
    </MockCard>
  )
}

/* ────────────────────────────────────────────
   ROOMS
   ──────────────────────────────────────────── */
const rooms = [
  { img: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Main%20hall%2001.jpg-DpsYcUHFaTwvTp9wXy5kieQgoDHKMM.jpeg", floor: "Pohjakerros \u00b7 Avattu", name: "P\u00e4\u00e4sali", mood: "Viininpunainen & kulta" },
  { img: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Library_preview-JMul7atyfEMRiPbgmCiap1yOhU67gu.jpg", floor: "Pohjakerros \u00b7 Avattu", name: "Kirjasto", mood: "Mahonki & hopea" },
  { img: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Firesidelounge_preview-kxdZv4DDhz1Te5QCSLIrUuqBz7GLrN.jpg", floor: "Pohjakerros \u00b7 Avattu", name: "Takkahuone", mood: "Obsidiaani & liekki" },
  { img: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Conservatory_preview-AwHbu34NGqKXTrNKWBhpUPuKlJg2L6.jpg", floor: "Pohjakerros \u00b7 Lukittu", name: "Talvipuutarha", mood: "Mets\u00e4nvihre\u00e4 & kupari" },
]

function RoomsSection() {
  return (
    <section id="huoneet" className="py-16 lg:py-24 px-5 lg:px-12 border-t border-[#f2ece0]/[0.07]">
      {/* Intro row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center mb-12 lg:mb-16 reveal">
        <div>
          <div className="font-cormorant text-xs font-medium uppercase tracking-[0.2em] text-[#c9953a] mb-2.5 flex items-center gap-2.5">
            <span className="w-7 h-px bg-[#c9953a] opacity-60 inline-block" />
            Kartano
          </div>
          <h2 className="font-cormorant font-semibold text-[#f2ece0] mb-4 leading-tight tracking-tight"
            style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", letterSpacing: "-0.02em" }}
          >
            Pelaat.<br /><em className="italic text-[#e8c060] font-light">Kartano kasvaa.</em>
          </h2>
          <p className="text-sm text-[#7a6e5a] font-light" style={{ lineHeight: 1.9 }}>
            {"K\u00e4yt\u00e4t GameTablea \u2014 ja samalla ansaitset XP:t\u00e4 ja avaat kartanon huoneita. Et ole erikseen p\u00e4\u00e4tt\u00e4nyt pelata peli\u00e4. Se tapahtuu itsest\u00e4\u00e4n."}
          </p>
          <p className="text-sm text-[#7a6e5a] font-light mt-3" style={{ lineHeight: 1.9 }}>
            {"Jokainen huone on oma tunnelmansa \u2014 oma v\u00e4rimaailmansa, oma persoonallisuutensa. Huone jonka avaat on sinun."}
          </p>
        </div>

        <div className="flex flex-col gap-3 reveal rd1">
          {/* XP track */}
          <div className="rounded-xl p-5" style={{ background: "#1e1912", border: "1px solid rgba(242,236,224,0.13)" }}>
            <div className="text-[0.68rem] font-semibold uppercase tracking-widest text-[#7a6e5a] mb-2">
              {"Esimerkki \u00b7 Taso 12"}
            </div>
            <div className="h-[5px] rounded-full overflow-hidden mb-2" style={{ background: "#252018" }}>
              <div className="h-full w-3/4 rounded-full" style={{ background: "linear-gradient(90deg, #a87830, #e8c060)" }} />
            </div>
            <div className="flex justify-between text-[0.68rem] text-[#7a6e5a]">
              <span className="font-cormorant text-base font-semibold text-[#c9953a]">1,850 XP</span>
              <span>550 XP seuraavaan tasoon</span>
            </div>
          </div>

          {/* Quote */}
          <p className="text-xs text-[#7a6e5a] italic font-cormorant leading-relaxed" style={{ lineHeight: 1.6 }}>
            {"\"Huoneen avaaminen tuntui palkinnolta \u2014 en edes huomannut ker\u00e4nneeni XP:t\u00e4, se vain tapahtui.\""}
            <br />
            <span className="text-[#c9953a] opacity-60 text-[0.75rem]">{"— GameTable-j\u00e4sen"}</span>
          </p>
        </div>
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-xl overflow-hidden border border-[#f2ece0]/[0.07] reveal rd2"
        style={{ background: "rgba(242,236,224,0.07)" }}
      >
        {rooms.map((r) => (
          <div key={r.name} className="relative overflow-hidden cursor-pointer group" style={{ aspectRatio: "3/4" }}>
            <img src={r.img} alt={r.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 flex flex-col justify-end p-3 lg:p-4 transition-all"
              style={{ background: "linear-gradient(to top, rgba(12,9,6,0.92) 0%, rgba(12,9,6,0.2) 55%, transparent 100%)" }}
            >
              <div className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#c9953a] opacity-70 mb-1">{r.floor}</div>
              <div className="font-cormorant text-lg font-semibold text-[#f2ece0] leading-tight mb-1">{r.name}</div>
              <div className="text-[0.65rem] text-[#7a6e5a] italic font-cormorant">{r.mood}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center mt-7 font-cormorant text-base italic text-[#7a6e5a] reveal rd3">
        <span className="text-[#c9953a]">20 huonetta</span>{" odottaa \u2014 pohjakerros, toinen kerros, kellari."}<br />
        Jokainen avautuu kun olet valmis.
      </p>
    </section>
  )
}

/* ────────────────────────────────────────────
   MANIFESTO
   ──────────────────────────────────────────── */
function ManifestoSection() {
  return (
    <section className="relative py-24 lg:py-28 px-5 lg:px-12 overflow-hidden border-t border-[#f2ece0]/[0.07]"
      style={{ background: "#100d09" }}
    >
      {/* Decorative background glyph */}
      <span className="absolute -top-24 -right-12 font-cormorant text-[#c9953a] opacity-[0.025] leading-none pointer-events-none select-none"
        style={{ fontSize: "28rem" }}
      >
        &#10087;
      </span>

      <div className="max-w-[720px] mx-auto text-center relative z-10 reveal">
        <span className="font-cormorant text-3xl text-[#c9953a] opacity-40 block mb-7">&#10087;</span>
        <h2 className="font-cormorant font-normal italic text-[#c8bca8] mb-7"
          style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 1.45, letterSpacing: "-0.01em" }}
        >
          {"\u201CP\u00f6yt\u00e4pelaaminen on yksi harrastus \u2014"}<br />
          <strong className="not-italic font-semibold text-[#f2ece0]">{"ei nelj\u00e4\u00e4 erillist\u00e4 yhteis\u00f6\u00e4"}</strong><br />
          {"jotka eiv\u00e4t puhu toisilleen.\u201D"}
        </h2>
        <p className="text-sm text-[#7a6e5a] font-light max-w-[520px] mx-auto mb-3" style={{ lineHeight: 1.95 }}>
          {"GameTable syntyi koska sellaista paikkaa ei ollut. Lautapelaajat olivat BGG:ll\u00e4, roolipelaajat Discordissa, miniatyyriharrastajat Reddittiss\u00e4, kortinker\u00e4\u00e4j\u00e4t omilla foorumeillaan. Jokainen omassa siilossaan."}
        </p>
        <p className="text-sm text-[#7a6e5a] font-light max-w-[520px] mx-auto" style={{ lineHeight: 1.95 }}>
          {"Kartanossa on p\u00f6yd\u00e4ss\u00e4 paikka kaikille."}
        </p>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   CTA
   ──────────────────────────────────────────── */
function CtaSection() {
  return (
    <section className="relative py-24 lg:py-28 px-5 lg:px-12 text-center overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center bottom, rgba(201,149,58,0.08) 0%, transparent 65%)" }} />

      <span className="font-cormorant text-3xl text-[#c9953a] opacity-40 block mb-4 relative reveal">&#10087;</span>
      <h2 className="font-cormorant font-semibold text-[#f2ece0] mb-4 relative reveal"
        style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
      >
        {"P\u00f6yt\u00e4si"}<br /><em className="italic text-[#e8c060] font-light">odottaa.</em>
      </h2>
      <p className="text-[0.95rem] text-[#7a6e5a] font-light mb-10 relative reveal rd1" style={{ lineHeight: 1.8 }}>
        {"Liity GameTable-peliseuraan. Ilmainen, aina."}<br />
        {"Kaikki p\u00f6yt\u00e4pelaajat tervetulleita \u2014 lajityypist\u00e4 riippumatta."}
      </p>
      <a
        href="https://www.gametable.site"
        className="inline-block px-9 py-4 rounded-sm text-sm font-bold no-underline tracking-wide transition-opacity hover:opacity-85 relative reveal rd2"
        style={{ background: "#c9953a", color: "#0c0906", boxShadow: "0 8px 32px rgba(201,149,58,0.3)", letterSpacing: "0.05em" }}
      >
        {"Astu Kartanoon \u2192"}
      </a>
      <div className="mt-5 font-cormorant italic text-sm text-[#7a6e5a] opacity-60 relative reveal rd3">
        {"— Ilmainen j\u00e4senyys, aina —"}
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────
   FOOTER
   ──────────────────────────────────────────── */
function LandingFooter() {
  return (
    <footer className="flex flex-col md:flex-row justify-between items-center gap-4 px-5 lg:px-12 py-8 border-t border-[#f2ece0]/[0.07]"
      style={{ background: "#100d09" }}
    >
      <a href="/" className="flex items-center gap-2 no-underline">
        <Image
          src="/images/gametable-logo.png"
          alt="GameTable logo"
          width={28}
          height={28}
          className="shrink-0"
        />
        <span className="font-charm text-xl text-[#f2ece0] leading-none">
          Gametable
        </span>
      </a>
      <p className="text-[0.72rem] text-[#7a6e5a]">{"© 2025 GameTable \u00b7 Kaikki oikeudet pid\u00e4tet\u00e4\u00e4n."}</p>
      <div className="flex gap-6">
        <Link href="/terms-page" className="text-[0.72rem] text-[#7a6e5a] no-underline hover:text-[#f2ece0] transition-colors">Ehdot</Link>
        <Link href="/privacy-page" className="text-[0.72rem] text-[#7a6e5a] no-underline hover:text-[#f2ece0] transition-colors">Tietosuoja</Link>
        <Link href="/contact" className="text-[0.72rem] text-[#7a6e5a] no-underline hover:text-[#f2ece0] transition-colors">Yhteystiedot</Link>
      </div>
    </footer>
  )
}
