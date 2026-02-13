const steps = [
  {
    number: "01",
    title: "Create Your Profile",
    description:
      "Sign up and build your gaming identity. Set your preferences, list favourite games, and tell the community what you love to play.",
  },
  {
    number: "02",
    title: "Build Your Collection",
    description:
      "Add your board games to your personal collection. Track plays, rate games, and maintain a beautiful catalogue of your library.",
  },
  {
    number: "03",
    title: "Find Your People",
    description:
      "Discover players who share your interests. Browse the community, join events, and connect through messaging to arrange sessions.",
  },
  {
    number: "04",
    title: "Play & Earn",
    description:
      "Attend events, complete games, and engage with the community to earn XP and unlock trophies. Rise through the ranks of the manor.",
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
              Your Journey Begins
            </span>
            <div className="h-px w-12 bg-[hsl(45,80%,60%)]/40" />
          </div>
          <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl text-[hsl(0,0%,98%)] mb-4 text-balance">
            How It Works
          </h2>
          <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,75%)] max-w-2xl mx-auto leading-relaxed">
            Four simple steps to becoming a distinguished member of the
            GameTable society.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line - hidden on mobile, shown on lg */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-[hsl(45,80%,60%)]/20 -translate-x-1/2 z-0" />
              )}

              <div className="relative z-10">
                {/* Step number */}
                <div className="font-cinzel text-4xl md:text-5xl text-[hsl(45,80%,60%)]/20 mb-4">
                  {step.number}
                </div>

                {/* Diamond marker */}
                <div className="w-3 h-3 rotate-45 bg-[hsl(45,80%,60%)] mb-5" />

                <h3 className="font-cinzel text-sm md:text-base uppercase tracking-wide text-[hsl(0,0%,98%)] mb-3">
                  {step.title}
                </h3>
                <p className="font-merriweather text-sm text-[hsl(0,0%,70%)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
