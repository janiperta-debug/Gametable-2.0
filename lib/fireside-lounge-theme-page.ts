import type { RoomThemePage } from "@/lib/room-theme-pages"

export const FIRESIDE_LOUNGE_THEME_PAGE: RoomThemePage = {
  id: "fireside-lounge",
  crest: "/images/fireside-lounge-crest.png",
  hero: "/images/heroes/fireside-lounge-hero.jpg",
  title: { fi: "Takkahuone", en: "Fireside Lounge" },
  tagline: {
    fi: "Jotkut paikat lämmittävät enemmän kuin käsiä.",
    en: "Some places warm more than your hands.",
  },
  storyTitle: { fi: "Takkahuone", en: "The Fireside Lounge" },
  storyParagraphs: [
    { fi: "Täällä päivä hidastuu ja sydän avautuu.", en: "Here, the day slows down and the heart opens up." },
    { fi: "Tarinoita jaetaan. Hiljaisuus on tervetullutta.", en: "Stories are shared. Silence is welcome." },
    { fi: "Sinun ei tarvitse esittää mitään. Voit vain olla.", en: "You don’t have to perform. You can just be." },
    { fi: "Tuli on vakaa. Istuimet ovat pehmeitä. Olet ystävien keskellä.", en: "The fire is steady. The seats are soft. You are among friends." },
    { fi: "Tämä on kotisi poissa kotoa.", en: "This is your home away from home." },
  ],
  essenceTagline: { fi: "Mukavuus luo yhteyden.", en: "Comfort creates connection." },
  essenceText: [
    { fi: "Takkahuone ei ole vain tulta varten.", en: "The Fireside Lounge is not about the fire." },
    { fi: "Se on niitä ihmisiä varten, jotka kokoontuvat sen ympärille.", en: "It is about the people gathered around it." },
  ],
  journey: [
    { title: { fi: "Saapuminen", en: "Arrival" }, description: { fi: "Tule sisään. Olet tervetullut.", en: "Come in. You’re welcome." } },
    { title: { fi: "Lämpö", en: "Warmth" }, description: { fi: "Anna lämmön saavuttaa sinut.", en: "Let the heat reach you." } },
    { title: { fi: "Mukavuus", en: "Comfort" }, description: { fi: "Asetu. Hengitä ulos.", en: "Settle in. Exhale." } },
    { title: { fi: "Keskustelu", en: "Conversation" }, description: { fi: "Jaa se, millä on merkitystä.", en: "Share what matters." } },
    { title: { fi: "Kuunteleminen", en: "Listening" }, description: { fi: "Kuuntele sydämelläsi.", en: "Hear with your heart." } },
    { title: { fi: "Luottamus", en: "Trust" }, description: { fi: "Ole aito. Ole avoin.", en: "Be real. Be open." } },
    { title: { fi: "Pohdinta", en: "Reflection" }, description: { fi: "Katso taaksepäin. Katso sisäänpäin.", en: "Look back. Look within." } },
    { title: { fi: "Kuuluminen", en: "Belonging" }, description: { fi: "Et ole täällä yksin.", en: "You are not alone here." } },
    { title: { fi: "Ystävyys", en: "Friendship" }, description: { fi: "Siteet syntyvät hiljaa.", en: "Bonds are quietly formed." } },
    { title: { fi: "Koti", en: "Home" }, description: { fi: "Täällä kuulut joukkoon.", en: "This is where you belong." } },
  ],
  glimpses: [
    { image: "/images/heroes/collection/fireside-lounge.jpg", caption: { fi: "Suuri takkatuli", en: "The Grand Fireplace" } },
    { image: "/images/heroes/events/fireside-lounge.jpg", caption: { fi: "Lukunurkkaus", en: "The Reading Nook" } },
    { image: "/images/heroes/discover/fireside-lounge.jpg", caption: { fi: "Keskustelunurkka", en: "The Conversation Corner" } },
  ],
  artifact: {
    name: { fi: "Tulen sirpale", en: "The Ember Fragment" },
    image: "/themes/artifacts/fireside-lounge.png",
    description: [{ fi: "Pieni hehkuva sirpale, joka säilyttää yhteisten hetkien lämmön.", en: "A small glowing fragment that preserves the warmth of shared moments." }],
  },
  unlocks: [
    { label: { fi: "Takkahuone-teema", en: "Fireside Lounge Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka Takkahuoneen läpi", en: "A complete journey through the Lounge" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Tarinoita, muistoja ja sydämellisiä hetkiä", en: "Stories, memories & heartfelt moments" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Lämpimimmät paikat syntyvät ihmisistä, jotka ovat niiden sisällä.", en: "The warmest places are built by the people within them." },
}
