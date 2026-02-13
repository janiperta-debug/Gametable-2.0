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
    title: "Game Collection",
    description:
      "Catalogue your entire board game library with detailed tracking, ratings, and play history. Never forget which games you own.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Discover fellow tabletop enthusiasts in your area. Browse profiles, see gaming preferences, and connect with like-minded players.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description:
      "Buy, sell, and trade games within the community. Find rare titles and give your shelf space a refresh.",
  },
  {
    icon: Calendar,
    title: "Events",
    description:
      "Create and join gaming events. Organize game nights, tournaments, and meetups with built-in RSVP and scheduling.",
  },
  {
    icon: Palette,
    title: "20 Themed Rooms",
    description:
      "Personalize your experience with 20 uniquely styled manor rooms, from the grand Main Hall to the mysterious Crystal Cavern.",
  },
  {
    icon: Trophy,
    title: "Trophies & XP",
    description:
      "Earn achievements and experience points as you play, collect, and engage. Level up your gaming profile.",
  },
  {
    icon: MessageCircle,
    title: "Messaging",
    description:
      "Private conversations with other members. Coordinate game sessions, negotiate trades, and build friendships.",
  },
  {
    icon: UserSearch,
    title: "Find Players",
    description:
      "Advanced player matching based on game preferences, availability, and location. Never struggle to fill a table again.",
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
              What Awaits Within
            </span>
            <div className="h-px w-12 bg-[hsl(45,80%,60%)]/40" />
          </div>
          <h2 className="font-charm text-3xl sm:text-4xl md:text-5xl text-[hsl(0,0%,98%)] mb-4 text-balance">
            Everything a Gaming Society Needs
          </h2>
          <p className="font-merriweather text-base md:text-lg text-[hsl(0,0%,75%)] max-w-2xl mx-auto leading-relaxed">
            A complete platform designed for the discerning tabletop enthusiast,
            wrapped in the elegance of a Victorian manor.
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
