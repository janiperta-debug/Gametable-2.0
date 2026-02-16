const gamerTypes = [
  { icon: "dice", label: "Lautapelaajat" },
  { icon: "dragon", label: "Roolipelaajat" },
  { icon: "swords", label: "Miniatyyriharrastajat" },
  { icon: "cards", label: "Keräilykortit" },
  { icon: "castle", label: "Seikkailut" },
  { icon: "books", label: "Kaikkea siltä väliltä" },
]

const iconMap: Record<string, string> = {
  dice: "M4.5 3h15A1.5 1.5 0 0121 4.5v15a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 19.5v-15A1.5 1.5 0 014.5 3zM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01",
  dragon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  swords: "M14.5 2.5L6 11l-4-4v8h8l-4-4 8.5-8.5M18 2l-1.5 1.5L20 7l1.5-1.5zM15 9l-9 9 3 3 9-9",
  cards: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z",
  castle: "M17 3v2h-2V3h-2v2h-2V3H9v2H7V3H4v18h7v-4h2v4h7V3h-3z",
  books: "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
}

export function GamerTypesRibbon() {
  return (
    <div className="relative border-y border-[hsl(45,80%,60%)]/20 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(345,80%,12%) 0%, hsl(25,50%,10%) 50%, hsl(345,80%,6%) 100%)",
      }}
    >
      {/* Subtle diagonal pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, hsl(45,80%,60%) 40px, hsl(45,80%,60%) 41px)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="font-cinzel text-[0.65rem] uppercase tracking-[0.45em] text-[hsl(45,80%,60%)]/80 mb-8">
          Kaikille pöytäpelaajille — tervetuloa
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {gamerTypes.map((type) => (
            <div
              key={type.label}
              className="flex items-center gap-3 px-5 py-3 bg-[hsl(45,80%,60%)]/[0.06] border border-[hsl(45,80%,60%)]/20 hover:bg-[hsl(45,80%,60%)]/[0.12] hover:border-[hsl(45,80%,60%)]/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <svg
                className="w-5 h-5 text-[hsl(45,80%,60%)]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={iconMap[type.icon]} />
              </svg>
              <span className="font-merriweather text-sm text-[hsl(45,60%,85%)] tracking-wide">
                {type.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
