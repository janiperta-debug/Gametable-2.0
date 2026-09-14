import type { RoomThemePage } from "@/lib/room-theme-pages"

const steps = [
  ["Löytö", "Discovery", "Jotain löytyy.", "Something is found."],
  ["Kronikka", "Chronicle", "Se dokumentoidaan.", "It is documented."],
  ["Tutkimus", "Investigation", "Sen merkitystä kysytään.", "Its meaning is questioned."],
  ["Vaihto", "Exchange", "Se jaetaan Seuran kanssa.", "It is shared with the Society."],
  ["Paljastuminen", "Unveiling", "Syvempi totuus nousee esiin.", "A deeper truth emerges."],
  ["Pakkomielle", "Obsession", "Etsintä muuttuu henkilökohtaiseksi.", "The search becomes personal."],
  ["Yhteys", "Correspondence", "Yhteyksiä syntyy.", "Connections are made."],
  ["Uusi johtolanka", "New Lead", "Uusi arvoitus ilmestyy.", "A new mystery appears."],
  ["Vahvistus", "Confirmation", "Seura vahvistaa löydön.", "The Society validates."],
  ["Seuraava arvoitus", "Next Mystery", "Matka jatkuu.", "The journey continues."],
]

export const TREASURE_VAULT_ROOM_THEME_PAGE: RoomThemePage = {
  id: "treasure-vault",
  crest: "/images/crests/treasure-vault-crest.png",
  hero: "/images/themes/treasure-vault-hero.jpg",
  title: { fi: "Aarreholvi", en: "Treasure Vault" },
  tagline: { fi: "Kaikki aarteet eivät ole kultaa.", en: "All treasures are not made of gold." },
  storyTitle: { fi: "Aarreholvi", en: "The Treasure Vault" },
  storyParagraphs: [
    { fi: "Syvällä kartanossa sijaitsee seura, joka ei kerää rikkauksia vaan ymmärrystä.", en: "Deep within the manor lies a society that does not collect riches, but understanding." },
    { fi: "Tänne tuodaan löytöjä, joiden merkitys ei ole vielä paljastunut. Jokainen reliikki on uusi kysymys.", en: "Here, discoveries are brought that hold meanings not yet revealed. Every relic is a new question." },
    { fi: "Jokainen vastaus paljastaa uuden arvoituksen.", en: "Every answer uncovers another mystery." },
  ],
  essenceTagline: { fi: "Löydöt ovat tarinoita.", en: "Discoveries are stories." },
  essenceText: [
    { fi: "Aarreholvi ei opeta omistamaan.", en: "The Treasure Vault does not teach you to own." },
    { fi: "Se opettaa ymmärtämään.", en: "It teaches you to understand." },
  ],
  journey: steps.map(([fi, en, dfi, den]) => ({ title: { fi, en }, description: { fi: dfi, en: den } })),
  glimpses: [
    { image: "/images/heroes/collection/treasure-vault.jpg", caption: { fi: "Holvi", en: "The Vault" } },
    { image: "/images/heroes/events/treasure-vault.jpg", caption: { fi: "Kronikka", en: "The Chronicle" } },
    { image: "/images/heroes/discover/treasure-vault.jpg", caption: { fi: "Löydön ilmoitus", en: "Submit a Discovery" } },
  ],
  artifact: {
    name: { fi: "Kuraattorin merkintä", en: "Curator’s Note" },
    image: "/themes/artifacts/treasure-vault.png",
    description: [{ fi: "Suurin aarre ei ole se, minkä omistat. Se on se, minkä lopulta ymmärrät.", en: "The greatest treasure is not what you possess. It is what you finally understand." }],
  },
  unlocks: [
    { label: { fi: "Aarreholvin teema", en: "Treasure Vault Theme" }, description: { fi: "Täysi visuaalinen teema GameTablelle", en: "Full visual theme for the GameTable" } },
    { label: { fi: "10 ainutlaatuista huonenäkymää", en: "10 Unique Room Screens" }, description: { fi: "Täydellinen matka holvin läpi", en: "A complete journey through the Vault" } },
    { label: { fi: "Tarinakronikka", en: "Story Chronicle" }, description: { fi: "Tarinoita, muistiinpanoja ja salattuja merkintöjä", en: "Lore, notes and hidden records" } },
    { label: { fi: "Saavutuspolku", en: "Achievement Path" }, description: { fi: "Haastavia virstanpylväitä ja palkintoja", en: "Challenging milestones & rewards" } },
    { label: { fi: "Tarustomerkintä", en: "Lore Entry" }, description: { fi: "Lisätty kartanon kirjastoon", en: "Added to your Manor Library" } },
  ],
  footerLine: { fi: "Matkasi muovaa kartanoa. Jokainen tutkimasi huone paljastaa osan sinusta.", en: "Your journey shapes the Manor. Every room you explore reveals a part of yourself." },
}
