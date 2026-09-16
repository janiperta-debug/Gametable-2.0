import type { ArtifactPage } from "@/lib/artifact-pages"

export const CRYSTAL_CAVERN_ARTIFACT_PAGE: ArtifactPage = {
  id: "crystal-cavern",
  subtitle: {
    fi: "Ihmeiden, valon ja piilotetun potentiaalin pyhäkkö.",
    en: "A sanctuary of wonder, light, and hidden potential.",
  },
  heroCaption: {
    fi: "Syvällä kartanon alapuolella, missä kivi antaa periksi hiljaisuudelle ja aika hidastuu kuiskaukseksi, kristallit kasvavat. Paineen muovaamina ja pimeydestä syntyneinä ne laulavat valolla. Jokainen särmä kantaa muistoa. Jokainen sävy mahdollisuutta. Niiden läsnäolossa viritymme siihen, mikä on totta, ja avaamme sen, mikä vasta odottaa syntymistään.",
    en: "Deep below the Manor, where stone gives way to silence and time slows to a whisper, the crystals grow. Formed by pressure, born from darkness, they sing with light. Each facet holds a memory. Each hue, a possibility. In their presence, clarity comes. Here, we attune to what is true, and unlock what is yet to be.",
  },
  lore: {
    title: { fi: "Geologin muistiinpanot", en: "The Geologist's Notes" },
    text: [
      { fi: "Tämän luolan kristallit ovat vanhempia kuin kartanon seinät.", en: "The crystals of this cavern are older than the walls of the Manor." },
      { fi: "Jokainen muodostuma värähtelee omalla ainutlaatuisella taajuudellaan ja reagoi ajatuksiin ja tunteisiin.", en: "Each cluster resonates at a unique frequency, interacting with thought and emotion." },
      { fi: "Avoimin mielin saapuva saattaa nähdä kristallien heijastavan muutakin kuin valoa — ne heijastavat totuutta.", en: "Those who enter with an open mind may find the crystals reflect more than light—they reflect truth." },
      { fi: "Kohtele niitä kunnioittaen. Lähde kiitollisena.", en: "Handle with reverence. Leave with gratitude." },
    ],
  },
  unlocks: {
    theme: { fi: "Kristalliluola", en: "Crystal Cavern" },
    roomAccess: { fi: "Kristalliluola", en: "Crystal Cavern" },
    lore: { fi: "Geologin muistiinpanot", en: "The Geologist's Notes" },
    artefact: { fi: "Oivalluksen prisma", en: "Prism of Insight" },
    achievement: { fi: "Selkeyden etsijä", en: "Seeker of Clarity" },
  },
}
