const rooms = [
  {
    name: "Pääsali",
    palette: "Viininpunainen & Kulta",
    accent: "#8B1A1A",
    dotSecondary: "#C9A84C",
  },
  {
    name: "Kirjasto",
    palette: "Mahonki & Hopea",
    accent: "#6B3E26",
    dotSecondary: "#C0C0C0",
  },
  {
    name: "Talvipuutarha",
    palette: "Metsänvihreä & Kupari",
    accent: "#2D5016",
    dotSecondary: "#B87333",
  },
  {
    name: "Takkahuone",
    palette: "Obsidiaani & Liekki",
    accent: "#1A1A1A",
    dotSecondary: "#FF4500",
  },
  {
    name: "Galleria",
    palette: "Laivastonsininen & Kulta",
    accent: "#1B3A5C",
    dotSecondary: "#C9A84C",
  },
  {
    name: "Juhlasali",
    palette: "Kristallinvalkoinen & Kulta",
    accent: "#E8E0D0",
    dotSecondary: "#C9A84C",
  },
  {
    name: "Observatorio",
    palette: "Karmiini & Hopea",
    accent: "#5C0E0E",
    dotSecondary: "#C0C0C0",
  },
  {
    name: "Kristalliluola",
    palette: "Ruusukvartsit & Ametisti",
    accent: "#B76E79",
    dotSecondary: "#9B59B6",
  },
]

export function RoomsSection() {
  return (
    <section id="rooms" className="py-20 md:py-32 bg-[hsl(345,80%,6%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-[hsl(45,80%,60%)]/40" />
            <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-[hsl(45,80%,60%)]">
              Personointi
            </span>
            <div className="h-px w-12 bg-[hsl(45,80%,60%)]/40" />
          </div>
          <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl text-[hsl(0,0%,98%)] mb-4 text-balance">
            20 Ainutlaatuista Teemahuonetta
          </h2>
          <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,75%)] max-w-2xl mx-auto leading-relaxed">
            Jokainen huone muuttaa koko kokemuksesi omalla väripaletillaan,
            tunnelmallaan ja persoonallisuudellaan. Valitse huone, joka
            sopii mielialaasi.
          </p>
        </div>

        {/* Room Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-5 mt-12 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[hsl(45,80%,60%)]/30">
          {rooms.map((room) => (
            <div
              key={room.name}
              className="group flex-shrink-0 w-[200px] relative p-7 text-center bg-[hsl(345,80%,4%)]/90 border border-[hsl(45,80%,60%)]/15 hover:border-[hsl(45,80%,60%)]/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Bottom accent line on hover */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{ background: room.accent }}
              />

              {/* Color dot */}
              <div
                className="w-7 h-7 rounded-full mx-auto mb-4"
                style={{
                  background: `linear-gradient(135deg, ${room.accent}, ${room.dotSecondary || room.accent})`,
                }}
              />

              <h3 className="font-charm text-sm text-[hsl(0,0%,98%)] mb-2 tracking-wide">
                {room.name}
              </h3>
              <p className="font-merriweather text-xs text-[hsl(0,0%,65%)] italic">
                {room.palette}
              </p>
            </div>
          ))}

          {/* +12 more card */}
          <div className="flex-shrink-0 w-[200px] relative p-7 text-center bg-[hsl(345,80%,4%)]/90 border border-[hsl(45,80%,60%)]/10 opacity-70">
            <div className="w-7 h-7 rounded-full mx-auto mb-4" style={{ background: "linear-gradient(135deg, #555, #888)" }} />
            <h3 className="font-charm text-sm text-[hsl(0,0%,98%)] mb-2 tracking-wide">
              + 12 muuta
            </h3>
            <p className="font-merriweather text-xs text-[hsl(0,0%,65%)] italic">
              Baari, Teatteri, Tyrmä...
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
