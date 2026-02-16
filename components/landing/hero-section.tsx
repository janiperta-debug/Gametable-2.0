import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/landing-hero.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[hsl(345,80%,8%)]/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(345,80%,8%)]/60 via-transparent to-[hsl(345,80%,8%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Crest */}
        <div className="mb-8">
          <img
            src="/images/mainhall-crest-original.png"
            alt="GameTable Manor Crest"
            className="w-24 h-24 md:w-32 md:h-32 mx-auto opacity-90"
          />
        </div>

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 md:w-24 bg-[hsl(45,80%,60%)]/40" />
          <span className="text-[hsl(45,80%,60%)]/60 font-cinzel text-xs uppercase tracking-[0.3em]">
            Ensiluokkainen Peliseura
          </span>
          <div className="h-px w-16 md:w-24 bg-[hsl(45,80%,60%)]/40" />
        </div>

        {/* Title */}
        <h1 className="font-charm text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-[hsl(0,0%,98%)] mb-6 text-balance leading-tight"
          style={{
            textShadow: "0 0 40px hsla(45,80%,60%,0.15), 0 4px 8px hsla(345,80%,5%,0.5)"
          }}
        >
          GameTable
        </h1>

        <h2 className="font-cinzel text-xl sm:text-2xl md:text-3xl text-[hsl(45,80%,60%)] mb-6 tracking-wide font-italic">
          Ensiluokkainen Pelikartanosi
        </h2>

        {/* Description */}
        <p className="font-merriweather text-base sm:text-lg md:text-xl text-[hsl(0,0%,70%)] max-w-3xl mx-auto leading-relaxed mb-10 px-4">
          Astu tyylikkääseen kokoontumispaikkaan, jossa jokainen pöytäpelaaja
          löytää kotinsa — olipa intohimosi lautapelit, roolipelit,
          miniatyyrit tai keräilykortit.
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-12">
          <div className="text-center">
            <div className="font-cinzel text-2xl md:text-3xl text-[hsl(45,80%,60%)]">20</div>
            <div className="font-cinzel text-xs uppercase tracking-wider text-[hsl(0,0%,70%)]">Teemahuonetta</div>
          </div>
          <div className="w-px h-8 bg-[hsl(45,80%,60%)]/30 hidden sm:block" />
          <div className="text-center">
            <div className="font-cinzel text-2xl md:text-3xl text-[hsl(45,80%,60%)]">1000+</div>
            <div className="font-cinzel text-xs uppercase tracking-wider text-[hsl(0,0%,70%)]">Pelia</div>
          </div>
          <div className="w-px h-8 bg-[hsl(45,80%,60%)]/30 hidden sm:block" />
          <div className="text-center">
            <div className="font-cinzel text-2xl md:text-3xl text-[hsl(45,80%,60%)]">Ilmainen</div>
            <div className="font-cinzel text-xs uppercase tracking-wider text-[hsl(0,0%,70%)]">Liittyminen</div>
          </div>
          <div className="w-px h-8 bg-[hsl(45,80%,60%)]/30 hidden sm:block" />
          <div className="text-center">
            <div className="font-cinzel text-2xl md:text-3xl text-[hsl(45,80%,60%)]">Kaikille</div>
            <div className="font-cinzel text-xs uppercase tracking-wider text-[hsl(0,0%,70%)]">Pöytäpelaajille</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/profile"
            className="font-cinzel text-sm md:text-base uppercase tracking-wider px-8 py-4 bg-[hsl(45,80%,60%)] text-[hsl(345,80%,10%)] hover:bg-[hsl(45,80%,65%)] transition-all duration-300 shadow-lg shadow-[hsl(45,80%,60%)]/20"
          >
            Astu Kartanoon
          </Link>
          <button
            onClick={() => {
              const el = document.getElementById("features")
              if (el) el.scrollIntoView({ behavior: "smooth" })
            }}
            className="font-cinzel text-sm md:text-base uppercase tracking-wider px-8 py-4 border border-[hsl(45,80%,60%)]/50 text-[hsl(45,80%,60%)] hover:border-[hsl(45,80%,60%)] hover:bg-[hsl(45,80%,60%)]/10 transition-all duration-300"
          >
            Tutustu Ominaisuuksiin
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 animate-bounce">
          <svg className="w-6 h-6 mx-auto text-[hsl(45,80%,60%)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
