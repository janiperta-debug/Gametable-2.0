import type { RoomThemePage } from "@/lib/room-theme-pages"

export const MAP_ROOM_THEME_PAGE: RoomThemePage = {
  id: "map-room",
  crest: "/images/map-room-crest.png",
  hero: "/images/themes/map-room-hero.jpg",
  title: { fi: "Karttahuone", en: "Map Room" },
  tagline: { fi: "Jokainen matka alkaa yhdestä askeleesta kartalla.", en: "Every journey begins with a single step on the map." },
  storyTitle: { fi: "Karttahuone", en: "The Map Room" },
  storyParagraphs: [
    { fi: "Täällä maailma levittäytyy eteesi. Vuoret ja laaksot, kaukaiset maat ja piilotetut polut.", en: "Here, the world is laid before you. Mountains and valleys, distant lands and hidden paths." },
    { fi: "Hyvä kartta ei näytä vain missä olet — se näyttää myös, minne voisit mennä.", en: "A good map doesn’t show only where you are—it shows where you could go." },
    { fi: "Maailman ymmärtäminen on ensimmäinen askel oman paikkasi löytämiseen.", en: "Knowledge of the world is the first step toward finding your place in it." },
  ],
  essenceTagline: { fi: "Maailman ymmärtäminen avaa tien eteenpäin.", en: "Understanding the world opens the path forward." },
  essenceText: [
    { fi: "Kartta ei ole matka.", en: "The map is not the journey." },
    { fi: "Mutta se tekee matkasta mahdollisen.", en: "But it makes the journey possible." },
  ],
  journey: [
    ["Suunnistautuminen", "Orientation", "Löydä suuntasi.", "Find your bearings."],
    ["Tutkiminen", "Exploration", "Löydä se, mikä odottaa tuolla puolen.", "Discover what lies beyond."],
    ["Maamerkit", "Landmarks", "Huomaa se, mikä erottuu.", "Notice what stands out."],
    ["Yhteydet", "Connections", "Näe, miten paikat liittyvät toisiinsa.", "See how places relate."],
    ["Reitit", "Routes", "Piirrä mahdolliset polut.", "Plot possible paths."],
    ["Valmistautuminen", "Preparation", "Suunnittele tarkoituksella.", "Plan with purpose."],
    ["Valinnat", "Choices", "Jokaisella polulla on vaihtoehtoja.", "Every path has options."],
    ["Epävarmuus", "Uncertainty", "Kaikki ei ole vielä paljastunut.", "Not everything is revealed."],
    ["Luottamus", "Confidence", "Luota ymmärrykseesi.", "Trust your understanding."],
    ["Lähtö", "Departure", "Matka odottaa.", "The journey awaits."],
  ].map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
  glimpses: [
    { image: "/images/heroes/collection/map-room.jpg", caption: { fi: "Yleiskuva", en: "The Overview" } },
    { image: "/images/heroes/events/map-room.jpg", caption: { fi: "Kartantekijän työpöytä", en: "The Cartographer’s Desk" } },
    { image: "/images/heroes/discover/map-room.jpg", caption: { fi: "Tuntematon kartalle", en: "Chart the Unknown" } },
  ],
  artifact: {
    name: { fi: "Kartantekijän päiväkirja", en: "Cartographer’s Journal" },
    image: "/themes/artifacts/map-room.png",
    description: [{ fi: "Vanha päiväkirja, joka muistuttaa, että jokainen reitti alkaa siitä, missä seisot.", en: "An old journal reminding us that every route begins where you stand." }],
  },
  unlocks: [
    { label: { fi: "Karttahuone-teema", en: "Map Room Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka karttahuoneen läpi", en: "A complete journey through the Map Room" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Tarinoita, karttoja ja tutkimusmatkailijan muistiinpanoja", en: "Lore, maps and explorer’s notes" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Kartta ei paljasta kaikkea. Se paljastaa sen, millä on merkitystä.", en: "A map doesn’t reveal everything. It reveals what matters." },
}
