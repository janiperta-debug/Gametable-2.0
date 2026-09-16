import type { ArtifactPage } from "@/lib/artifact-pages"

export const THEATER_ROOM_ARTIFACT_PAGE: ArtifactPage = {
  id: "theater-room",
  subtitle: {
    fi: "Näyttämö tarinoille, tunteille ja empatialle.",
    en: "A stage for stories, emotions, and empathy.",
  },
  heroCaption: {
    fi: "Tarinat muovaavat meitä. Empatia yhdistää meidät. Esitys paljastaa meidät. Teatterissa opimme näkemään maailman lukemattomien silmien kautta.",
    en: "Stories shape us. Empathy connects us. Performance reveals us. In the Theater, we learn to see the world through countless eyes.",
  },
  lore: {
    title: { fi: "Näytelmäkirjailijan päiväkirja", en: "The Playwright's Journal" },
    text: [
      { fi: "Näille sivuille on kirjoitettu kaikenlaisia näytelmiä — komediaa, tragediaa, romantiikkaa ja eepoksia.", en: "Within these pages are plays of every kind—comedy, tragedy, romance, and epic." },
      { fi: "Jokainen käsikirjoitus kirjoitettiin elettäväksi, ei vain luettavaksi.", en: "Each script was written to be lived, not just read." },
      { fi: "Näytteleminen on ymmärtämistä. Ymmärtäminen on yhteyden luomista.", en: "To perform is to understand. To understand is to connect." },
      { fi: "Astu näyttämölle. Esirippu nousee.", en: "Take the stage. The curtain rises." },
    ],
  },
  unlocks: {
    theme: { fi: "Teatteri", en: "Theater" },
    roomAccess: { fi: "Teatteri", en: "Theater" },
    lore: { fi: "Näytelmäkirjailijan päiväkirja", en: "The Playwright's Journal" },
    artefact: { fi: "Tuhansien kasvojen naamio", en: "Mask of a Thousand Faces" },
    achievement: { fi: "Seisovat aplodit", en: "Standing Ovation" },
  },
}
