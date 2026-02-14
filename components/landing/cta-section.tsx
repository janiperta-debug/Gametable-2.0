import Link from "next/link"

export function CtaSection() {
  return (
    <section className="py-20 md:py-32 bg-[hsl(345,80%,8%)] relative overflow-hidden">
      {/* Decorative background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(45,80%,60%) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Decorative diamond */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-[hsl(45,80%,60%)]/30" />
          <div className="w-3 h-3 rotate-45 border border-[hsl(45,80%,60%)]/50" />
          <div className="h-px w-16 bg-[hsl(45,80%,60%)]/30" />
        </div>

        <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl text-[hsl(0,0%,98%)] mb-6 text-balance">
          Pöytäsi Odottaa
        </h2>

        <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,75%)] leading-relaxed mb-10 max-w-xl mx-auto">
          Liity GameTable-peliseuraan ja löydä uusi tapa nauttia
          lautapelaamisesta. Jäsenyys on ilmainen ja pysyy sellaisena.
        </p>

        <Link
          href="/profile"
          className="inline-block font-cinzel text-sm md:text-base uppercase tracking-wider px-10 py-4 bg-[hsl(45,80%,60%)] text-[hsl(345,80%,10%)] hover:bg-[hsl(45,80%,65%)] transition-all duration-300 shadow-lg shadow-[hsl(45,80%,60%)]/20"
        >
          Astu Kartanoon
        </Link>

        {/* Bottom ornament */}
        <div className="mt-16">
          <div className="text-[hsl(45,80%,60%)]/30 text-lg">&#10086;</div>
          <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[hsl(0,0%,50%)] mt-4">
            Perustettu Arvostetun Peliseuran Kunniaksi
          </p>
        </div>
      </div>
    </section>
  )
}
