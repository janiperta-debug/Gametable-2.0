/**
 * ROOM THEME PAGES — content data for the per-room theme pages.
 *
 * The VISUAL template is FIXED (see components/room-theme-template.tsx) and is
 * modeled on the Bar mockup — the only mockup that includes an Artefact section.
 * Every room reuses that exact structure; rooms that have no unique artifact
 * copy simply reuse the mention from their artifact page.
 *
 * "Copying & filling a theme" = adding one entry to ROOM_THEME_PAGES below.
 * The base/template never changes.
 *
 * All copy is bilingual ({ fi, en }). Shared template chrome ("Back to Map",
 * "The Essence", etc.) lives in the i18n JSON under `themes.roomPage`.
 *
 * Asset rules (no new art needed):
 *  - crest  = the room's nav home-button crest
 *  - hero   = the room's start-page hero
 *  - glimpses = the room's collection / events / discover heroes
 *  - artifact = /themes/artifacts/{id}.png
 */

/** A string available in both supported locales. */
export interface Localized {
  fi: string
  en: string
}

export interface JourneyStep {
  /** Short step label, e.g. "Arrival". */
  title: Localized
  /** One-line description of the step. */
  description: Localized
}

export interface GlimpseImage {
  /** Image path (reuses an existing hero asset). */
  image: string
  /** Bold caption under the image. */
  caption: Localized
}

export interface UnlockItem {
  /** What is unlocked, e.g. "Bar Theme". */
  label: Localized
  /** Short explanation. */
  description: Localized
}

export interface RoomThemePage {
  /** Room id, matches roomThemes / artifact slot id. */
  id: string
  /** Nav home-button crest for the room. */
  crest: string
  /** Start-page hero image. */
  hero: string
  /** Display title, e.g. "Main Hall". */
  title: Localized
  /** Italic tagline beneath the title. */
  tagline: Localized

  /** Left column heading, e.g. "The Main Hall". */
  storyTitle: Localized
  /** Story paragraphs (each rendered as its own block). */
  storyParagraphs: Localized[]
  /** "The Essence" one-line italic theme. */
  essenceTagline: Localized
  /** "The Essence" body lines. */
  essenceText: Localized[]

  /** "Your Journey in This Room" — exactly 10 steps. */
  journey: JourneyStep[]

  /** "A Glimpse Inside" — exactly 3 images. */
  glimpses: GlimpseImage[]

  /** Artefact section (mention pulled from the room's artifact page). */
  artifact: {
    name: Localized
    image: string
    description: Localized[]
  }

  /** "What Unlocks" list. */
  unlocks: UnlockItem[]

  /** Themed closing line shown in the footer band. */
  footerLine: Localized
}

