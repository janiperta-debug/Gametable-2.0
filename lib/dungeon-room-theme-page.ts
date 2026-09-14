import type { RoomThemePage } from "@/lib/room-theme-pages"

const steps = [
  ["Sisäänkäynti", "Entrance", "Astut tuntemattomaan.", "Step into the unknown."],
  ["Tutkiminen", "Exploration", "Kartoita tutkimaton.", "Chart the uncharted."],
  ["Löytäminen", "Discovery", "Löydä se, mikä muilta jää.", "Find what others miss."],
  ["Haaste", "Challenge", "Kohtaa se, mikä seisoo tielläsi.", "Face what stands in your way."],
  ["Sinnikkyys", "Persistence", "Jatka, vaikka matka vaikeutuu.", "Keep going, even when it gets harder."],
  ["Sopeutuminen", "Adaptation", "Opi. Muuta suuntaa. Voita.", "Learn. Adjust. Overcome."],
  ["Voitto", "Triumph", "Voitto kuuluu sinnikkäälle.", "Victory belongs to the persistent."],
  ["Hallinta", "Mastery", "Muuta esteet voimaksi.", "Turn obstacles into strength."],
  ["Pohdinta", "Reflection", "Katso taakse nähdäksesi matkan.", "Look back to see how far you've come."],
  ["Seuraava ovi", "The Next Door", "Jokainen loppu on uusi alku.", "Every ending is a new beginning."],
]

export const DUNGEON_ROOM_THEME_PAGE: RoomThemePage = {
  id: "dungeon",
  crest: "/images/crests/dungeon-crest.png",
  hero: "/images/themes/dungeon-hero.jpg",
  title: { fi: "Vankityrmä", en: "Dungeon" },
  tagline: { fi: "Eteenpäin vievä polku alkaa sieltä, missä mukavuus päättyy.", en: "The path forward begins where comfort ends." },
  storyTitle: { fi: "Vankityrmä", en: "The Dungeon" },
  storyParagraphs: [
    { fi: "Kartanon alla avautuu unohdettujen käytävien ja muinaisten kammioiden verkosto.", en: "Beneath the Manor lies a network of forgotten passages and ancient chambers." },
    { fi: "Jotkut johtavat aarteisiin. Jotkut vaaraan. Tärkeimmät johtavat löytöihin.", en: "Some lead to treasure. Some lead to danger. The most important ones lead to discovery." },
    { fi: "Vain ne, jotka ovat valmiita astumaan eteenpäin, voivat paljastaa mitä seuraavan oven takana on.", en: "Only those who are willing to step forward can uncover what lies beyond the next door." },
  ],
  essenceTagline: { fi: "Rohkeus avaa jokaisen oven.", en: "Courage opens every door." },
  essenceText: [
    { fi: "Vankityrmä ei kysy, oletko valmis.", en: "The Dungeon does not ask whether you are ready." },
    { fi: "Se kysyy, oletko halukas.", en: "It asks whether you are willing." },
  ],
  journey: steps.map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
  glimpses: [
    { image: "/images/heroes/collection/dungeon.jpg", caption: { fi: "Laskeutuminen", en: "The Landing" } },
    { image: "/images/heroes/events/dungeon.jpg", caption: { fi: "Seurueen huone", en: "The Party Room" } },
    { image: "/images/heroes/discover/dungeon.jpg", caption: { fi: "Suljettu portti", en: "Seek Counsel" } },
  ],
  artifact: {
    name: { fi: "Seikkailijan vala", en: "Adventurer's Oath" },
    image: "/themes/artifacts/dungeon.png",
    description: [{ fi: "Jokaisen lukitun portin takana on valinta. Jokaisen valinnan takana uusi polku.", en: "Beyond every locked gate lies a choice. Beyond every choice lies a new path." }],
  },
  unlocks: [
    { label: { fi: "Vankityrmä-teema", en: "Dungeon Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka vankityrmän läpi", en: "A complete journey through the Dungeon" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Tarinoita, karttoja ja seikkailijan muistiinpanoja", en: "Lore, maps and adventurer's journals" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Rohkeus ei ole pelon puuttumista. Se on päätös jatkaa.", en: "Courage is not the absence of fear. It is the decision to continue." },
}
