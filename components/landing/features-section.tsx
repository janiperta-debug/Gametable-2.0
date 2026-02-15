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
      "Luetteloi koko lautapelikirjastosi yksityiskohtaisella seurannalla, arvioilla ja pelihistorialla. Älä koskaan unohda, mitä pelejä omistat.",
  },
  {
    icon: Users,
    title: "Yhteisö",
    description:
      "Löydä lautapeliharrastajia alueeltasi. Selaa profiileja, tutustu pelimieltymyksiin ja yhdisty samanmielisten pelaajien kanssa.",
  },
  {
    icon: ShoppingBag,
    title: "Kauppapaikka",
    description:
      "Osta, myy ja vaihda pelejä yhteisön sisällä. Löydä harvinaisia nimikkeitä ja tee tilaa hyllyysi.",
  },
  {
    icon: Calendar,
    title: "Tapahtumat",
    description:
      "Luo ja liity pelitapahtumiin. Järjestä peli-iltoja, turnauksia ja tapaamisia sisäänrakennetulla ilmoittautumisella.",
  },
  {
    icon: Palette,
    title: "20 Teemahuonetta",
    description:
      "Personoi kokemuksesi 20 ainutlaatuisella kartanohuoneella, suuresta Pääsalista salaperäiseen Kristalliluolaan.",
  },
  {
    icon: Trophy,
    title: "Palkinnot & XP",
    description:
      "Ansaitse saavutuksia ja kokemuspisteitä pelatessasi, kerätessäsi ja osallistuessasi. Nosta peliprofiilisi tasoa.",
  },
  {
    icon: MessageCircle,
    title: "Viestit",
    description:
      "Yksityiset keskustelut muiden jäsenten kanssa. Koordinoi pelisessioita, neuvottele vaihdoista ja rakenna ystävyyssuhteita.",
  },
  {
    icon: UserSearch,
    title: "Etsi Pelaajia",
    description:
      "Edistynyt pelaajien yhdistäminen pelimieltymysten, saatavuuden ja sijainnin perusteella. Pöytäsi ei ole enää koskaan vajaa.",
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
          <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,75%)] max-w-2xl mx-auto leading-relaxed">
            Täydellinen alusta vaativalle lautapeliharrastajalle,
            kääritty viktoriaanisen kartanon eleganssin.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 md:p-8 bg-[hsl(345,60%,12%)] border border-[hsl(45,80%,60%)]/15 hover:border-[hsl(45,80%,60%)]/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 flex items-center justify-center mb-5 border border-[hsl(45,80%,60%)]/30 bg-[hsl(345,80%,10%)]">
                <feature.icon className="w-6 h-6 text-[hsl(45,80%,60%)]" />
              </div>
              <h3 className="font-cinzel text-sm md:text-base uppercase tracking-wide text-[hsl(0,0%,98%)] mb-3">
                {feature.title}
              </h3>
              <p className="font-merriweather text-sm text-[hsl(0,0%,70%)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
