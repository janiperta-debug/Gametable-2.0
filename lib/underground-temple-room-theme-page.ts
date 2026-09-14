import type { RoomThemePage } from "@/lib/room-theme-pages"

const steps = [
  ["Kutsu", "Invitation", "Kutsu uteliaille.", "A call to the curious."],
  ["Viisaus", "Wisdom", "Muinaiset ajatukset kestävät.", "Ancient thoughts endure."],
  ["Pohdinta", "Reflection", "Katso sisäänpäin.", "Look within."],
  ["Väittely", "Debate", "Haasta ajatukset.", "Challenge ideas."],
  ["Rituaali", "Ritual", "Tietoa kunnioitetaan.", "Knowledge is honored."],
  ["Mietiskely", "Contemplation", "Hiljaisuus paljastaa.", "Silence reveals."],
  ["Vuoropuhelu", "Dialogue", "Jaa ja kuuntele.", "Share and listen."],
  ["Ilmestys", "Revelation", "Uusi näkökulma sarastaa.", "A new perspective dawns."],
  ["Ymmärrys", "Understanding", "Palaset asettuvat paikoilleen.", "Pieces align."],
  ["Seuraava kysymys", "The Next Question", "Matka jatkuu.", "The journey continues."],
]

export const UNDERGROUND_TEMPLE_ROOM_THEME_PAGE: RoomThemePage = {
  id: "underground-temple",
  crest: "/images/crests/underground-temple-crest.png",
  hero: "/images/themes/underground-temple-hero.jpg",
  title: { fi: "Maanalainen temppeli", en: "Underground Temple" },
  tagline: { fi: "Kaikki kysymykset eivät etsi vastausta.", en: "Not every question seeks an answer." },
  storyTitle: { fi: "Maanalainen temppeli", en: "The Underground Temple" },
  storyParagraphs: [
    { fi: "Syvällä kartanon alla sijaitsee paikka, joka rakennettiin pohtimista — ei tiedon varastointia — varten.", en: "Deep beneath the Manor lies a place built not to store knowledge, but to contemplate it." },
    { fi: "Täällä kysymyksiä säilytetään ja ajatuksia tutkitaan. Viisautta arvostetaan varmuutta enemmän.", en: "Here, questions are preserved. Ideas are examined. Wisdom is valued above certainty." },
    { fi: "Näissä pyhissä saleissa mielet kokoontuvat etsimään ymmärrystä, eivät lopullista totuutta.", en: "Within these sacred halls, minds gather not to find the final truth, but to seek understanding." },
  ],
  essenceTagline: { fi: "Kysymykset ovat pyhiä.", en: "Questions are sacred." },
  essenceText: [
    { fi: "Temppeli ei opeta mitä ajatella.", en: "The Temple does not teach you what to think." },
    { fi: "Se opettaa kuinka etsiä.", en: "It teaches you how to seek." },
  ],
  journey: steps.map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
  glimpses: [
    { image: "/images/heroes/collection/underground-temple.jpg", caption: { fi: "Laskeutuminen", en: "The Landing" } },
    { image: "/images/heroes/events/underground-temple.jpg", caption: { fi: "Rituaali", en: "The Ritual" } },
    { image: "/images/heroes/discover/underground-temple.jpg", caption: { fi: "Muinaisen tiedon kammio", en: "Seek Counsel" } },
  ],
  artifact: {
    name: { fi: "Temppelin kirjoitus", en: "Temple Inscription" },
    image: "/themes/artifacts/underground-temple.png",
    description: [{ fi: "Viisaita eivät ole ne, jotka pitävät vastauksia. He ovat niitä, jotka jatkavat kysymistä.", en: "The wise are not those who hold answers. They are those who continue asking." }],
  },
  unlocks: [
    { label: { fi: "Temppeli-teema", en: "Temple Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka temppelin läpi", en: "A complete journey through the Temple" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Tarinoita, muistiinpanoja ja muinaisia kirjoituksia", en: "Lore, notes and ancient records" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Temppeli säilyttää sen, mitä maailma unohtaa kysyä. Jokainen eteenpäin viemäsi kysymys liittyy viisauteen, jota ei ole vielä kirjoitettu.", en: "The Temple preserves what the world forgets to ask. Every question you carry forward becomes part of the wisdom yet to be written." },
}
