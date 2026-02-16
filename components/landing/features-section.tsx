import {
  BookOpen,
  Users,
  ShoppingBag,
  Calendar,
  Trophy,
  MessageCircle,
  Palette,
  UserSearch,
} from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Pelikokoelma",
    description:
      "Luetteloi koko kirjastosi — lautapelit, RPG-kirjat, sääntökirjat, korttisetit ja miniatyyrit. Seuraa pelikertoja, arvioita ja historiaa yhdessä paikassa.",
  },
  {
    icon: Users,
    title: "Yhteisö",
    description:
      "Löydä lautapelaajia, RPG-pelinjohtajia, maalaajia ja kortinkerääjiä alueeltasi. Selaa profiileja ja yhdisty samanmielisten pelaajien kanssa.",
  },
  {
    icon: ShoppingBag,
    title: "Kauppapaikka",
    description:
      "Osta, myy ja vaihda pelejä, kirjoja, miniatyyrejä ja kortteja yhteisön sisällä. Löydä harvinaisia nimikkeitä ja tee tilaa hyllyysi.",
  },
  {
    icon: Calendar,
    title: "Tapahtumat",
    description:
      "Luo ja liity pelitapahtumiin. Järjestä peli-iltoja, kampanjasessioita, turnauksia ja maalaustapahtumia sisäänrakennetulla ilmoittautumisella.",
  },
  {
    icon: Trophy,
    title: "Palkinnot & XP",
    description:
      "Ansaitse saavutuksia ja kokemuspisteitä pelatessasi, kerätessäsi ja osallistuessasi. Nouse kartanon arvoasteikolla.",
  },
  {
    icon: UserSearch,
    title: "Etsi Pelaajia",
    description:
      "Edistynyt haku pelimieltymysten, lajityypin, saatavuuden ja sijainnin perusteella. Pöytäsi ei ole enää koskaan vajaa.",
  },
  {
    icon: MessageCircle,
    title: "Viestit",
    description:
      "Yksityiset keskustelut muiden jäsenten kanssa. Koordinoi pelisessioita, neuvottele vaihdoista ja rakenna kestäviä ystävyyssuhteita.",
  },
  {
    icon: Palette,
    title: "20 Teemahuonetta",
    description:
      "Personoi kokemuksesi 20 ainutlaatuisella kartanohuoneella. Suuresta Pääsalista salaperäiseen Kristalliluolaan — löydä oma tunnelmasi.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-[hsl(345,80%,8%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-[hsl(45,80%,60%)]/40" />
            <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-[hsl(45,80%,60%)]">
              Mitä sisältä löytyy
            </span>
            <div className="h-px w-12 bg-[hsl(45,80%,60%)]/40" />
          </div>
          <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl text-[hsl(0,0%,98%)] mb-4 text-balance">
            Kaikki mitä peliseura tarvitsee
          </h2>
          <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,70%)] max-w-2xl mx-auto leading-relaxed italic">
            Täydellinen alusta vaativalle pöytäpeliharrastajalle,
            käärittynä viktoriaanisen kartanon eleganssiin.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[hsl(45,80%,60%)]/10 border border-[hsl(45,80%,60%)]/10">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative p-8 md:p-10 bg-[hsl(345,80%,5%)] hover:bg-[hsl(345,60%,8%)] transition-all duration-300 overflow-hidden"
            >
              {/* Top line accent on hover */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[hsl(45,80%,60%)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <feature.icon className="w-7 h-7 text-[hsl(45,80%,60%)]/70 mb-5" />
              <h3 className="font-charm text-base text-[hsl(45,70%,75%)] mb-3 tracking-wide">
                {feature.title}
              </h3>
              <p className="font-merriweather text-sm text-[hsl(0,0%,65%)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
