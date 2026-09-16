import type { ArtifactPage } from "@/lib/artifact-pages"

export const DUNGEON_ARTIFACT_PAGE: ArtifactPage = {
  id: "dungeon",
  subtitle: {
    fi: "Rohkeuden, valintojen ja seurausten koetinkivi.",
    en: "A trial of courage, choice, and consequence.",
  },
  heroCaption: {
    fi: "Kartanon eleganssin alla piilee sen vanhin totuus: pimeys ei ole vihollinen — se on koe. Monet suljettiin tänne. Jotkut ansaitsivat sen. Jotkut eivät. Dungeonissa kohtaamme pelkomme, valintamme ja niiden painon. Vasta sitten voimme nousta.",
    en: "Beneath the Manor's elegance lies its oldest truth: darkness is not the enemy—it is the test. Many were locked away. Some deserved it. Some did not. In the Dungeon, we face our fears, our choices, and the weight of both. Only then can we rise.",
  },
  lore: {
    title: { fi: "Vanginvartijan lokikirja", en: "The Warden's Log" },
    text: [
      { fi: "Nimet haalistuvat. Tarinat jäävät.", en: "Names fade. Stories remain." },
      { fi: "Näitä lokikirjoja pitivät ne, jotka vartioivat, tuomitsivat ja joskus katuivat.", en: "These logs were kept by those who watched, judged, and sometimes regretted." },
      { fi: "Ne eivät puolustele menneisyyttä, mutta varmistavat, ettemme unohda sitä.", en: "They do not excuse the past, but they ensure we do not forget it." },
      { fi: "Lue rohkeasti. Anna ymmärryksen olla avain, joka avaa muutakin kuin ovia.", en: "Read them with courage. Let understanding be the key that opens more than doors." },
    ],
  },
  unlocks: {
    theme: { fi: "Dungeon", en: "Dungeon" },
    roomAccess: { fi: "Dungeon", en: "Dungeon" },
    lore: { fi: "Vanginvartijan lokikirja", en: "The Warden's Log" },
    artefact: { fi: "Pohdinnan kahle", en: "Manacle of Reflection" },
    achievement: { fi: "Selviytyjä", en: "Survivor" },
  },
}
