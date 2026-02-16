const steps = [
  {
    number: "01",
    title: "Luo Profiilisi",
    description:
      "Rakenna peli-identiteettisi. Aseta mieltymyksesi, lajityyppisi ja kerro yhteisölle mitä rakastat pelata.",
  },
  {
    number: "02",
    title: "Rakenna Kokoelmasi",
    description:
      "Lisää lautapelit, RPG-kirjat, miniatyyrit tai keräilykortit kokoelmaasi. Seuraa, arvostele, ylläpidä.",
  },
  {
    number: "03",
    title: "Löydä Peliporukkasi",
    description:
      "Löydä pelaajia, jotka jakavat intohimosi. Liity tapahtumiin ja yhdisty viestien kautta.",
  },
  {
    number: "04",
    title: "Pelaa & Kehity",
    description:
      "Ansaitse XP:tä ja saavutuksia osallistumalla. Nouse kartanon arvoasteikolla ja nauti jokaisesta sessiosta.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-[hsl(345,80%,8%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-[hsl(45,80%,60%)]/40" />
            <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-[hsl(45,80%,60%)]">
              Matkasi Alkaa
            </span>
            <div className="h-px w-12 bg-[hsl(45,80%,60%)]/40" />
          </div>
          <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl text-[hsl(0,0%,98%)] mb-4 text-balance">
            Miten se toimii
          </h2>
          <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,75%)] max-w-2xl mx-auto leading-relaxed">
            Neljä yksinkertaista askelta arvostetuksi jäseneksi
            GameTable-peliseurassa.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-0">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(45,80%,60%)]/25 to-transparent" />

          {steps.map((step) => (
            <div key={step.number} className="relative text-center px-4 md:px-8">
              {/* Circular step number */}
              <div className="relative z-10 font-cinzel text-[0.7rem] font-bold tracking-[0.3em] text-[hsl(45,80%,60%)] bg-[hsl(345,80%,5%)] border border-[hsl(45,80%,60%)]/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-7">
                {step.number}
              </div>

              <h3 className="font-charm text-base text-[hsl(0,0%,98%)] mb-3 tracking-wide">
                {step.title}
              </h3>
              <p className="font-merriweather text-sm text-[hsl(0,0%,65%)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
