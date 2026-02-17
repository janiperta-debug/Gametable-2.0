"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export function LandingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(345,80%,10%)]/95 backdrop-blur-sm border-b border-[hsl(45,80%,60%)]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/images/janope-logo.png"
              alt="Janope"
              className="w-10 h-10"
            />
            <span className="font-charm text-2xl text-[hsl(45,80%,60%)]">GameTable</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className="font-cinzel text-sm uppercase tracking-wide text-[hsl(0,0%,90%)] hover:text-[hsl(45,80%,60%)] transition-colors"
            >
              Ominaisuudet
            </button>
            <button
              onClick={() => scrollToSection("rooms")}
              className="font-cinzel text-sm uppercase tracking-wide text-[hsl(0,0%,90%)] hover:text-[hsl(45,80%,60%)] transition-colors"
            >
              Kartano
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="font-cinzel text-sm uppercase tracking-wide text-[hsl(0,0%,90%)] hover:text-[hsl(45,80%,60%)] transition-colors"
            >
              Miten se toimii
            </button>
            <button
              onClick={() => scrollToSection("community")}
              className="font-cinzel text-sm uppercase tracking-wide text-[hsl(0,0%,90%)] hover:text-[hsl(45,80%,60%)] transition-colors"
            >
              Yhteiso
            </button>
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="hidden sm:inline-block font-cinzel text-sm uppercase tracking-wide px-5 py-2 border border-[hsl(45,80%,60%)] text-[hsl(45,80%,60%)] hover:bg-[hsl(45,80%,60%)] hover:text-[hsl(345,80%,10%)] transition-all duration-300"
            >
              Astu Kartanoon
            </Link>
            <button
              className="md:hidden text-[hsl(45,80%,60%)] hover:text-[hsl(0,0%,98%)] transition-colors p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[hsl(45,80%,60%)]/20 py-4">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => scrollToSection("features")}
                className="font-cinzel text-sm uppercase tracking-wide text-[hsl(0,0%,90%)] hover:text-[hsl(45,80%,60%)] transition-colors py-2 text-left"
              >
                Ominaisuudet
              </button>
              <button
                onClick={() => scrollToSection("rooms")}
                className="font-cinzel text-sm uppercase tracking-wide text-[hsl(0,0%,90%)] hover:text-[hsl(45,80%,60%)] transition-colors py-2 text-left"
              >
                Kartano
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="font-cinzel text-sm uppercase tracking-wide text-[hsl(0,0%,90%)] hover:text-[hsl(45,80%,60%)] transition-colors py-2 text-left"
              >
                Miten se toimii
              </button>
              <button
                onClick={() => scrollToSection("community")}
                className="font-cinzel text-sm uppercase tracking-wide text-[hsl(0,0%,90%)] hover:text-[hsl(45,80%,60%)] transition-colors py-2 text-left"
              >
                Yhteiso
              </button>
              <Link
                href="/profile"
                className="sm:hidden font-cinzel text-sm uppercase tracking-wide px-5 py-2 border border-[hsl(45,80%,60%)] text-[hsl(45,80%,60%)] hover:bg-[hsl(45,80%,60%)] hover:text-[hsl(345,80%,10%)] transition-all duration-300 text-center mt-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Astu Kartanoon
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
