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
        {/* Ornament */}
        <div className="text-[hsl(45,80%,60%)]/50 text-xl mb-6">&#10087;</div>

        <p className="font-cinzel text-xs uppercase tracking-[0.45em] text-[hsl(45,80%,60%)]/80 mb-6">
          Pöytäsi Odottaa
        </p>

        <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl text-[hsl(0,0%,98%)] mb-6 text-balance">
          Astu Kartanoon
        </h2>

        <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,70%)] leading-relaxed mb-10 max-w-xl mx-auto">
          Liity GameTable-peliseuraan ja löydä uusi tapa nauttia
          pöytäpelaamisesta — missä lajityypissä tahansa.
          Jäsenyys on ilmainen ja pysyy sellaisena.
        </p>

        <Link
          href="/profile"
          className="inline-block font-cinzel text-[0.8rem] font-semibold uppercase tracking-[0.18em] px-12 py-4 bg-gradient-to-br from-[hsl(45,80%,60%)] via-[hsl(45,75%,65%)] to-[hsl(45,80%,60%)] text-[hsl(345,80%,5%)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,168,76,0.4)] transition-all duration-300"
          style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}
        >
          Astu Kartanoon
        </Link>

        <p className="font-merriweather text-sm italic text-[hsl(0,0%,55%)] mt-5">
          — Ilmainen jäsenyys, aina —
        </p>
      </div>
    </section>
  )
}
