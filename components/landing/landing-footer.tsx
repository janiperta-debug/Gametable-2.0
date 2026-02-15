import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="py-12 bg-[hsl(345,80%,6%)] border-t border-[hsl(45,80%,60%)]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/images/mainhall-crest-original.png"
              alt="GameTable Crest"
              className="w-8 h-8 opacity-60"
            />
            <span className="font-charm text-xl text-[hsl(45,80%,60%)]/60">
              GameTable
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/terms-page"
              className="font-cinzel text-xs uppercase tracking-wider text-[hsl(0,0%,50%)] hover:text-[hsl(45,80%,60%)] transition-colors"
            >
              Ehdot
            </Link>
            <Link
              href="/privacy-page"
              className="font-cinzel text-xs uppercase tracking-wider text-[hsl(0,0%,50%)] hover:text-[hsl(45,80%,60%)] transition-colors"
            >
              Tietosuoja
            </Link>
            <Link
              href="/contact"
              className="font-cinzel text-xs uppercase tracking-wider text-[hsl(0,0%,50%)] hover:text-[hsl(45,80%,60%)] transition-colors"
            >
              Yhteystiedot
            </Link>
          </div>

          {/* Copyright */}
          <p className="font-merriweather text-xs text-[hsl(0,0%,40%)]">
            {"\u00A9"} {new Date().getFullYear()} GameTable Kartano. Kaikki oikeudet pidätetään.
          </p>
        </div>
      </div>
    </footer>
  )
}
