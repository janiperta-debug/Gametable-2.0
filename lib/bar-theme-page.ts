import type { RoomThemePage } from "@/lib/room-theme-pages"

export const BAR_THEME_PAGE: RoomThemePage = {
  id: "bar",
  crest: "/images/crests/bar-crest.png",
  hero: "/images/heroes/bar-hero.jpg",
  title: { fi: "Baari", en: "Bar" },
  tagline: {
    fi: "Parhaat tarinat eivät synny kirjoittamalla. Ne jaetaan.",
    en: "The best stories aren’t written. They’re shared.",
  },
  storyTitle: { fi: "Baari", en: "The Bar" },
  storyParagraphs: [
    { fi: "Jokainen yhteisö alkaa keskustelusta.", en: "Every community begins with a conversation." },
    { fi: "Jotkut ovat suunniteltuja. Useimmat eivät.", en: "Some are planned. Most are not." },
    { fi: "Kysymys pöydän yli. Tarina pelin jälkeen. Nauru, joka leviää läheisiin pöytiin.", en: "A question across the table. A story shared after a game. A laugh that spreads to everyone nearby." },
    { fi: "Baari ei ole paikka ajan kuluttamiseen.", en: "The Bar is not a place to pass time." },
    { fi: "Se on paikka, jossa tuntemattomista tulee tuttuja kasvoja.", en: "It is where strangers become familiar faces." },
    { fi: "Istu alas. Liity keskusteluun. Et koskaan tiedä, mihin se johtaa.", en: "Take a seat. Join the conversation. You never know where it might lead." },
  ],
  essenceTagline: { fi: "Jokaisella keskustelulla on jotain opetettavaa.", en: "Every conversation has something to teach." },
  essenceText: [
    { fi: "Baari ei ole sitä, mitä siellä on.", en: "The Bar is not about what is there." },
    { fi: "Se on sitä, mitä siellä jaetaan.", en: "It is about what is shared." },
  ],
  journey: [
    { title: { fi: "Saapuminen", en: "Arrival" }, description: { fi: "Astut sisään.", en: "Step inside." } },
    { title: { fi: "Tervehtiminen", en: "Greeting" }, description: { fi: "Yksinkertainen tervehdys.", en: "A simple hello." } },
    { title: { fi: "Keskustelu", en: "Conversation" }, description: { fi: "Ensimmäinen vaihto.", en: "The first exchange." } },
    { title: { fi: "Kuunteleminen", en: "Listening" }, description: { fi: "Kuule toisen näkökulma.", en: "Hear another perspective." } },
    { title: { fi: "Nauru", en: "Laughter" }, description: { fi: "Hetket, jotka jäävät mieleen.", en: "Moments worth remembering." } },
    { title: { fi: "Tarinat", en: "Stories" }, description: { fi: "Kokemuksia jaetaan.", en: "Experiences shared." } },
    { title: { fi: "Ymmärrys", en: "Understanding" }, description: { fi: "Opi jotain uutta.", en: "Learn something new." } },
    { title: { fi: "Ystävyys", en: "Friendship" }, description: { fi: "Yhteydet syvenevät.", en: "Connections deepen." } },
    { title: { fi: "Perinne", en: "Tradition" }, description: { fi: "Tarinat muuttuvat historiaksi.", en: "Stories become history." } },
    { title: { fi: "Yhteisö", en: "Community" }, description: { fi: "Monista äänistä tulee yksi.", en: "Many voices become one." } },
  ],
  glimpses: [
    { image: "/images/heroes/collection/bar.jpg", caption: { fi: "Tavernanurkka", en: "The Tavern Corner" } },
    { image: "/images/heroes/events/bar.jpg", caption: { fi: "Pitkä pöytä", en: "The Long Table" } },
    { image: "/images/heroes/discover/bar.jpg", caption: { fi: "Iltajoukko", en: "The Evening Crowd" } },
  ],
  artifact: {
    name: { fi: "Baarimestarin päiväkirja", en: "Bartender’s Ledger" },
    image: "/themes/artifacts/bar.png",
    description: [
      { fi: "Vanha nahkakantinen päiväkirja.", en: "An old leather-bound ledger." },
      { fi: "Ei juomista, vaan vuosien tarinoita, muistiinpanoja ja muistoja.", en: "Not a record of drinks, but of years of stories, notes, and memories." },
    ],
  },
  unlocks: [
    { label: { fi: "Baari-teema", en: "Bar Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka baarin läpi", en: "A complete journey through the Bar" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Tarinoita, keskusteluja ja muistoja", en: "Tales, conversations & memories" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Virstanpylväät, haasteet ja palkinnot", en: "Milestones, challenges & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Jokaisella tuntemattomalla on tarina, joka ansaitsee tulla kuulluksi.", en: "Every stranger has a story worth hearing." },
}
