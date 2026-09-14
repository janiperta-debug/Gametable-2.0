import type { RoomThemePage } from "@/lib/room-theme-pages"

const sharedUnlocks = (theme: string, journey: string, lore: string) => [
  { label: { fi: theme, en: "Ballroom Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
  { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: journey, en: "A complete journey through the Ballroom" } },
  { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: lore, en: "Lore, guests and cherished moments" } },
  { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
  { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
]

export const BALLROOM_THEME_PAGE: RoomThemePage = {
  id: "ballroom",
  crest: "/images/ballroom-crest.png",
  hero: "/images/themes/ballroom-hero.jpg",
  title: { fi: "Juhlasali", en: "Ballroom" },
  tagline: { fi: "Jokainen suuri ilta alkaa yhdestä kohtaamisesta.", en: "Every great evening begins with a single introduction." },
  storyTitle: { fi: "Juhlasali", en: "The Ballroom" },
  storyParagraphs: [
    { fi: "Täällä ystävyyssuhteet syntyvät ja siteet vahvistuvat.", en: "Here, friendships are born and bonds are formed." },
    { fi: "Jokaisella vieraalla on tarina, ja jokaisella tarinalla voima yhdistää.", en: "In this hall, every guest has a story, and every story has the power to connect." },
    { fi: "Suurimpia kokoontumisia ei mitata koolla vaan hengellä.", en: "The greatest gatherings are not measured by their size, but by their spirit." },
    { fi: "Astut sisään, tarjoat hymyn ja tulet osaksi jotakin suurempaa.", en: "Step inside, offer a smile, and become part of something greater." },
  ],
  essenceTagline: { fi: "Yhteydet luovat muistoja.", en: "Connections create memories." },
  essenceText: [
    { fi: "Juhlasali ei ole tanssimista varten.", en: "The Ballroom is not about dancing." },
    { fi: "Se on kohtaamista varten.", en: "It is about meeting." },
  ],
  journey: [
    ["Saapuminen", "Arrival", "Astut uusiin mahdollisuuksiin.", "Step into new possibilities."],
    ["Tervehdys", "Greeting", "Yksinkertainen tervehdys voi aloittaa kaiken.", "A simple hello can start everything."],
    ["Keskustelu", "Conversation", "Sanat avaavat ovia.", "Words open doors."],
    ["Yhteys", "Connection", "Löydä yhteinen sävel.", "Find common ground."],
    ["Luottamus", "Trust", "Rakenna jokaisen siteen perusta.", "Build the foundation of every bond."],
    ["Juhla", "Celebration", "Jaa yhdessäolon ilo.", "Share in the joy of togetherness."],
    ["Kuuluminen", "Belonging", "Tunne olosi kotoisaksi muiden joukossa.", "Feel at home among others."],
    ["Ystävyys", "Friendship", "Vahvistu yhdessä.", "Stronger together."],
    ["Yhteisö", "Community", "Monia sydämiä, yksi henki.", "Many hearts, one spirit."],
    ["Jälleennäkeminen", "Reunion", "Palaa sinne, missä olet aina tervetullut.", "Come back to where you are always welcome."],
  ].map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
  glimpses: [
    { image: "/images/heroes/collection/ballroom.jpg", caption: { fi: "Sisäänkäynti", en: "The Entrance" } },
    { image: "/images/heroes/events/ballroom.jpg", caption: { fi: "Tanssilattia", en: "The Dance Floor" } },
    { image: "/images/heroes/discover/ballroom.jpg", caption: { fi: "Salonki", en: "The Lounge" } },
  ],
  artifact: { name: { fi: "Isännän kutsu", en: "Host's Invitation" }, image: "/themes/artifacts/ballroom.png", description: [{ fi: "Kutsu iltaan, jossa syntyy hyviä seurueita, jaettuja tarinoita ja kestäviä muistoja.", en: "An invitation to an evening of good company, shared stories, and lasting memories." }] },
  unlocks: sharedUnlocks("Juhlasali-teema", "Täydellinen matka juhlasalin läpi", "Vieraita, juhlia ja rakkaita muistoja"),
  footerLine: { fi: "Suurimmat muistot jaetaan yhdessä.", en: "The greatest memories are shared." },
}
