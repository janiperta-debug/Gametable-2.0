import type { ArtifactPage } from "@/lib/artifact-pages"

export const CLOCK_TOWER_ARTIFACT_PAGE: ArtifactPage = {
  id: "clock-tower",
  subtitle: {
    fi: "Ajan, täsmällisyyden ja näkökulman valtakunta.",
    en: "A dominion of time, precision, and perspective.",
  },
  heroCaption: {
    fi: "Aika ei suosi ketään. Se kulkee kaikkien kohdalla. Korkealta näemme, mikä kiirehtii alhaalla. Täällä hetkistä tulee kuvioita. Kuvioista tulee tarkoitus. Kellotornissa opimme kärsivällisyyttä, saamme näkökulmaa ja muistamme, että jokainen sekunti on valinta.",
    en: "Time keeps no favorites. It moves for all. From high above, we see what rush below. Here, moments become patterns. Patterns become purpose. In the Clock Tower, we learn patience, gain perspective, and remember that every second is a choice.",
  },
  lore: {
    title: { fi: "Vartijan muistiinpanot", en: "The Watcher's Notes" },
    text: [
      { fi: "Aikaa ei vain mitata. Sitä tarkkaillaan, ymmärretään ja kunnioitetaan.", en: "Time is not simply measured. It is observed, understood, and respected." },
      { fi: "Tämän tornin vartijat kirjaavat muutakin kuin tuntien kulumisen — he kirjaavat syklejä, enteitä ja linjauksia.", en: "The watchers of this tower record more than the passing of hours—they record cycles, omens, alignments." },
      { fi: "Ajan tunteminen on seurausten tuntemista.", en: "Knowledge of time is knowledge of consequence." },
    ],
  },
  unlocks: {
    theme: { fi: "Kellotorni", en: "Clock Tower" },
    roomAccess: { fi: "Kellotorni", en: "Clock Tower" },
    lore: { fi: "Vartijan muistiinpanot", en: "The Watcher's Notes" },
    artefact: { fi: "Selkeyden tiimalasi", en: "Hourglass of Clarity" },
    achievement: { fi: "Ajanvartija", en: "Timekeeper" },
  },
}
