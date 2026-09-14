import type { RoomThemePage } from "@/lib/room-theme-pages"

export const WAR_ROOM_THEME_PAGE: RoomThemePage = {
  id: "war-room",
  crest: "/images/war-room-crest.png",
  hero: "/images/themes/war-room-hero.jpg",
  title: { fi: "Sotahuone", en: "War Room" },
  tagline: { fi: "Johtajuus on vastuuta. Jokainen päätös muovaa matkaa.", en: "Leadership is responsibility. Every decision shapes the journey." },
  storyTitle: { fi: "Sotahuone", en: "The War Room" },
  storyParagraphs: [
    { fi: "Näiden seinien sisällä syntyvät strategiat ja muovautuvat tulevaisuudet.", en: "Within these walls, strategies are born and futures are shaped." },
    { fi: "Täällä tieto muuttuu oivallukseksi ja oivallus toiminnaksi.", en: "Here, information becomes insight, and insight becomes action." },
    { fi: "Voittoa ei ansaita taistelun kuumuudessa — se rakennetaan valmistautumisen rauhassa.", en: "Victory is not earned in the heat of battle—it is built in the calm of preparation." },
    { fi: "Valitse viisaasti, johda kunniallisesti ja kanna jokaisen päätöksen paino.", en: "Choose wisely, lead honorably, and accept the weight of every choice." },
  ],
  essenceTagline: { fi: "Jokainen päätös muovaa edessä olevaa polkua.", en: "Every decision shapes the path ahead." },
  essenceText: [
    { fi: "Sotahuone ei ole ristiriidan paikka.", en: "The War Room is not a place of conflict." },
    { fi: "Se on tarkoituksen paikka.", en: "It is a place of purpose." },
  ],
  journey: [
    ["Näkemys", "Vision", "Näe kokonaisuus.", "See the bigger picture."],
    ["Suunnittelu", "Planning", "Valmistaudu jokaiseen siirtoon.", "Prepare every move."],
    ["Strategia", "Strategy", "Ennakoi tuntematon.", "Outthink the unknown."],
    ["Koordinointi", "Coordination", "Yhdistä voimasi.", "Align your forces."],
    ["Sitoutuminen", "Commitment", "Omistaudu asialle.", "Dedicate to the cause."],
    ["Johtajuus", "Leadership", "Inspiroi ja johda.", "Inspire and guide."],
    ["Sopeutuminen", "Adaptation", "Muuta suuntaa tilanteen mukaan.", "Change with the tides."],
    ["Ratkaisu", "Resolve", "Pysy lujana tarkoituksessasi.", "Stand firm in purpose."],
    ["Vastuu", "Responsibility", "Kanna seuraukset.", "Own the outcome."],
    ["Perintö", "Legacy", "Vaikutuksesi säilyy.", "Your impact remains."],
  ].map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
  glimpses: [
    { image: "/images/heroes/collection/war-room.jpg", caption: { fi: "Johtajan näkymä", en: "The Landing" } },
    { image: "/images/heroes/events/war-room.jpg", caption: { fi: "Strategiapöytä", en: "The Strategy Table" } },
    { image: "/images/heroes/discover/war-room.jpg", caption: { fi: "Neuvoston kammio", en: "Council Chamber" } },
  ],
  artifact: {
    name: { fi: "Komentajan muistio", en: "Commander’s Brief" },
    image: "/themes/artifacts/war-room.png",
    description: [{ fi: "Johtajan muistio, joka yhdistää tavoitteet, ihmiset ja tulevat päätökset.", en: "A commander’s brief connecting purpose, people, and decisions ahead." }],
  },
  unlocks: [
    { label: { fi: "Sotahuone-teema", en: "War Room Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka sotahuoneen läpi", en: "A complete journey through the War Room" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Tarinoita, strategioita ja tärkeitä päätöksiä", en: "Lore, strategies and key decisions" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Jokainen polku alkaa päätöksestä.", en: "Every path begins as a decision." },
}
