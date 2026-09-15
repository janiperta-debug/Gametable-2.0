/**
 * ARTIFACT PAGES — content data for the per-room artifact detail pages.
 *
 * Same logic as the theme pages (lib/room-theme-pages.ts): the VISUAL template
 * is FIXED (see components/artifact-page-template.tsx), modeled on the Main Hall
 * artifact mockup. The two crossed-out mockup sections ("In Your Collection" and
 * "The Vault Key Restored") are intentionally NOT built.
 *
 * "Copying & filling a theme" = adding one entry to ARTIFACT_PAGES below.
 *
 * Shared assets are REUSED from the room's theme page (crest, hero, title, and
 * the artefact name/image/description) — see getRoomThemePage(). Only the
 * artifact-page-unique copy lives here. All copy is bilingual ({ fi, en }).
 * Shared chrome ("Back to Artifacts", section headers, unlock row labels, the
 * collection note) lives in the i18n JSON under `themes.artifactPage`.
 */

import type { Localized } from "@/lib/room-theme-pages"

export interface ArtifactPage {
  id: string
  subtitle: Localized
  heroCaption: Localized
  lore: { title: Localized; text: Localized[] }
  unlocks: {
    theme: Localized
    roomAccess: Localized
    lore: Localized
    artefact: Localized
    achievement: Localized
  }
}

