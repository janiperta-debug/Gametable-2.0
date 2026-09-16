import type { ArtifactPage } from "@/lib/artifact-pages"

export const UNDERGROUND_TEMPLE_ARTIFACT_PAGE: ArtifactPage = {
  id: "underground-temple",
  subtitle: {
    fi: "Kysymysten, ajattelun ja etsimisen pyhäkkö.",
    en: "A sanctuary of questions, thought, and seeking.",
  },
  heroCaption: {
    fi: "Kaikki kysymykset eivät etsi vastausta. Syvällä kartanon alla on paikka, joka ei kerro mitä ajatella, vaan auttaa ajattelemaan itse. Täällä kysymykset saavat olla rauhassa. Ideoita koetellaan. Varmuutta ei pakoteta. Temppeli ei palkitse oikeaa vastausta — se kunnioittaa parempaa kysymystä. Tule avoimin mielin. Lähde uusin silmin.",
    en: "Not every question seeks an answer. Deep beneath the Manor lies a place set aside not to tell you what to think, but to help you think for yourself. Here, questions are kept safe. Ideas are tested. Certainty is never forced. The Temple does not reward the right answer—it honors the better question. Come with an open mind. Leave with new eyes.",
  },
  lore: {
    title: { fi: "Vartijan muistiinpanot", en: "The Keeper's Notes" },
    text: [
      { fi: "Vartijat eivät tulleet tänne löytääkseen vastauksia.", en: "The Keepers did not come here to find answers." },
      { fi: "He tulivat säilyttääkseen kysymisen taidon.", en: "They came to preserve the art of asking." },
      { fi: "Kysymykset avaavat ovia. Vastaukset sulkevat niitä joskus.", en: "Questions open doors. Answers sometimes close them." },
      { fi: "Kirjoita kysymyksesi. Puhu ne ääneen. Kuuntele, mitä hiljaisuus paljastaa.", en: "Write your questions. Speak them aloud. Listen to what silence reveals." },
      { fi: "Suurimmat löydöt alkavat ihmetyksestä, eivät varmuudesta.", en: "The greatest discoveries begin with wonder, not certainty." },
    ],
  },
  unlocks: {
    theme: { fi: "Maanalainen temppeli", en: "Underground Temple" },
    roomAccess: { fi: "Maanalainen temppeli", en: "Underground Temple" },
    lore: { fi: "Vartijan muistiinpanot", en: "The Keeper's Notes" },
    artefact: { fi: "Etsijän kompassi", en: "Seeker's Compass" },
    achievement: { fi: "Kysyjä", en: "Inquirer" },
  },
}
