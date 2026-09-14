/**
 * ROOM THEME PAGES — content data for the per-room theme pages.
 * The visual template is fixed; each room supplies only bilingual content and
 * existing asset paths.
 */

export interface Localized {
  fi: string
  en: string
}

export interface JourneyStep {
  title: Localized
  description: Localized
}

export interface GlimpseImage {
  image: string
  caption: Localized
}

export interface UnlockItem {
  label: Localized
  description: Localized
}

export interface RoomThemePage {
  id: string
  crest: string
  hero: string
  title: Localized
  tagline: Localized
  storyTitle: Localized
  storyParagraphs: Localized[]
  essenceTagline: Localized
  essenceText: Localized[]
  journey: JourneyStep[]
  glimpses: GlimpseImage[]
  artifact: {
    name: Localized
    image: string
    description: Localized[]
  }
  unlocks: UnlockItem[]
  footerLine: Localized
}

const sharedUnlocks = (theme: Localized, journey: Localized, lore: Localized): UnlockItem[] => [
  { label: theme, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
  { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: journey },
  { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: lore },
  { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
  { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
]

export const ROOM_THEME_PAGES: Record<string, RoomThemePage> = {
  "main-hall": {
    id: "main-hall",
    crest: "/images/mainhall-crest-original.png",
    hero: "/images/themes/main-hall-hero.jpg",
    title: { fi: "Pääsali", en: "Main Hall" },
    tagline: { fi: "Jokainen matka alkaa siitä, mistä astut sisään.", en: "Every journey begins where you first step in." },
    storyTitle: { fi: "Pääsali", en: "The Main Hall" },
    storyParagraphs: [
      { fi: "Jokainen ovi jonka avaat. Jokainen huone johon astut. Jokainen valinta jonka teet. Kaikki alkaa täältä.", en: "Every door you open. Every room you enter. Every choice you make. It all begins here." },
      { fi: "Tämä on kartanon sydän. Täältä polkusi avautuu lukemattomiin suuntiin.", en: "This is the heart of the Manor. From here, your path unfolds in countless ways." },
      { fi: "Pysähdy hetkeksi. Katso ympärillesi. Tarinasi on valmis alkamaan.", en: "Take a moment. Look around. Your story is ready to begin." },
    ],
    essenceTagline: { fi: "Valinta luo matkasi.", en: "Choice creates your journey." },
    essenceText: [
      { fi: "Pääsali ei ole vain paikka.", en: "The Main Hall is not just a place." },
      { fi: "Se on alku.", en: "It is a beginning." },
      { fi: "Se on kutsusi.", en: "It is your invitation." },
    ],
    journey: [
      ["Saapuminen", "Arrival", "Astut sisään johonkin suurempaan.", "You step into something greater."],
      ["Suunnistautuminen", "Orientation", "Otat kaiken sisään.", "You take it all in."],
      ["Mahdollisuus", "Possibility", "Polut paljastuvat.", "Paths reveal themselves."],
      ["Aikomus", "Intention", "Asetat suuntasi.", "You set your direction."],
      ["Ensiaskeleet", "First Steps", "Aloitat matkasi.", "You begin your journey."],
      ["Tutkiminen", "Exploration", "Löydät uusia ovia.", "You discover new doors."],
      ["Kasvu", "Growth", "Muutut matkan varrella.", "You change along the way."],
      ["Tarkoitus", "Purpose", "Ymmärrät miksi tulit.", "You understand why you came."],
      ["Vaikutus", "Impact", "Matkasi muovaa sinua.", "Your journey shapes you."],
      ["Perintö", "Legacy", "Tarinastasi tulee osa kartanoa.", "Your story becomes part of the Manor."],
    ].map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
    glimpses: [
      { image: "/images/heroes/collection/main-hall.jpg", caption: { fi: "Suuri portaikko", en: "The Grand Staircase" } },
      { image: "/images/heroes/events/main-hall.jpg", caption: { fi: "Tervetulogalleria", en: "The Welcome Gallery" } },
      { image: "/images/heroes/discover/main-hall.jpg", caption: { fi: "Keskusaula", en: "The Central Foyer" } },
    ],
    artifact: { name: { fi: "Ensimmäinen sirpale", en: "The First Fragment" }, image: "/themes/artifacts/main-hall.png", description: [{ fi: "Pieni metallinen sirpale, jossa on kartanon sinetti.", en: "A small metal fragment bearing the seal of the Manor." }] },
    unlocks: sharedUnlocks({ fi: "Pääsali-teema", en: "Main Hall Theme" }, { fi: "Täydellinen matka kartanon läpi", en: "A complete journey through the Manor" }, { fi: "Tarinastasi tulee osa kartanoa", en: "Your story becomes part of the Manor" }),
    footerLine: { fi: "Mitkään kaksi matkaa eivät ole samanlaisia. Mutta jokainen matka alkaa täältä.", en: "No two journeys are the same. But every journey starts here." },
  },

  library: {
    id: "library",
    crest: "/images/crests/library-crest.png",
    hero: "/images/themes/library-hero.jpg",
    title: { fi: "Kirjasto", en: "Library" },
    tagline: { fi: "Jokainen kirja on keskustelu halki aikojen.", en: "Every book is a conversation across time." },
    storyTitle: { fi: "Kirjasto", en: "The Library" },
    storyParagraphs: [
      { fi: "Täällä tieto kerätään, eivätkä tarinat koskaan oikeasti pääty.", en: "Here, knowledge is gathered and stories never truly end." },
      { fi: "Kysymykset ovat tervetulleita. Uteliaisuutta juhlitaan. Sinun ei tarvitse tietää kaikkea. Sinun täytyy vain olla valmis oppimaan.", en: "Questions are welcomed. Curiosity is celebrated. You don't have to know everything. You just have to be willing to learn." },
      { fi: "Istu alas. Avaa kirja. Seuraava luku odottaa.", en: "Take a seat. Open a book. The next chapter is waiting." },
    ],
    essenceTagline: { fi: "Tieto muuttuu viisaudeksi, kun se jaetaan.", en: "Knowledge becomes wisdom when shared." },
    essenceText: [{ fi: "Kirjasto ei ole kirjojen keräämistä.", en: "The Library is not about collecting books." }, { fi: "Se on ymmärryksen keräämistä.", en: "It is about collecting understanding." }],
    journey: ["Uteliaisuus|Curiosity|Kysy. Ihmettele. Tutki.|Ask. Wonder. Explore.", "Löytäminen|Discovery|Löydä se, mikä innostaa sinua.|Find what inspires you.", "Lukeminen|Reading|Sukella uusiin maailmoihin.|Dive into new worlds.", "Pohdinta|Reflection|Pysähdy. Ajattele. Imeydy.|Pause. Think. Absorb.", "Oppiminen|Learning|Anna tiedon juurtua.|Let knowledge take root.", "Oivallus|Insight|Näe pinnan taakse.|See beyond the surface.", "Ymmärrys|Understanding|Yhdistä palaset.|Connect the pieces.", "Jakaminen|Sharing|Opeta, mitä olet oppinut.|Teach what you've learned.", "Perintö|Legacy|Jätä jotain jälkeesi.|Leave something behind.", "Viisaus|Wisdom|Kanna sitä eteenpäin.|Carry it forward."].map((s) => { const [fi, en, dfi, den] = s.split("|"); return { title: { fi, en }, description: { fi: dfi, en: den } } }),
    glimpses: [{ image: "/images/heroes/collection/library.jpg", caption: { fi: "Kokoelmat", en: "Collection" } }, { image: "/images/heroes/events/library.jpg", caption: { fi: "Tapahtumat", en: "Events" } }, { image: "/images/heroes/discover/library.jpg", caption: { fi: "Yhteisöt", en: "Community" } }],
    artifact: { name: { fi: "Arkistonhoitajan sulkakynä", en: "Archivist's Quill" }, image: "/themes/artifacts/library.png", description: [{ fi: "Sulkakynä, jolla arkistonhoitajat aikoinaan kirjasivat maailmojen totuudet.", en: "A quill once used by the Archivists to record the truths of worlds." }] },
    unlocks: sharedUnlocks({ fi: "Kirjasto-teema", en: "Library Theme" }, { fi: "Täydellinen matka kirjaston läpi", en: "A complete journey through the Library" }, { fi: "Tarinoita, löytöjä ja ajatonta viisautta", en: "Tales, discoveries & timeless wisdom" }),
    footerLine: { fi: "Suurimmat matkat alkavat usein yhdeltä sivulta.", en: "The greatest journeys often begin on a single page." },
  },

  observatory: {
    id: "observatory",
    crest: "/images/observatory-crest.png",
    hero: "/images/themes/observatory-hero.jpg",
    title: { fi: "Observatorio", en: "Observatory" },
    tagline: { fi: "Horisontti on aina kauempana kuin miltä se näyttää.", en: "The horizon is always farther than it seems." },
    storyTitle: { fi: "Observatorio", en: "The Observatory" },
    storyParagraphs: [
      { fi: "Maailman yläpuolella, melun tuolla puolen, alkaa toisenlainen löytöretki.", en: "Above the world, beyond the noise, a different kind of discovery begins." },
      { fi: "Täällä maailmankaikkeuden avaruus paljastaa hiljaiset totuutensa.", en: "Here, the vastness of the universe reveals its quiet truths." },
      { fi: "Tähdet ovat ikivanhoja, mutta ne puhuvat yhä — jos pysähdyt kuuntelemaan.", en: "The stars are ancient, but they still speak—if you take the time to listen." },
      { fi: "Astuu lähemmäs. Katso kauemmas. Näe maailma uudesta korkeudesta.", en: "Step closer, look farther, and see the world from a new height." },
    ],
    essenceTagline: { fi: "Etäisyys luo perspektiiviä.", en: "Distance creates perspective." },
    essenceText: [{ fi: "Observatorio ei ole tähdistä.", en: "The Observatory is not about the stars." }, { fi: "Se on oppimisesta nähdä itsesi ulkopuolelle.", en: "It is about learning to see beyond yourself." }],
    journey: [
      ["Ihmettely", "Wonder", "Avaa ovi tuntemattomaan.", "Let awe open the door."], ["Havainnointi", "Observation", "Huomaa se, mikä muilta jää.", "Notice what others miss."], ["Uteliaisuus", "Curiosity", "Kysy ilman loppua.", "Ask questions without end."], ["Löytäminen", "Discovery", "Löydä kauneutta tuntemattomasta.", "Find beauty in the unknown."], ["Mittakaava", "Scale", "Näe kuinka valtava kaikki on.", "See how vast it all is."], ["Perspektiivi", "Perspective", "Vaihda näkökulmaasi.", "Shift your point of view."], ["Pohdinta", "Reflection", "Katso sisään ja ulos.", "Look inward, then outward."], ["Ymmärrys", "Understanding", "Palaset alkavat liittyä yhteen.", "Pieces begin to connect."], ["Yhteys", "Connection", "Olet osa jotakin suurempaa.", "You are part of something greater."], ["Tuolle puolen", "Beyond", "Matka jatkuu kauemmas kuin silmä näkee.", "The journey continues farther than the eye can see."],
    ].map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
    glimpses: [{ image: "/images/heroes/collection/observatory.jpg", caption: { fi: "Teleskooppi", en: "The Telescope" } }, { image: "/images/heroes/events/observatory.jpg", caption: { fi: "Tähtikarttapöytä", en: "The Star Chart Table" } }, { image: "/images/heroes/discover/observatory.jpg", caption: { fi: "Taivaallinen pallo", en: "The Celestial Globe" } }],
    artifact: { name: { fi: "Tähtitieteilijän muistiinpanot", en: "Astronomer's Notes" }, image: "/themes/artifacts/observatory.png", description: [{ fi: "Vanha muistikirja, joka yhdistää havainnot, tähdet ja ihmisen oman paikan.", en: "An old notebook connecting observations, stars, and humanity's place among them." }] },
    unlocks: sharedUnlocks({ fi: "Observatorio-teema", en: "Observatory Theme" }, { fi: "Täydellinen matka observatorion läpi", en: "A complete journey through the Observatory" }, { fi: "Havaintoja, tähtikarttoja ja kosmisia oivalluksia", en: "Observations, star charts, and cosmic insights" }),
    footerLine: { fi: "Mitä kauemmas näet, sitä enemmän on vielä löydettävää.", en: "The farther you see, the more there is to discover." },
  },
}

export function getRoomThemePage(roomId: string): RoomThemePage | undefined {
  return ROOM_THEME_PAGES[roomId]
}
