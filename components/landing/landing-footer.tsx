import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="py-12 bg-[hsl(345,80%,5%)] border-t border-[hsl(45,80%,60%)]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ornamental divider */}
        <div className="flex items-center gap-4 max-w-[400px] mx-auto mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(45,80%,60%)] to-transparent opacity-40" />
          <span className="text-[hsl(45,80%,60%)]/50 text-base">&#10087;</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(45,80%,60%)] to-transparent opacity-40" />
        </div>

        <div className="flex flex-col items-center gap-2 mb-8">
          <span className="font-charm text-xl font-bold text-[hsl(45,80%,60%)] tracking-wider">
            GameTable
          </span>
          <p className="font-merriweather text-sm italic text-[hsl(0,0%,55%)]">
            Perustettu Kaikkien Pöytäpelaajien Kunniaksi
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <Link
            href="/terms-page"
            className="font-merriweather text-sm text-[hsl(0,0%,55%)] hover:text-[hsl(45,80%,60%)] transition-colors tracking-wide"
          >
            Ehdot
          </Link>
          <Link
            href="/privacy-page"
            className="font-merriweather text-sm text-[hsl(0,0%,55%)] hover:text-[hsl(45,80%,60%)] transition-colors tracking-wide"
          >
            Tietosuoja
          </Link>
          <Link
            href="/contact"
            className="font-merriweather text-sm text-[hsl(0,0%,55%)] hover:text-[hsl(45,80%,60%)] transition-colors tracking-wide"
          >
            Yhteystiedot
          </Link>
        </div>

        {/* Copyright */}
        <p className="font-merriweather text-xs text-[hsl(0,0%,35%)] text-center">
          {"\u00A9"} {new Date().getFullYear()} GameTable Kartano. Kaikki oikeudet pidätetään.
        </p>
      </div>
    </footer>
  )
}