export const ROOM_THEME_PAGES: Record<string, RoomThemePage> = {
  "main-hall": {
    id: "main-hall",
    crest: "/images/mainhall-crest-original.png",
    hero: "/images/themes/main-hall-hero.jpg",
    title: { fi: "Pääsali", en: "Main Hall" },
    tagline: {
      fi: "Jokainen matka alkaa siitä, mistä astut sisään.",
      en: "Every journey begins where you first step in.",
    },

    storyTitle: { fi: "Pääsali", en: "The Main Hall" },
    storyParagraphs: [
      {
        fi: "Jokainen ovi jonka avaat. Jokainen huone johon astut. Jokainen valinta jonka teet. Kaikki alkaa täältä.",
        en: "Every door you open. Every room you enter. Every choice you make. It all begins here.",
      },
      {
        fi: "Tämä on kartanon sydän. Täältä polkusi avautuu lukemattomiin suuntiin.",
        en: "This is the heart of the Manor. From here, your path unfolds in countless ways.",
      },
      {
        fi: "Pysähdy hetkeksi. Katso ympärillesi. Tarinasi on valmis alkamaan.",
        en: "Take a moment. Look around. Your story is ready to begin.",
      },
    ],
    essenceTagline: { fi: "Valinta luo matkasi.", en: "Choice creates your journey." },
    essenceText: [
      { fi: "Pääsali ei ole vain paikka.", en: "The Main Hall is not just a place." },
      { fi: "Se on alku.", en: "It is a beginning." },
      { fi: "Se on kutsusi.", en: "It is your invitation." },
    ],

    journey: [
      {
        title: { fi: "Saapuminen", en: "Arrival" },
        description: { fi: "Astut sisään johonkin suurempaan.", en: "You step into something greater." },
      },
      {
        title: { fi: "Suunnistautuminen", en: "Orientation" },
        description: { fi: "Otat kaiken sisään.", en: "You take it all in." },
      },
      {
        title: { fi: "Mahdollisuus", en: "Possibility" },
        description: { fi: "Polut paljastuvat.", en: "Paths reveal themselves." },
      },
      {
        title: { fi: "Aikomus", en: "Intention" },
        description: { fi: "Asetat suuntasi.", en: "You set your direction." },
      },
      {
        title: { fi: "Ensiaskeleet", en: "First Steps" },
        description: { fi: "Aloitat matkasi.", en: "You begin your journey." },
      },
      {
        title: { fi: "Tutkiminen", en: "Exploration" },
        description: { fi: "Löydät uusia ovia.", en: "You discover new doors." },
      },
      {
        title: { fi: "Kasvu", en: "Growth" },
        description: { fi: "Muutut matkan varrella.", en: "You change along the way." },
      },
      {
        title: { fi: "Tarkoitus", en: "Purpose" },
        description: { fi: "Ymmärrät miksi tulit.", en: "You understand why you came." },
      },
      {
        title: { fi: "Vaikutus", en: "Impact" },
        description: { fi: "Matkasi muovaa sinua.", en: "Your journey shapes you." },
      },
      {
        title: { fi: "Perintö", en: "Legacy" },
        description: {
          fi: "Tarinastasi tulee osa kartanoa.",
          en: "Your story becomes part of the Manor.",
        },
      },
    ],

    glimpses: [
      {
        image: "/images/heroes/collection/main-hall.jpg",
        caption: { fi: "Suuri portaikko", en: "The Grand Staircase" },
      },
      {
        image: "/images/heroes/events/main-hall.jpg",
        caption: { fi: "Tervetulogalleria", en: "The Welcome Gallery" },
      },
      {
        image: "/images/heroes/discover/main-hall.jpg",
        caption: { fi: "Keskusaula", en: "The Central Foyer" },
      },
    ],

    artifact: {
      name: { fi: "Ensimmäinen sirpale", en: "The First Fragment" },
      image: "/themes/artifacts/main-hall.png",
      description: [
        {
          fi: "Pieni metallinen sirpale, jossa on kartanon sinetti.",
          en: "A small metal fragment bearing the seal of the Manor.",
        },
        { fi: "Sen tarkoitus on tuntematon.", en: "Its purpose is unknown." },
        {
          fi: "Jokainen vieras saa sellaisen astuessaan sisään.",
          en: "Every guest receives one upon entering.",
        },
      ],
    },

    unlocks: [
      {
        label: { fi: "Pääsali-teema", en: "Main Hall Theme" },
        description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" },
      },
      {
        label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" },
        description: { fi: "Täydellinen matka kartanon läpi", en: "A complete journey through the Manor" },
      },
      {
        label: { fi: "Tarinakronikka", en: "Story Chronicle" },
        description: { fi: "Tarinastasi tulee osa kartanoa", en: "Your story becomes part of the Manor" },
      },
      {
        label: { fi: "Saavutuspolku", en: "Achievement Path" },
        description: { fi: "Virstanpylväät, haasteet ja palkinnot", en: "Milestones, challenges & rewards" },
      },
      {
        label: { fi: "Tarustomerkintä", en: "Lore Entry" },
        description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" },
      },
    ],

    footerLine: {
      fi: "Mitkään kaksi matkaa eivät ole samanlaisia. Mutta jokainen matka alkaa täältä.",
      en: "No two journeys are the same. But every journey starts here.",
    },
  },

  library: {
    id: "library",
    crest: "/images/crests/library-crest.png",
    hero: "/images/themes/library-hero.jpg",
    title: { fi: "Kirjasto", en: "Library" },
    tagline: {
      fi: "Jokainen kirja on keskustelu halki aikojen.",
      en: "Every book is a conversation across time.",
    },

    storyTitle: { fi: "Kirjasto", en: "The Library" },
    storyParagraphs: [
      {
        fi: "Täällä tieto kerätään, eivätkä tarinat koskaan oikeasti pääty.",
        en: "Here, knowledge is gathered and stories never truly end.",
      },
      {
        fi: "Kysymykset ovat tervetulleita. Uteliaisuutta juhlitaan. Sinun ei tarvitse tietää kaikkea. Sinun täytyy vain olla valmis oppimaan.",
        en: "Questions are welcomed. Curiosity is celebrated. You don't have to know everything. You just have to be willing to learn.",
      },
      {
        fi: "Istu alas. Avaa kirja. Seuraava luku odottaa.",
        en: "Take a seat. Open a book. The next chapter is waiting.",
      },
    ],
    essenceTagline: {
      fi: "Tieto muuttuu viisaudeksi, kun se jaetaan.",
      en: "Knowledge becomes wisdom when shared.",
    },
    essenceText: [
      { fi: "Kirjasto ei ole kirjojen keräämistä.", en: "The Library is not about collecting books." },
      { fi: "Se on ymmärryksen keräämistä.", en: "It is about collecting understanding." },
    ],

    journey: [
      {
        title: { fi: "Uteliaisuus", en: "Curiosity" },
        description: { fi: "Kysy. Ihmettele. Tutki.", en: "Ask. Wonder. Explore." },
      },
      {
        title: { fi: "Löytäminen", en: "Discovery" },
        description: { fi: "Löydä se, mikä innostaa sinua.", en: "Find what inspires you." },
      },
      {
        title: { fi: "Lukeminen", en: "Reading" },
        description: { fi: "Sukella uusiin maailmoihin.", en: "Dive into new worlds." },
      },
      {
        title: { fi: "Pohdinta", en: "Reflection" },
        description: { fi: "Pysähdy. Ajattele. Imeydy.", en: "Pause. Think. Absorb." },
      },
      {
        title: { fi: "Oppiminen", en: "Learning" },
        description: { fi: "Anna tiedon juurtua.", en: "Let knowledge take root." },
      },
      {
        title: { fi: "Oivallus", en: "Insight" },
        description: { fi: "Näe pinnan taakse.", en: "See beyond the surface." },
      },
      {
        title: { fi: "Ymmärrys", en: "Understanding" },
        description: { fi: "Yhdistä palaset.", en: "Connect the pieces." },
      },
      {
        title: { fi: "Jakaminen", en: "Sharing" },
        description: { fi: "Opeta, mitä olet oppinut.", en: "Teach what you've learned." },
      },
      {
        title: { fi: "Perintö", en: "Legacy" },
        description: { fi: "Jätä jotain jälkeesi.", en: "Leave something behind." },
      },
      {
        title: { fi: "Viisaus", en: "Wisdom" },
        description: { fi: "Kanna sitä eteenpäin.", en: "Carry it forward." },
      },
    ],

    glimpses: [
      {
        image: "/images/heroes/collection/library.jpg",
        caption: { fi: "Kokoelmat", en: "Collection" },
      },
      {
        image: "/images/heroes/events/library.jpg",
        caption: { fi: "Tapahtumat", en: "Events" },
      },
      {
        image: "/images/heroes/discover/library.jpg",
        caption: { fi: "Yhteisöt", en: "Community" },
      },
    ],

    artifact: {
      name: { fi: "Ensimmäinen sivu", en: "The First Page" },
      image: "/themes/artifacts/library.png",
      description: [
        {
          fi: "Yksittäinen kullattu sivu, jolta tarinasi alkaa.",
          en: "A single gilded page where your story begins.",
        },
      ],
    },

    unlocks: [
      {
        label: { fi: "Kirjasto-teema", en: "Library Theme" },
        description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" },
      },
      {
        label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" },
        description: { fi: "Täydellinen matka kirjaston läpi", en: "A complete journey through the Library" },
      },
      {
        label: { fi: "Tarinakronikka", en: "Story Chronicle" },
        description: { fi: "Tarinoita, löytöjä ja ajatonta viisautta", en: "Tales, discoveries & timeless wisdom" },
      },
      {
        label: { fi: "Saavutuspolku", en: "Achievement Path" },
        description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" },
      },
      {
        label: { fi: "Tarustomerkintä", en: "Lore Entry" },
        description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" },
      },
    ],

    footerLine: {
      fi: "Suurimmat matkat alkavat usein yhdeltä sivulta.",
      en: "The greatest journeys often begin on a single page.",
    },
  },
}

export function getRoomThemePage(roomId: string): RoomThemePage | undefined {
  return ROOM_THEME_PAGES[roomId]
}
