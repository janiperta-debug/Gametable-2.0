export function CommunitySection() {
  return (
    <section id="community" className="py-20 md:py-32 bg-[hsl(345,80%,6%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Side */}
          <div className="relative order-2 lg:order-1">
            <div className="relative overflow-hidden border-2 border-[hsl(45,80%,60%)]/20">
              <img
                src="/images/landing-community.jpg"
                alt="Tyylikäs pelihuone nahkatuoleilla ja lautapeleillä"
                className="w-full h-64 sm:h-80 md:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-[hsl(345,80%,8%)]/20" />
            </div>
            {/* Decorative corner accents */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-[hsl(45,80%,60%)]/40" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-[hsl(45,80%,60%)]/40" />
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-[hsl(45,80%,60%)]/40" />
              <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-[hsl(45,80%,60%)]">
                Liity Seuraan
              </span>
            </div>

            <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl text-[hsl(0,0%,98%)] mb-6 text-balance">
              Pelaajille rakennettu yhteiso
            </h2>

            <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,75%)] leading-relaxed mb-8">
              GameTable on enemmän kuin alusta - se on kokoontumispaikka niille,
              jotka arvostavat lautapelaamisen taidetta. Olitpa kokenut strategi
              tai vasta löytämässä ensimmäistä peliäsi, pöydässämme on sinulle
              paikka.
            </p>

            <div className="space-y-5 mb-10">
              {[
                "Kuratoi ja esittele henkilökohtaista pelikokoelmaasi",
                "Yhdisty pelaajiin, jotka sopivat pelityyliisi",
                "Järjestä tapahtumia etkä pelaa enää koskaan yksin",
                "Vaihda pelejä ja löydä piilotettuja helmiä kauppapaikalta",
                "Ansaitse tunnustusta palkinnoilla ja saavutuksilla",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-2 h-2 rotate-45 bg-[hsl(45,80%,60%)] mt-2 flex-shrink-0" />
                  <span className="font-merriweather text-sm md:text-base text-[hsl(0,0%,80%)]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Showcase image */}
        <div className="mt-16 md:mt-24">
          <div className="relative overflow-hidden border border-[hsl(45,80%,60%)]/15">
            <img
              src="/images/landing-hero.jpg"
              alt="Upea kartanon sisätila peliasetelmalla"
              className="w-full h-48 sm:h-56 md:h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(345,80%,6%)] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="font-cinzel text-xs uppercase tracking-wider text-[hsl(45,80%,60%)]">
                Järjestä Unohtumattomia Tapahtumia
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
