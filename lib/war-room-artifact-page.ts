import type { ArtifactPage } from "@/lib/artifact-pages"

export const WAR_ROOM_ARTIFACT_PAGE: ArtifactPage = {
  id: "war-room",
  subtitle: {
    fi: "Strategian, yhtenäisyyden ja päättäväisyyden kammio.",
    en: "A chamber of strategy, unity, and resolve.",
  },
  heroCaption: {
    fi: "Voitot voitetaan ennen kuin taistelut alkavat. Suunnitelmat laaditaan. Liittoumat solmitaan. Jokaisella palalla on tarkoitus. Kuri ohjaa meitä. Uskollisuus sitoo meitä. Warroomissa valmistaudumme emme kunniaa, vaan niitä varten, joiden puolesta lupaamme suojella.",
    en: "Victories are won before they are fought. Plans are drawn. Alliances are forged. Every piece has a purpose. Discipline guides us. Loyalty binds us. In the Warroom, we prepare not for glory, but for those we pledge to protect.",
  },
  lore: {
    title: { fi: "Komentajan merkinnät", en: "The Commander's Record" },
    text: [
      { fi: "Näille sivuille on kirjattu strategioita, jotka muovasivat menneisyyttämme ja saattavat muovata tulevaisuuttamme.", en: "Within these pages are strategies that shaped our past and may shape our future." },
      { fi: "Ne eivät ole muuttumattomia, sillä sota muuttuu jatkuvasti.", en: "They are not fixed, for war is ever-changing." },
      { fi: "Mutta periaatteet säilyvät: tunne vihollisesi, tunne itsesi äläkä koskaan unohda niitä, jotka seisovat rinnallasi.", en: "But the principles remain: know your enemy, know yourself, and never forget who stands beside you." },
      { fi: "Lyhin tie on yhtenäisyys.", en: "The sharpest edge is unity." },
    ],
  },
  unlocks: {
    theme: { fi: "Sotahuone", en: "Warroom" },
    roomAccess: { fi: "Sotahuone", en: "Warroom" },
    lore: { fi: "Komentajan merkinnät", en: "The Commander's Record" },
    artefact: { fi: "Leijonavaakunan medaljonki", en: "Lion Standard Medallion" },
    achievement: { fi: "Strategi", en: "Strategist" },
  },
}
