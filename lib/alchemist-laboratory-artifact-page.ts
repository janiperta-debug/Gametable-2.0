import type { ArtifactPage } from "@/lib/artifact-pages"

export const ALCHEMIST_LABORATORY_ARTIFACT_PAGE: ArtifactPage = {
  id: "alchemist-laboratory",
  subtitle: {
    fi: "Uteliaisuuden, luomisen ja muodonmuutoksen pyhäkkö.",
    en: "A sanctum of curiosity, creation, and transformation.",
  },
  heroCaption: {
    fi: "Täällä alkuaineet tottelevat tarkoitusta. Uteliaisuudesta tulee löytöjä. Virheistä tulee viisautta. Taikajuomia valmistetaan ja teorioita koetellaan. Tiedon tavoittelu on taidetta, ja muodonmuutos sen korkein muoto.",
    en: "Here, elements obey intention. Curiosity becomes discovery. Mistakes become wisdom. Potions are brewed. Theories are tested. The pursuit of knowledge is an art, and transformation is its highest form.",
  },
  lore: {
    title: { fi: "Alkemistin muistikirja", en: "The Alchemist's Notebook" },
    text: [
      { fi: "Näille sivuille on kirjattu kaavoja, havaintoja ja villejä ajatuksia.", en: "Within these pages are formulas, observations, and wild ideas." },
      { fi: "Jotkut etsivät kultaa. Toiset totuutta. Viisaimmat etsivät tasapainoa.", en: "Some seek gold. Others seek truth. But the wisest seek balance." },
      { fi: "Jokaisella alkuaineella on tarkoituksensa. Jokaisella valinnalla seurauksensa.", en: "Every element has its purpose. Every choice has its consequence." },
      { fi: "Suurimmat luomukset syntyvät kärsivällisyydestä, tarkkuudesta ja tarkoituksesta.", en: "The greatest creations are born from patience, precision, and purpose." },
    ],
  },
  unlocks: {
    theme: { fi: "Alkemistin laboratorio", en: "Alchemist's Laboratory" },
    roomAccess: { fi: "Alkemistin laboratorio", en: "Alchemist's Laboratory" },
    lore: { fi: "Alkemistin muistikirja", en: "The Alchemist's Notebook" },
    artefact: { fi: "Muodonmuutoksen retortti", en: "Retort of Transfiguration" },
    achievement: { fi: "Alkuaineiden mestari", en: "Master of Elements" },
  },
}
