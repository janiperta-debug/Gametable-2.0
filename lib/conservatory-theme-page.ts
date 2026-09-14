import type { RoomThemePage } from "@/lib/room-theme-pages"

export const CONSERVATORY_THEME_PAGE: RoomThemePage = {
  id: "conservatory",
  crest: "/images/conservatory-crest.png",
  hero: "/images/heroes/conservatory-hero.jpg",
  title: { fi: "Kasvihuone", en: "Conservatory" },
  tagline: {
    fi: "Kasvu vie aikaa. Niin vie kauneuskin.",
    en: "Growth takes time. So does beauty.",
  },
  storyTitle: { fi: "Kasvihuone", en: "The Conservatory" },
  storyParagraphs: [
    { fi: "Täällä elämä saa kasvaa.", en: "Here, life is nurtured." },
    { fi: "Hiljaisuudessa asiat kasvavat.", en: "In stillness, things grow." },
    { fi: "Kaikki kasvu ei näy. Kaikki muutos ei ole nopeaa.", en: "Not all growth is visible. Not all change is fast." },
    { fi: "Anna valoa. Anna huolenpitoa. Anna aikaa.", en: "Give it light. Give it care. Give it time." },
    { fi: "Luota siihen, mikä on vasta tulossa. Jokainen lehti oli kerran alku. Niin olet sinäkin yhä matkalla.", en: "And trust what is becoming. Every leaf was once a beginning. You are still becoming too." },
  ],
  essenceTagline: { fi: "Kärsivällisyys luo kasvua.", en: "Patience creates growth." },
  essenceText: [
    { fi: "Kasvihuone ei ole harvinaisia kasveja varten.", en: "The Conservatory is not about rare plants." },
    { fi: "Se on sen hoitamista, millä on merkitystä.", en: "It is about tending to what matters." },
  ],
  journey: [
    { title: { fi: "Saapuminen", en: "Arrival" }, description: { fi: "Astut hiljaisuuteen.", en: "Step into stillness." } },
    { title: { fi: "Havainnointi", en: "Observation" }, description: { fi: "Huomaa pienet asiat.", en: "Notice the small things." } },
    { title: { fi: "Ravitseminen", en: "Nurture" }, description: { fi: "Anna sitä, mitä tarvitaan.", en: "Give what is needed." } },
    { title: { fi: "Kärsivällisyys", en: "Patience" }, description: { fi: "Kasvua ei voi kiirehtiä.", en: "Growth cannot be rushed." } },
    { title: { fi: "Muutos", en: "Change" }, description: { fi: "Hyväksy se, mikä avautuu.", en: "Embrace what is unfolding." } },
    { title: { fi: "Huolenpito", en: "Care" }, description: { fi: "Pienillä teoilla on pitkä vaikutus.", en: "Small actions, lasting impact." } },
    { title: { fi: "Kestävyys", en: "Resilience" }, description: { fi: "Kestä vuodenajat.", en: "Weather the seasons." } },
    { title: { fi: "Kukoistus", en: "Flourish" }, description: { fi: "Työsi puhkeaa kukkaan.", en: "Your efforts bloom." } },
    { title: { fi: "Kiitollisuus", en: "Gratitude" }, description: { fi: "Arvosta matkaa.", en: "Appreciate the journey." } },
    { title: { fi: "Uusiutuminen", en: "Renewal" }, description: { fi: "Aloita uudelleen, vahvempana.", en: "Begin again, stronger." } },
  ],
  glimpses: [
    { image: "/images/heroes/collection/conservatory.jpg", caption: { fi: "Aurinkoinen atrium", en: "The Sunlit Atrium" } },
    { image: "/images/heroes/events/conservatory.jpg", caption: { fi: "Orkideanurkkaus", en: "The Orchid Nook" } },
    { image: "/images/heroes/discover/conservatory.jpg", caption: { fi: "Puutarhan soppi", en: "The Garden Alcove" } },
  ],
  artifact: {
    name: { fi: "Puutarhurin siemen", en: "The Gardener's Seed" },
    image: "/themes/artifacts/conservatory.png",
    description: [{ fi: "Pieni siemen, joka muistuttaa kärsivällisyydestä ja mahdollisuudesta.", en: "A small seed, a reminder of patience and possibility." }],
  },
  unlocks: [
    { label: { fi: "Kasvihuone-teema", en: "Conservatory Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka Kasvihuoneen läpi", en: "A complete journey through the Conservatory" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Kasvutarinoita ja kasvitieteellistä perinnettä", en: "Growth stories & botanical lore" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Siementä ei voi kiirehtiä kukaksi. Mutta voit luoda oikeat olosuhteet.", en: "You can’t rush a seed into a flower. But you can create the right conditions." },
}
