import type { RoomThemePage } from "@/lib/room-theme-pages"

export const GALLERY_THEME_PAGE: RoomThemePage = {
  id: "gallery",
  crest: "/images/crests/gallery-crest.png",
  hero: "/images/heroes/gallery-hero.jpg",
  title: { fi: "Galleria", en: "Gallery" },
  tagline: {
    fi: "Jotkut asiat ansaitsevat pysähtymisen.",
    en: "Some things are worth pausing for.",
  },
  storyTitle: { fi: "Galleria", en: "The Gallery" },
  storyParagraphs: [
    { fi: "Näiden seinien sisällä kauneus puhuu muodoissa, väreissä ja linjoissa.", en: "Within these walls, beauty speaks in shapes, colors, and forms." },
    { fi: "Jokaisella teoksella on tarina.", en: "Every piece has a story." },
    { fi: "Jokaisella tarinalla on merkitys.", en: "Every story has a meaning." },
    { fi: "Mutta merkitystä ei löydetä kiireessä.", en: "But meaning is not found in a hurry." },
    { fi: "Se löytyy hiljaisuudesta.", en: "It is found in stillness." },
    { fi: "Hidasta. Katso lähempää. Huomaa, mikä liikuttaa sinua.", en: "Slow down. Look closer. Notice what moves you." },
    { fi: "Anna arvostuksen johdattaa.", en: "Let appreciation guide you." },
  ],
  essenceTagline: { fi: "Arvostus paljastaa kauneuden.", en: "Appreciation reveals beauty." },
  essenceText: [
    { fi: "Galleria ei ole vain taiteen keräämistä.", en: "The Gallery is not about collecting art." },
    { fi: "Se on sen huomaamista.", en: "It is about noticing it." },
  ],
  journey: [
    { title: { fi: "Saapuminen", en: "Arrival" }, description: { fi: "Astu sisään avoimin silmin.", en: "Enter with open eyes." } },
    { title: { fi: "Havainnointi", en: "Observation" }, description: { fi: "Anna yksityiskohtien avautua.", en: "Take in the details." } },
    { title: { fi: "Uteliaisuus", en: "Curiosity" }, description: { fi: "Kysy, mitä teoksen takana on.", en: "Ask what lies behind it." } },
    { title: { fi: "Löytö", en: "Discovery" }, description: { fi: "Löydä tarinat teosten sisältä.", en: "Find stories within." } },
    { title: { fi: "Konteksti", en: "Context" }, description: { fi: "Ymmärrä aika, paikka ja tekijä.", en: "Understand the time, the place, the artist." } },
    { title: { fi: "Pohdinta", en: "Reflection" }, description: { fi: "Anna teoksen puhua.", en: "Let it speak to you." } },
    { title: { fi: "Arvostus", en: "Appreciation" }, description: { fi: "Näe kauneus siinä.", en: "See the beauty in it." } },
    { title: { fi: "Inspiraatio", en: "Inspiration" }, description: { fi: "Anna sen sytyttää jotain uutta.", en: "Let it spark something new." } },
    { title: { fi: "Yhteys", en: "Connection" }, description: { fi: "Tunne yhteys johonkin suurempaan.", en: "Feel the link to something greater than yourself." } },
    { title: { fi: "Perintö", en: "Legacy" }, description: { fi: "Suuri taide elää tekijäänsä pidempään.", en: "Great art outlives its creator." } },
  ],
  glimpses: [
    { image: "/images/heroes/collection/gallery.jpg", caption: { fi: "Suuri sali", en: "The Grand Hall" } },
    { image: "/images/heroes/events/gallery.jpg", caption: { fi: "Katseluhuone", en: "The Viewing Room" } },
    { image: "/images/heroes/discover/gallery.jpg", caption: { fi: "Veistossiipi", en: "The Sculpture Wing" } },
  ],
  artifact: {
    name: { fi: "Oivalluksen linssi", en: "Lens of Insight" },
    image: "/themes/artifacts/gallery.png",
    description: [
      { fi: "Tuntemattomien käsien valmistama linssi paljastaa sen, mikä usein jää huomaamatta — piilotetut yksityiskohdat, syvemmät merkitykset ja kauneuden odottamattomissa paikoissa.", en: "A lens crafted by unknown hands. It reveals what is often overlooked—hidden details, deeper meanings, and beauty in unexpected places." },
      { fi: "Sen suurin voima ei ole nähdä enemmän, vaan ymmärtää paremmin.", en: "Its greatest power lies not in seeing more, but in understanding better." },
    ],
  },
  unlocks: [
    { label: { fi: "Galleria-teema", en: "Gallery Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka gallerian läpi", en: "A complete journey through the Gallery" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Lore, taideteoksia ja kuraattorin muistiinpanoja", en: "Lore, artworks and curator’s notes" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Virstanpylväät, haasteet ja palkinnot", en: "Milestones, challenges & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Kauneus odottaa usein niitä, jotka hidastavat.", en: "Beauty often waits for those who slow down." },
}
