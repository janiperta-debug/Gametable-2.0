import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      {/* Ornate Crest */}
      <div className="mb-8">
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <svg viewBox="0 0 128 128" className="w-full h-full">
            {/* Outer decorative border */}
            <circle cx="64" cy="64" r="60" fill="none" stroke="rgb(251 191 36)" strokeWidth="2" opacity="0.3" />

            {/* Main shield shape */}
            <path
              d="M64 10 L90 25 L90 55 L85 75 L64 85 L43 75 L38 55 L38 25 Z"
              fill="rgb(127 29 29)"
              stroke="rgb(251 191 36)"
              strokeWidth="2"
            />

            {/* Inner decorative elements */}
            <rect x="50" y="35" width="28" height="20" fill="rgb(251 191 36)" />
            <rect x="52" y="37" width="24" height="16" fill="rgb(127 29 29)" />

            {/* Columns */}
            <rect x="54" y="39" width="4" height="12" fill="rgb(251 191 36)" />
            <rect x="60" y="39" width="4" height="12" fill="rgb(251 191 36)" />
            <rect x="66" y="39" width="4" height="12" fill="rgb(251 191 36)" />
            <rect x="72" y="39" width="4" height="12" fill="rgb(251 191 36)" />

            {/* Decorative flourishes */}
            <path d="M45 20 Q50 15 55 20" fill="none" stroke="rgb(251 191 36)" strokeWidth="1.5" />
            <path d="M73 20 Q78 15 83 20" fill="none" stroke="rgb(251 191 36)" strokeWidth="1.5" />
            <path d="M40 65 Q45 70 50 65" fill="none" stroke="rgb(251 191 36)" strokeWidth="1.5" />
            <path d="M78 65 Q83 70 88 65" fill="none" stroke="rgb(251 191 36)" strokeWidth="1.5" />

            {/* Crown elements */}
            <polygon points="58,25 64,15 70,25 67,30 61,30" fill="rgb(251 191 36)" />
            <circle cx="64" cy="18" r="2" fill="rgb(251 191 36)" />
          </svg>
        </div>
      </div>

      {/* Main Title */}
      <h1 className="text-6xl md:text-7xl font-bold text-yellow-400 mb-6 font-serif">GameTable</h1>

      {/* Decorative Line */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-px bg-yellow-400"></div>
        <div className="w-2 h-2 bg-yellow-400 rotate-45"></div>
        <div className="w-16 h-px bg-yellow-400"></div>
      </div>

      {/* Subtitle */}
      <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-6 tracking-wider">
        Welcome to Your Exclusive Gaming Manor
      </h2>

      {/* Description */}
      <p className="text-yellow-100 text-lg md:text-xl max-w-4xl mx-auto mb-8 leading-relaxed">
        Step into an elegant sanctuary where tabletop enthusiasts gather to discover remarkable games, forge lasting
        friendships, and create unforgettable gaming experiences.
      </p>

      {/* Tagline */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-1 h-1 bg-yellow-400 rotate-45"></div>
        <span className="text-yellow-400 text-sm font-medium tracking-widest uppercase">
          Est. for Distinguished Gaming Society
        </span>
        <div className="w-1 h-1 bg-yellow-400 rotate-45"></div>
      </div>

      {/* CTA Button */}
      <Button
        size="lg"
        className="theme-accent-gold px-12 py-6 text-lg font-medium tracking-wider transition-all duration-300"
      >
        Enter the Manor
      </Button>

      {/* Bottom Decorative Element */}
      <div className="mt-16">
        <div className="w-2 h-2 bg-yellow-400 rotate-45 mx-auto"></div>
      </div>
    </main>
  )
}