export const ARTIFACT_PAGES: Record<string, ArtifactPage> = {
  "main-hall": {
    id: "main-hall",
    subtitle: { fi: "Kartanon sydän. Matkasi alkaa täältä.", en: "The heart of the Manor. Your journey begins here." },
    heroCaption: { fi: "Jokainen vieras astuu kartanoon näiden ovien kautta. Tervetulon, tarinoiden ja loputtomien mahdollisuuksien paikka.", en: "Every guest enters the Manor through these doors. A place of welcome, stories, and endless possibilities." },
    lore: {
      title: { fi: "Kutsu", en: "The Invitation" },
      text: [
        { fi: "Jokainen matka kartanon läpi alkaa samalla tavalla.", en: "Every journey through the Manor begins the same way." },
        { fi: "Tervetulo.", en: "A welcome." },
        { fi: "Sirpale.", en: "A fragment." },
        { fi: "Ja kysymys, jota kukaan ei vielä osaa esittää.", en: "And a question no one yet knows to ask." },
      ],
    },
    unlocks: {
      theme: { fi: "Pääsali", en: "Main Hall" },
      roomAccess: { fi: "Pääsali", en: "Main Hall" },
      lore: { fi: "Kutsu", en: "The Invitation" },
      artefact: { fi: "Ensimmäinen sirpale", en: "The First Fragment" },
      achievement: { fi: "Ei sovellettavissa", en: "Not applicable" },
    },
  },
  library: {
    id: "library",
    subtitle: { fi: "Tiedon vartija. Etsi, opi, muista.", en: "The keeper of knowledge. Seek, learn, remember." },
    heroCaption: { fi: "Näiden seinien sisällä säilytetään lukemattomia tarinoita. Tieto on avain, joka avaa jokaisen muun oven. Mitä sinä löydät?", en: "Within these walls, countless stories are preserved. Knowledge is the key that unlocks every other door. What will you discover?" },
    lore: {
      title: { fi: "Arkistonhoitajan muistiinpanot", en: "The Archivist's Notes" },
      text: [
        { fi: "Kartanon arkistonhoitajat ovat omistaneet elämänsä tiedon keräämiselle jokaisesta valtakunnasta.", en: "The Archivists of the Manor have dedicated their lives to gathering knowledge from every realm." },
        { fi: "Jotkin totuudet on kirjoitettu kirjoihin. Toiset on kirjoitettu ihmisiin.", en: "Some truths are written in books. Others are written in people." },
        { fi: "Lue. Pohdi. Muista.", en: "Read. Reflect. Remember." },
      ],
    },
    unlocks: {
      theme: { fi: "Kirjasto", en: "Library" },
      roomAccess: { fi: "Kirjasto", en: "Library" },
      lore: { fi: "Arkistonhoitajan muistiinpanot", en: "The Archivist's Notes" },
      artefact: { fi: "Arkistonhoitajan sulkakynä", en: "Archivist's Quill" },
      achievement: { fi: "Tiedon etsijä", en: "Seeker of Knowledge" },
    },
  },
  conservatory: {
    id: "conservatory",
    subtitle: { fi: "Elämän, kasvun ja yhteyden pyhäkkö.", en: "A sanctuary of life, growth, and connection." },
    heroCaption: { fi: "Täällä monien maailmojen luontoa vaalitaan ja jaetaan. Jokainen siemen, jokainen kukka, jokainen kosketus muistuttaa meitä siitä, että kasvamme vahvemmiksi yhdessä.", en: "Here, nature from many worlds is nurtured and shared. Every seed, every bloom, every touch is a reminder that we grow stronger together." },
    lore: {
      title: { fi: "Puutarhurin muistiinpanot", en: "The Gardener's Notes" },
      text: [
        { fi: "Puutarhuri huolehtii muustakin kuin kasveista.", en: "The Gardener tends to more than plants." },
        { fi: "Hän viljelee ymmärrystä, kärsivällisyyttä ja huolenpitoa.", en: "They cultivate understanding, patience, and care." },
        { fi: "Vaali sitä, mitä rakastat, ja katso sen kukoistavan.", en: "Nurture what you love, and watch it flourish." },
      ],
    },
    unlocks: {
      theme: { fi: "Talvipuutarha", en: "Conservatory" },
      roomAccess: { fi: "Talvipuutarha", en: "Conservatory" },
      lore: { fi: "Puutarhurin muistiinpanot", en: "The Gardener's Notes" },
      artefact: { fi: "Harmonian siemen", en: "Seed of Harmony" },
      achievement: { fi: "Viljelijä", en: "Cultivator" },
    },
  },
  "fireside-lounge": {
    id: "fireside-lounge",
    subtitle: { fi: "Lämmön, tarinoiden ja ystävyyden paikka.", en: "A place of warmth, stories, and friendship." },
    heroCaption: { fi: "Vedä tuoli lähemmäs, jaa tarina ja kuuntele. Tulen lämmössä tuntemattomista tulee ystäviä ja seikkailut saavat muistonsa.", en: "Pull up a chair, share a story, and listen. In the warmth of the fire, strangers become friends and adventures are remembered." },
    lore: {
      title: { fi: "Oleskelusalin kronikat", en: "The Lounge Chronicles" },
      text: [
        { fi: "Monet tarinat alkavat oleskelusalista.", en: "Many tales begin in the Lounge." },
        { fi: "Voittoja juhlitaan. Tappioista selvitään. Suunnitelmia tehdään. Unelmia jaetaan.", en: "Victories celebrated. Defeats survived. Plans made. Dreams shared." },
        { fi: "Tuli muistaa jokaisen äänen.", en: "The fire remembers every voice." },
      ],
    },
    unlocks: {
      theme: { fi: "Takkahuone", en: "Fireside Lounge" },
      roomAccess: { fi: "Takkahuone", en: "Fireside Lounge" },
      lore: { fi: "Oleskelusalin kronikat", en: "The Lounge Chronicles" },
      artefact: { fi: "Toveruuden hiillos", en: "Ember of Camaraderie" },
      achievement: { fi: "Ystävyyden kipinä", en: "Kindled Bonds" },
    },
  },
  bar: {
    id: "bar",
    subtitle: { fi: "Naurun, maljojen ja legendojen paikka.", en: "A place of laughter, toasts, and legends." },
    heroCaption: { fi: "Nosta malja. Jaa tarina. Juhli voittoja, naura epäonnistumisille ja nauti seurasta. Baarissa jokainen seikkailija kuuluu joukkoon.", en: "Raise a glass. Share a tale. Celebrate the wins, laugh at the fails, and enjoy the company. In the Bar, every adventurer belongs." },
    lore: {
      title: { fi: "Baarimestarin merkinnät", en: "The Bartender's Records" },
      text: [
        { fi: "Baarimestari on nähnyt kaiken.", en: "The bartender has seen it all." },
        { fi: "Sankareita ja ensikertalaisia. Voittoja ja katastrofeja. Uusia ystävyyksiä ja vanhoja kiistoja.", en: "Heroes and rookies. Victories and disasters. New friendships and old rivalries." },
        { fi: "Kaikki on kirjoitettu tänne, hyvässä hengessä.", en: "All are written here, in good spirit." },
        { fi: "Nosta malja ja tule osaksi tarinaa.", en: "Raise a glass and become part of the story." },
      ],
    },
    unlocks: {
      theme: { fi: "Baari", en: "The Bar" },
      roomAccess: { fi: "Baari", en: "The Bar" },
      lore: { fi: "Baarimestarin merkinnät", en: "The Bartender's Records" },
      artefact: { fi: "Baarimestarin lokikirja", en: "Bartender's Ledger" },
      achievement: { fi: "Maljat ja tarinat", en: "Tales & Toasts" },
    },
  },
}

export function getArtifactPage(roomId: string): ArtifactPage | undefined {
  return ARTIFACT_PAGES[roomId]
}
