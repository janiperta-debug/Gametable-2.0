import type { RoomThemePage } from "@/lib/room-theme-pages"

const steps = [
  ["Havainnointi", "Observation", "Huomaa yksityiskohdat.", "Notice the details."],
  ["Hypoteesi", "Hypothesis", "Muodosta teoria.", "Form a theory."],
  ["Koe", "Experiment", "Laita se koetukselle.", "Put it to the test."],
  ["Epäonnistuminen", "Failure", "Kaikki tulokset eivät onnistu.", "Not every result is a success."],
  ["Säätö", "Adjustment", "Opi ja mukauta.", "Learn and adapt."],
  ["Läpimurto", "Breakthrough", "Uusi mahdollisuus avautuu.", "A new possibility emerges."],
  ["Analyysi", "Analysis", "Tutki tuloksia.", "Examine the results."],
  ["Jalostaminen", "Refinement", "Tee siitä vahvempi.", "Make it stronger."],
  ["Ymmärrys", "Understanding", "Palaset liittyvät yhteen.", "The pieces come together."],
  ["Uusi kysymys", "New Question", "Kierto alkaa uudelleen.", "The cycle begins again."],
]

export const ALCHEMIST_LABORATORY_THEME_PAGE: RoomThemePage = {
  id: "alchemist-laboratory",
  crest: "/images/crests/alchemist-crest.png",
  hero: "/images/themes/alchemist-laboratory-hero.jpg",
  title: { fi: "Alkemistin laboratorio", en: "Alchemist's Laboratory" },
  tagline: { fi: "Jokainen löytö alkaa kokeesta.", en: "Every discovery begins as an experiment." },
  storyTitle: { fi: "Alkemistin laboratorio", en: "The Alchemist's Laboratory" },
  storyParagraphs: [
    { fi: "Syvällä kartanon alla sijaitsee laboratorio, joka on omistettu taikuuden sijaan löytämiselle.", en: "Deep within the Manor lies a laboratory devoted not to magic, but to discovery." },
    { fi: "Täällä teorioita testataan ja ajatuksia jalostetaan. Jokaisesta tuloksesta tulee seuraavan kokeen perusta.", en: "Here, theories are tested and ideas are refined. Every result becomes the foundation for the next experiment." },
    { fi: "Uteliaisuuden ja sinnikkyyden avulla raakat mahdollisuudet muuttuvat ymmärrykseksi.", en: "Through curiosity and persistence, raw possibilities are transformed into understanding." },
  ],
  essenceTagline: { fi: "Ymmärrys ansaitaan.", en: "Understanding is earned." },
  essenceText: [
    { fi: "Laboratorio ei palkitse varmuutta.", en: "The Laboratory does not reward certainty." },
    { fi: "Se palkitsee uteliaisuuden.", en: "It rewards curiosity." },
  ],
  journey: steps.map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
  glimpses: [
    { image: "/images/heroes/collection/alchemist-laboratory.jpg", caption: { fi: "Laboratorio", en: "The Laboratory" } },
    { image: "/images/heroes/events/alchemist-laboratory.jpg", caption: { fi: "Läpimurto", en: "The Breakthrough" } },
    { image: "/images/heroes/discover/alchemist-laboratory.jpg", caption: { fi: "Tutkimuspöytä", en: "Seek Counsel" } },
  ],
  artifact: {
    name: { fi: "Tutkimuspäiväkirja", en: "Research Log" },
    image: "/themes/artifacts/alchemist-laboratory.png",
    description: [{ fi: "Jokainen epäonnistunut koe kaventaa tietä kohti ymmärrystä.", en: "Every failed experiment narrows the path to understanding." }],
  },
  unlocks: [
    { label: { fi: "Laboratorio-teema", en: "Laboratory Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka laboratorion läpi", en: "A complete journey through the Laboratory" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Tarinoita, tutkimuksia ja laboratoriomuistiinpanoja", en: "Lore, notes and research records" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Uteliaisuus on kipinä. Koe on polku. Ymmärrys on palkinto.", en: "Curiosity is the spark. Experiment is the path. Understanding is the reward." },
}
