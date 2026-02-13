const rooms = [
  {
    name: "Main Hall",
    palette: "Burgundy & Gold",
    bg: "bg-[hsl(345,80%,15%)]",
    border: "border-[hsl(45,80%,60%)]/40",
    accent: "hsl(45,80%,60%)",
  },
  {
    name: "Library",
    palette: "Mahogany & Silver",
    bg: "bg-[hsl(25,60%,12%)]",
    border: "border-[hsl(0,0%,75%)]/40",
    accent: "hsl(0,0%,75%)",
  },
  {
    name: "Conservatory",
    palette: "Forest Green & Copper",
    bg: "bg-[hsl(120,60%,10%)]",
    border: "border-[hsl(30,70%,55%)]/40",
    accent: "hsl(30,70%,55%)",
  },
  {
    name: "Fireside Lounge",
    palette: "Obsidian & Flame",
    bg: "bg-[hsl(0,0%,13%)]",
    border: "border-[hsl(16,100%,50%)]/40",
    accent: "hsl(16,100%,50%)",
  },
  {
    name: "Gallery",
    palette: "Navy & Gold",
    bg: "bg-[hsl(240,100%,10%)]",
    border: "border-[hsl(45,80%,60%)]/40",
    accent: "hsl(45,80%,60%)",
  },
  {
    name: "Ballroom",
    palette: "Crystal White & Gold",
    bg: "bg-[hsl(0,0%,95%)]",
    border: "border-[hsl(45,100%,50%)]/40",
    accent: "hsl(45,100%,50%)",
  },
  {
    name: "Observatory",
    palette: "Crimson & Silver",
    bg: "bg-[hsl(0,70%,18%)]",
    border: "border-[hsl(210,15%,65%)]/40",
    accent: "hsl(210,15%,65%)",
  },
  {
    name: "Crystal Cavern",
    palette: "Rose Quartz & Amethyst",
    bg: "bg-[hsl(345,45%,57%)]",
    border: "border-[hsl(221,83%,32%)]/40",
    accent: "hsl(221,83%,32%)",
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
              Explore the Manor
            </span>
            <div className="h-px w-12 bg-[hsl(45,80%,60%)]/40" />
          </div>
          <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl text-[hsl(0,0%,98%)] mb-4 text-balance">
            20 Uniquely Themed Rooms
          </h2>
          <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,75%)] max-w-2xl mx-auto leading-relaxed">
            Each room transforms your entire experience with its own colour
            palette, atmosphere, and personality. Choose the room that suits
            your mood.
          </p>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {rooms.map((room) => (
            <div
              key={room.name}
              className={`group relative p-5 md:p-6 ${room.bg} border ${room.border} hover:scale-[1.02] transition-all duration-300 overflow-hidden`}
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 opacity-10"
                style={{
                  background: `radial-gradient(circle at top right, ${room.accent}, transparent 70%)`,
                }}
              />
              <h3 className="font-cinzel text-xs md:text-sm uppercase tracking-wide text-[hsl(0,0%,98%)] mb-2">
                {room.name}
              </h3>
              <p className="font-merriweather text-xs text-[hsl(0,0%,65%)]">
                {room.palette}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center mt-8 font-cinzel text-sm text-[hsl(0,0%,60%)]">
          {"+ 12 more rooms including Bar, Spa, Theater, Clock Tower, Dungeon, and more"}
        </p>
      </div>
    </section>
  )
}
