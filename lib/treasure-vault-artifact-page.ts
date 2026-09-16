import type { ArtifactPage } from "@/lib/artifact-pages"

/**
 * Treasure Vault is the only artifact page whose artifact is assembled from
 * the other 18 artifacts. The visual state is handled by ArtifactPageTemplate.
 */
export const TREASURE_VAULT_ARTIFACT_PAGE: ArtifactPage = {
  id: "treasure-vault",
  subtitle: {
    fi: "Viimeinen huone. Viimeinen oppitunti.",
    en: "The final room. The final lesson.",
  },
  heroCaption: {
    fi: "Tämä paikka säilyttää sen, mitä ei voi ottaa mukaan — vain ymmärtää. Lopullinen aarre ei löydy täältä. Se syntyy muualla.",
    en: "This place holds what cannot be taken—only understood. The final treasure cannot be found here. It is forged elsewhere.",
  },
  lore: {
    title: { fi: "Kuraattorin merkinnät", en: "The Curator’s Records" },
    text: [
      { fi: "Holvia ei ollut tarkoitettu avattavaksi ennen oikeaa hetkeä.", en: "The Vault was never meant to be opened before the time was right." },
      { fi: "Monet yrittivät. Kaikki epäonnistuivat.", en: "Many tried. All failed." },
      { fi: "Sillä lopullinen aarre ei ollut esine, vaan ymmärrys.", en: "For the final treasure was not an object, but understanding." },
      { fi: "Kun jokainen huone on paljastanut oppituntinsa, avain syntyy itsestään — ei palkintona, vaan tarkoituksena.", en: "When every room has revealed its lesson, the key reveals itself—not as a prize, but as a purpose." },
      { fi: "Holvi muistaa.", en: "The Vault remembers." },
    ],
  },
  unlocks: {
    theme: { fi: "Aarreholvi", en: "Treasure Vault" },
    roomAccess: { fi: "Aarreholvi", en: "Treasure Vault" },
    lore: { fi: "Kuraattorin merkinnät", en: "The Curator’s Records" },
    artefact: { fi: "Palautettu holvin avain", en: "The Restored Vault Key" },
    achievement: { fi: "Holvin mestari", en: "Vault Master" },
  },
  kind: "treasure-vault",
}
