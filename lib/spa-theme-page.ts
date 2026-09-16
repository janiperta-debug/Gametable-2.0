import type { RoomThemePage } from "@/lib/room-theme-pages"

export const SPA_THEME_PAGE: RoomThemePage = {
  id: "spa",
  crest: "/images/spa-crest.png",
  hero: "/images/heroes/spa-hero.jpg",
  title: { fi: "Spa", en: "Spa" },
  tagline: { fi: "Lepo ei ole ylellisyyttä. Se on välttämättömyys.", en: "Rest is not a luxury. It is a necessity." },
  storyTitle: { fi: "Spa", en: "The Spa" },
  storyParagraphs: [
    { fi: "Näiden ovien takana aika hidastuu.", en: "Behind these doors, time slows down." },
    { fi: "Täällä keho rentoutuu ja mieli hiljenee.", en: "Here, the body relaxes and the mind begins to quiet." },
    { fi: "Et voi ammentaa tyhjästä kupista. Et voi kasvaa, kun olet uupunut.", en: "You cannot pour from an empty cup. You cannot grow when you are depleted." },
    { fi: "Hengitä. Päästä irti siitä, mitä et enää tarvitse.", en: "Take a breath. Let go of what you no longer need." },
    { fi: "Palauta se, millä on todella merkitystä.", en: "Restore what truly matters." },
  ],
  essenceTagline: { fi: "Palautuminen luo tasapainoa.", en: "Restoration creates balance." },
  essenceText: [
    { fi: "Spa ei ole hemmottelua varten.", en: "The Spa is not about pampering." },
    { fi: "Se on paluuta omaan itseesi.", en: "It is about returning to yourself." },
  ],
  journey: [
    { title: { fi: "Saapuminen", en: "Arrival" }, description: { fi: "Jätä maailma ulkopuolelle.", en: "Leave the world outside." } },
    { title: { fi: "Irti päästäminen", en: "Release" }, description: { fi: "Päästä irti siitä, mikä painaa.", en: "Let go of what weighs you down." } },
    { title: { fi: "Hengitys", en: "Breath" }, description: { fi: "Palaa tähän hetkeen.", en: "Return to the present moment." } },
    { title: { fi: "Rentoutuminen", en: "Relaxation" }, description: { fi: "Anna kehosi pehmentyä.", en: "Allow your body to soften." } },
    { title: { fi: "Uusiutuminen", en: "Renewal" }, description: { fi: "Palauta energiasi.", en: "Restore your energy." } },
    { title: { fi: "Selkeys", en: "Clarity" }, description: { fi: "Selkeä mieli, selkeä polku.", en: "Clear mind, clear path." } },
    { title: { fi: "Tasapaino", en: "Balance" }, description: { fi: "Aseta tärkeät asiat uudelleen paikoilleen.", en: "Realign what matters." } },
    { title: { fi: "Seesteisyys", en: "Serenity" }, description: { fi: "Tunne rauha sisälläsi.", en: "Feel peace within." } },
    { title: { fi: "Vahvuus", en: "Strength" }, description: { fi: "Lepo rakentaa kestävyyttä.", en: "Rest builds resilience." } },
    { title: { fi: "Harmonia", en: "Harmony" }, description: { fi: "Palaa maailmaan uudistuneena.", en: "Return to the world renewed." } },
  ],
  glimpses: [
    { image: "/images/heroes/collection/spa.jpg", caption: { fi: "Rentoutumissali", en: "The Relaxation Lounge" } },
    { image: "/images/heroes/events/spa.jpg", caption: { fi: "Lämpöallas", en: "The Thermal Pool" } },
    { image: "/images/heroes/discover/spa.jpg", caption: { fi: "Hoitohuone", en: "The Treatment Room" } },
  ],
  artifact: {
    name: { fi: "Rauhan pullo", en: "Vial of Tranquility" },
    image: "/themes/artifacts/spa.png",
    description: [{ fi: "Hienovarainen amuletti, joka muistuttaa levon ja palautumisen voimasta.", en: "A vial of calming essence from distant springs. It soothes the mind and restores balance. Its power is subtle, but its effects are lasting." }],
  },
  unlocks: [
    { label: { fi: "Spa-teema", en: "Spa Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka Span läpi", en: "A complete journey through the Spa" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Wellness stories & mindful moments", en: "Wellness stories & mindful moments" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Et voi aina hallita sitä, mitä tapahtuu. Mutta voit valita, miten palaudut.", en: "You can't always control what happens. But you can choose how you restore." },
}
