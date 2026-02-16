import { Swords, Wand2, Layers, Map, BarChart3, Sparkles } from "lucide-react"

const tools = [
  {
    icon: Swords,
    status: "Tulossa",
    title: "Armeijanrakentaja",
    description: "Rakenna, tallenna ja jaa miniatyyriarmeijoita. Pisteytyslaskuri, yksikkölistat ja visuaaliset kokoonpanot — kaikki yhdessä paikassa.",
    tags: ["Miniatyyrit", "Wargames"],
  },
  {
    icon: Wand2,
    status: "Tulossa",
    title: "Hahmonrakentaja",
    description: "Luo ja hallinnoi RPG-hahmoja. Ominaisuuksien seuranta, varusteet, taustatarinat ja kampanjahistoria tallessa — sessio toisensa jälkeen.",
    tags: ["RPG", "D&D", "Pathfinder"],
  },
  {
    icon: Layers,
    status: "Tulossa",
    title: "Pakkainrakentaja",
    description: "Rakenna ja optimoi korttipakkoja, analysoi metatrendejä ja jaa decklists-listoja yhteisön kanssa. Tukee useita keräilykorttipelejä.",
    tags: ["TCG", "CCG", "Keräilykortit"],
  },
  {
    icon: Map,
    status: "Tulossa",
    title: "Kampanjapäiväkirja",
    description: "Dokumentoi RPG-kampanjasi — sessiomuistiinpanot, NPC:t, kartat ja juonilangat. Elävä arkisto seikkailullesi.",
    tags: ["RPG", "Seikkailut"],
  },
  {
    icon: BarChart3,
    status: "Tulossa",
    title: "Tilastokeskus",
    description: "Syvälliset tilastot pelihistoriastasi. Voittoprosentit, suosituimmat pelit, pelikertojen kehitys ja paljon muuta.",
    tags: ["Kaikki pelaajat"],
  },
  {
    icon: Sparkles,
    status: "Suunnitteilla",
    title: "...ja paljon muuta",
    description: "Kartano kasvaa jatkuvasti. Toivotko jotain tiettyä työkalua? Yhteisösi ääni muovaa GameTablen tulevaisuutta.",
    tags: ["Sinun ideoitasi"],
    dashed: true,
  },
]

export function ComingSoonSection() {
  return (
    <section
      id="tulossa"
      className="py-20 md:py-32 border-y border-[hsl(45,80%,60%)]/10"
      style={{
        background: "linear-gradient(160deg, hsla(345,80%,14%,0.12) 0%, transparent 60%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block font-cinzel text-[0.65rem] uppercase tracking-[0.4em] text-[hsl(345,80%,6%)] bg-[hsl(45,80%,60%)] px-4 py-1 mb-6">
            Tulossa pian
          </span>
          <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl text-[hsl(0,0%,98%)] mb-4 text-balance">
            Työkalupakki kasvaa
          </h2>
          <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,70%)] max-w-2xl mx-auto leading-relaxed italic">
            GameTable ei ole vain yhteisö — se on kasvava arsenali työkaluja,
            jotka tekevät harrastuksestasi entistä rikkaampaa.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className={`group relative p-8 bg-[hsl(345,80%,5%)]/80 border hover:border-[hsl(45,80%,60%)]/40 hover:-translate-y-1 transition-all duration-400 overflow-hidden ${
                tool.dashed
                  ? "border-dashed border-[hsl(45,80%,60%)]/15 opacity-70"
                  : "border-[hsl(45,80%,60%)]/15"
              }`}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(45,80%,60%)]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <span
                  className={`inline-block font-cinzel text-[0.6rem] uppercase tracking-[0.35em] px-3 py-1 mb-5 border ${
                    tool.status === "Suunnitteilla"
                      ? "text-[hsl(180,30%,55%)] border-[hsl(180,30%,55%)]/40"
                      : "text-[hsl(45,80%,60%)] border-[hsl(45,80%,60%)]/40"
                  }`}
                >
                  {tool.status}
                </span>

                <tool.icon className="w-8 h-8 text-[hsl(45,80%,60%)]/60 mb-5" />

                <h3 className="font-charm text-lg text-[hsl(0,0%,98%)] mb-3 tracking-wide">
                  {tool.title}
                </h3>

                <p className="font-merriweather text-sm text-[hsl(0,0%,65%)] leading-relaxed mb-5">
                  {tool.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {tool.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-merriweather text-xs text-[hsl(45,80%,60%)] bg-[hsl(45,80%,60%)]/[0.06] border border-[hsl(45,80%,60%)]/15 px-2.5 py-1 tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
