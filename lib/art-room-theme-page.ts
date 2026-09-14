import type { RoomThemePage } from "@/lib/room-theme-pages"

/** Art Room preview content, based on the approved mockup. */
export const ART_ROOM_THEME_PAGE: RoomThemePage = {
  id: "artroom",
  crest: "/images/crests/art-room-crest.png",
  hero: "/images/themes/art-room-hero.jpg",
  title: { fi: "Taidehuone", en: "Art Room" },
  tagline: {
    fi: "Maailma muuttuu, kun muutat tapaasi nähdä se.",
    en: "The world changes when you change how you see it.",
  },
  storyTitle: { fi: "Taidehuone", en: "The Art Room" },
  storyParagraphs: [
    { fi: "Täällä mielikuvitus saa muodon ja ideat löytävät siipensä.", en: "Here, imagination takes shape and ideas find their form." },
    { fi: "Jokainen siveltimen veto, jokainen viiva ja jokainen sana on uusi tapa ymmärtää maailmaa.", en: "Every brushstroke, every line, and every word is a new way of understanding the world." },
    { fi: "Ei ole yhtä oikeaa tapaa luoda — on vain sinun tapasi.", en: "There is no single way to create—only your way." },
    { fi: "Nosta työkalu. Luota visioosi. Anna jonkin ainutlaatuisen syntyä.", en: "Pick up a tool, trust your vision, and let something unique be born." },
  ],
  essenceTagline: { fi: "Luovuus paljastaa uusia näkökulmia.", en: "Creativity reveals new perspectives." },
  essenceText: [
    { fi: "Taidehuone ei ole täydellisten asioiden luomista.", en: "The Art Room is not about creating perfect things." },
    { fi: "Se on tuttujen asioiden näkemistä uudella tavalla.", en: "It is about seeing familiar things differently." },
  ],
  journey: [
    { title: { fi: "Inspiraatio", en: "Inspiration" }, description: { fi: "Anna kipinän syttyä.", en: "Let the spark appear." } },
    { title: { fi: "Havainnointi", en: "Observation" }, description: { fi: "Katso yksityiskohtia tarkasti.", en: "Look closely at the details." } },
    { title: { fi: "Mielikuvitus", en: "Imagination" }, description: { fi: "Kuvittele, mitä voisi olla.", en: "Envision what could be." } },
    { title: { fi: "Kokeilu", en: "Experimentation" }, description: { fi: "Kokeile, epäonnistu, opi ja kokeile uudelleen.", en: "Try, fail, learn, try again." } },
    { title: { fi: "Ilmaisu", en: "Expression" }, description: { fi: "Anna ajatuksillesi muoto.", en: "Put your thoughts into form." } },
    { title: { fi: "Pohdinta", en: "Reflection" }, description: { fi: "Ota askel taaksepäin ja katso.", en: "Step back and observe." } },
    { title: { fi: "Muokkaus", en: "Revision" }, description: { fi: "Hio rohkeasti.", en: "Refine without fear." } },
    { title: { fi: "Merkitys", en: "Meaning" }, description: { fi: "Mitä työ todella sanoo?", en: "What does it truly say?" } },
    { title: { fi: "Perspektiivi", en: "Perspective" }, description: { fi: "Näe se — ja itsesi — toisin.", en: "See it—and yourself—differently." } },
    { title: { fi: "Luominen", en: "Creation" }, description: { fi: "Tuo jotakin uutta elämään.", en: "Bring something new to life." } },
  ],
  glimpses: [
    { image: "/images/heroes/collection/art-room.jpg", caption: { fi: "Studio", en: "The Studio" } },
    { image: "/images/heroes/events/art-room.jpg", caption: { fi: "Inspiraation seinä", en: "The Inspiration Wall" } },
    { image: "/images/heroes/discover/art-room.jpg", caption: { fi: "Työpöytä", en: "The Worktable" } },
  ],
  artifact: {
    name: { fi: "Taiteilijan luonnoskirja", en: "Artist's Sketchbook" },
    image: "/themes/artifacts/artroom.png",
    description: [{ fi: "Luonnoskirja ensimmäisille ideoille, muistiinpanoille ja keskeneräisille mestariteoksille.", en: "A sketchbook for first ideas, notes, and unfinished masterpieces." }],
  },
  unlocks: [
    { label: { fi: "Taidehuone-teema", en: "Art Room Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka Taidehuoneen läpi", en: "A complete journey through the Art Room" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Lore, luonnokset ja luojan ajatukset", en: "Lore, sketches and creator's thoughts" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavat virstanpylväät ja palkinnot", en: "Challenging milestones & rewards" } },
    { label: { fi: "Lor e-merkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Jokainen mestariteos alkaa ideasta.", en: "Every masterpiece begins as an idea." },
}
