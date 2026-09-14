import type { RoomThemePage } from "@/lib/room-theme-pages"

export const CLOCK_TOWER_THEME_PAGE: RoomThemePage = {
  id: "clock-tower",
  crest: "/images/clock-tower-crest.png",
  hero: "/images/themes/clock-tower-hero.jpg",
  title: { fi: "Kellotorni", en: "Clock Tower" },
  tagline: { fi: "Kaikki liittyy toisiinsa. Jokainen hetki merkitsee.", en: "Everything is connected. Every moment matters." },
  storyTitle: { fi: "Kellotorni", en: "The Clock Tower" },
  storyParagraphs: [
    { fi: "Korkealla kartanon yllä Kellotorni pitää aikaa täydellisellä tarkkuudella.", en: "High above the Manor, the Clock Tower keeps time with perfect precision." },
    { fi: "Sen rattaat liikkuvat harmoniassa, jokainen liike seuraavaa ohjaten.", en: "Its gears turn in harmony, each movement influencing the next." },
    { fi: "Täällä opit, ettei mikään tapahdu erillään — kaikki vaikuttaa kaikkeen.", en: "Here, you learn that nothing occurs in isolation—everything affects everything." },
    { fi: "Hallitse kaava, niin hallitset hetken.", en: "Master the pattern, and you master the moment." },
  ],
  essenceTagline: { fi: "Ymmärrys syntyy kaavan näkemisestä.", en: "Understanding comes from seeing the pattern." },
  essenceText: [
    { fi: "Torni ei opeta sinulle nopeutta.", en: "The Tower does not teach you speed." },
    { fi: "Se opettaa ajoitusta.", en: "It teaches you timing." },
  ],
  journey: [
    ["Havainnointi", "Observation", "Huomaa yksityiskohdat.", "Notice the details."],
    ["Liike", "Motion", "Kaikki on liikkeessä.", "Everything is in motion."],
    ["Kaava", "Pattern", "Löydä piilotettu järjestys.", "Find the hidden order."],
    ["Rytmi", "Rhythm", "Tunne luonnollinen virtaus.", "Feel the natural flow."],
    ["Linjakkuus", "Alignment", "Aseta jokainen osa huolella.", "Place each piece with care."],
    ["Täsmällisyys", "Precision", "Pienillä säädöillä on merkitys.", "Small adjustments matter."],
    ["Synkronointi", "Synchronization", "Työskentele harmoniassa.", "Work in harmony."],
    ["Seuraus", "Consequence", "Jokaisella teolla on vaikutus.", "Every action has impact."],
    ["Mestaruus", "Mastery", "Hallitse ymmärryksen kautta.", "Control through understanding."],
    ["Seuraava sykli", "The Next Cycle", "Kaava jatkuu.", "The pattern continues."],
  ].map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
  glimpses: [
    { image: "/images/heroes/collection/clock-tower.jpg", caption: { fi: "Laskeutumistasanne", en: "The Landing" } },
    { image: "/images/heroes/events/clock-tower.jpg", caption: { fi: "Kellosepän työhuone", en: "The Study" } },
    { image: "/images/heroes/discover/clock-tower.jpg", caption: { fi: "Etsi neuvoa", en: "Seek Counsel" } },
  ],
  artifact: {
    name: { fi: "Kellosepän muistiinpanot", en: "Clockmaker’s Notes" },
    image: "/themes/artifacts/clock-tower.png",
    description: [{ fi: "Muistiinpanot rattaista, ajoituksesta ja järjestelmän jokaisen osan merkityksestä.", en: "Notes on gears, timing, and the purpose of every part of the system." }],
  },
  unlocks: [
    { label: { fi: "Tornin teema", en: "Tower Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka tornin läpi", en: "A complete journey through the Tower" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Tarinoita, muistiinpanoja ja kellosepän merkintöjä", en: "Lore, notes and clockmaker’s records" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Yksi ratas muuttaa vähän. Ilman sitä mikään ei liiku.", en: "A single gear changes little. Yet without it, nothing moves." },
}
