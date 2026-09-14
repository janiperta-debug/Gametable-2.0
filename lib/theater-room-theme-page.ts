import type { RoomThemePage } from "@/lib/room-theme-pages"

const sharedUnlocks = (theme: string, journey: string, lore: string) => [
  { label: { fi: theme, en: "Theater Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
  { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: journey, en: "A complete journey through the Theater" } },
  { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: lore, en: "Lore, scripts and behind-the-scenes notes" } },
  { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
  { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
]

export const THEATER_ROOM_THEME_PAGE: RoomThemePage = {
  id: "theater-room",
  crest: "/images/theater-room-crest.png",
  hero: "/images/themes/theater-room-hero.jpg",
  title: { fi: "Teatteri", en: "Theater" },
  tagline: { fi: "Jokainen tarina paljastaa totuuden. Tarinat muovaavat ymmärrystä.", en: "Every story reveals a truth. Stories shape understanding." },
  storyTitle: { fi: "Teatteri", en: "The Theater" },
  storyParagraphs: [
    { fi: "Teatterissa tarinat heräävät eloon ja näkökulmia tutkitaan.", en: "The Theater is where stories come to life and perspectives are explored." },
    { fi: "Jokainen kertomus paljastaa uuden kulman ihmisyyteen.", en: "Each tale reveals a different angle of the human experience." },
    { fi: "Astu mielikuvituksen näyttämölle ja näe maailma toisen silmin.", en: "Step onto the stage of imagination, and see the world through another’s eyes." },
  ],
  essenceTagline: { fi: "Tarinat muovaavat ymmärrystä.", en: "Stories shape understanding." },
  essenceText: [
    { fi: "Teatteri ei ole esityksestä.", en: "The Theater is not about performance." },
    { fi: "Se on näkökulmasta.", en: "It is about perspective." },
  ],
  journey: [
    ["Kutsu", "Invitation", "Esirippu nousee.", "The curtain rises."],
    ["Uteliaisuus", "Curiosity", "Astut tuntemattomaan.", "Be drawn into the unknown."],
    ["Hahmo", "Character", "Kohtaa tarinan muovaajat.", "Meet those who shape the story."],
    ["Ristiriita", "Conflict", "Jokainen matka kohtaa koettelemuksia.", "Every journey faces trials."],
    ["Valinta", "Choice", "Päätökset muuttavat kaiken.", "Decisions change everything."],
    ["Tunne", "Emotion", "Tunne se, mitä sanat eivät kanna.", "Feel what words cannot hold."],
    ["Pohdinta", "Reflection", "Katso pinnan taakse.", "Look beyond the surface."],
    ["Merkitys", "Meaning", "Löydä kaiken ydin.", "Discover the heart of it all."],
    ["Ymmärrys", "Understanding", "Näe totuus sisälläsi.", "See the truth within."],
    ["Encore", "Encore", "Suuret tarinat eivät koskaan todella pääty.", "Great stories never truly end."],
  ].map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
  glimpses: [
    { image: "/images/heroes/collection/theater-room.jpg", caption: { fi: "Lämpiö", en: "The Foyer" } },
    { image: "/images/heroes/events/theater-room.jpg", caption: { fi: "Katsomo", en: "The Auditorium" } },
    { image: "/images/heroes/discover/theater-room.jpg", caption: { fi: "Kulissien takana", en: "Backstage" } },
  ],
  artifact: { name: { fi: "Näytelmäkirjailijan käsikirjoitus", en: "Playwright’s Script" }, image: "/themes/artifacts/theater-room.png", description: [{ fi: "Käsikirjoitus, joka säilyttää tarinan kolme näytöstä ja niiden opetukset.", en: "A script preserving three acts of story and the lessons within them." }] },
  unlocks: sharedUnlocks("Teatteri-teema", "Täydellinen matka teatterin läpi", "Tarinoita, käsikirjoituksia ja kulissien takaisia muistiinpanoja"),
  footerLine: { fi: "Jokainen tarina jättää jotakin jälkeensä.", en: "Every story leaves something behind." },
}
