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
  /** Room id, matches roomThemes / artifact slot / theme page id. */
  id: string
  /** Subtitle under the title, e.g. "The heart of the Manor. Your journey begins here." */
  subtitle: Localized
  /** Caption overlaid on the hero image. */
  heroCaption: Localized
  /** Lore entry block. */
  lore: {
    title: Localized
    text: Localized[]
  }
  /** Unlocks rows — labels come from i18n, these are the values. */
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
    subtitle: {
      fi: "Kartanon sydän. Matkasi alkaa täältä.",
      en: "The heart of the Manor. Your journey begins here.",
    },
    heroCaption: {
      fi: "Jokainen vieras astuu kartanoon näiden ovien kautta. Tervetulon, tarinoiden ja loputtomien mahdollisuuksien paikka.",
      en: "Every guest enters the Manor through these doors. A place of welcome, stories, and endless possibilities.",
    },
    lore: {
      title: { fi: "Kutsu", en: "The Invitation" },
      text: [
        {
          fi: "Jokainen matka kartanon läpi alkaa samalla tavalla.",
          en: "Every journey through the Manor begins the same way.",
        },
        { fi: "Tervetulo.", en: "A welcome." },
        { fi: "Sirpale.", en: "A fragment." },
        {
          fi: "Ja kysymys, jota kukaan ei vielä osaa esittää.",
          en: "And a question no one yet knows to ask.",
        },
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
    subtitle: {
      fi: "Tiedon vartija. Etsi, opi, muista.",
      en: "The keeper of knowledge. Seek, learn, remember.",
    },
    heroCaption: {
      fi: "Näiden seinien sisällä säilytetään lukemattomia tarinoita. Tieto on avain, joka avaa jokaisen muun oven. Mitä sinä löydät?",
      en: "Within these walls, countless stories are preserved. Knowledge is the key that unlocks every other door. What will you discover?",
    },
    lore: {
      title: {
        fi: "Arkistonhoitajan muistiinpanot",
        en: "The Archivist's Notes",
      },
      text: [
        {
          fi: "Kartanon arkistonhoitajat ovat omistaneet elämänsä tiedon keräämiselle jokaisesta valtakunnasta.",
          en: "The Archivists of the Manor have dedicated their lives to gathering knowledge from every realm.",
        },
        {
          fi: "Jotkin totuudet on kirjoitettu kirjoihin. Toiset on kirjoitettu ihmisiin.",
          en: "Some truths are written in books. Others are written in people.",
        },
        {
          fi: "Lue. Pohdi. Muista.",
          en: "Read. Reflect. Remember.",
        },
      ],
    },
    unlocks: {
      theme: { fi: "Kirjasto", en: "Library" },
      roomAccess: { fi: "Kirjasto", en: "Library" },
      lore: {
        fi: "Arkistonhoitajan muistiinpanot",
        en: "The Archivist's Notes",
      },
      artefact: {
        fi: "Arkistonhoitajan sulkakynä",
        en: "Archivist's Quill",
      },
      achievement: {
        fi: "Tiedon etsijä",
        en: "Seeker of Knowledge",
      },
    },
  },
}

export function getArtifactPage(roomId: string): ArtifactPage | undefined {
  return ARTIFACT_PAGES[roomId]
}
