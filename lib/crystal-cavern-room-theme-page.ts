import type { RoomThemePage } from "@/lib/room-theme-pages"

const steps = [
  ["Laskeutuminen", "Descent", "Ota ensimmäinen askel.", "Take the first step."],
  ["Löytäminen", "Discovery", "Jotain kaunista ilmestyy.", "Something beautiful appears."],
  ["Ihme", "Wonder", "Anna ihmeen johdattaa.", "Let awe guide you."],
  ["Tutkiminen", "Exploration", "Seuraa piilotettuja polkuja.", "Follow the hidden paths."],
  ["Pohdinta", "Reflection", "Katso pinnan taakse.", "Look beyond the surface."],
  ["Valaistuminen", "Illumination", "Valo paljastaa enemmän.", "The light reveals more."],
  ["Yhteys", "Connection", "Ymmärrä kuviot.", "Understand the patterns."],
  ["Paljastuminen", "Revelation", "Totuus tarkentuu.", "Truth comes into focus."],
  ["Perspektiivi", "Perspective", "Näe uudesta paikasta.", "See from a new place."],
  ["Yhä syvemmälle", "Deeper Still", "Matka jatkuu.", "The journey continues."],
]

export const CRYSTAL_CAVERN_ROOM_THEME_PAGE: RoomThemePage = {
  id: "crystal-cavern",
  crest: "/images/crests/crystal-cavern-crest.png",
  hero: "/images/themes/crystal-cavern-hero.jpg",
  title: { fi: "Kristalliluola", en: "Crystal Cavern" },
  tagline: { fi: "Syvimmät ihmeet paljastavat itsensä hitaasti.", en: "The deepest wonders reveal themselves slowly." },
  storyTitle: { fi: "Kristalliluola", en: "The Crystal Cavern" },
  storyParagraphs: [
    { fi: "Kartanon alla lepää luola, jonka aika on muovannut — ei kädet.", en: "Hidden beneath the Manor lies a cavern shaped not by hands, but by time." },
    { fi: "Sen kristallit valaisevat unohdettuja polkuja ja paljastavat ihmeitä, joita ei voi kiirehtiä.", en: "Its crystals illuminate forgotten paths and reveal wonders that cannot be rushed." },
    { fi: "Syvemmälle laskeutuvat löytävät aarteen sijaan perspektiiviä.", en: "Those who descend deeper discover more than treasure. They discover perspective." },
  ],
  essenceTagline: { fi: "Ihme palkitsee kärsivällisyyden.", en: "Wonder rewards patience." },
  essenceText: [
    { fi: "Luola ei pyydä sinua valloittamaan.", en: "The Cavern does not ask you to conquer." },
    { fi: "Se pyytää sinua tutkimaan.", en: "It asks you to explore." },
  ],
  journey: steps.map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
  glimpses: [
    { image: "/images/heroes/collection/crystal-cavern.jpg", caption: { fi: "Laskeutuminen", en: "The Landing" } },
    { image: "/images/heroes/events/crystal-cavern.jpg", caption: { fi: "Yhteisö", en: "The Community" } },
    { image: "/images/heroes/discover/crystal-cavern.jpg", caption: { fi: "Kristallialttari", en: "Seek Counsel" } },
  ],
  artifact: {
    name: { fi: "Tutkijan päiväkirja", en: "Explorer's Journal" },
    image: "/themes/artifacts/crystal-cavern.png",
    description: [{ fi: "Mitä syvemmälle matkustin, sitä vähemmän etsin aarretta ja sitä enemmän ymmärrystä.", en: "The deeper I traveled, the less I searched for treasure and the more I searched for understanding." }],
  },
  unlocks: [
    { label: { fi: "Kristalliluola-teema", en: "Cavern Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka luolan läpi", en: "A complete journey through the Cavern" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Tutkijan päiväkirjoja ja löytöjä", en: "Lore, explorer journals and discoveries" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Pinnan alla oleva ei aina ole piilossa. Joskus se vain odottaa, että olet valmis.", en: "What lies beneath the surface is not always hidden. Sometimes, it is simply waiting for you to be ready." },
}
