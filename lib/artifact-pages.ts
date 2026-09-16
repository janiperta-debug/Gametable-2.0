/**
 * ARTIFACT PAGES — content data for the per-room artifact detail pages.
 * The visual template is fixed; this file contains bilingual room-specific copy.
 */

import type { Localized } from "@/lib/room-theme-pages"

export interface ArtifactPage {
  id: string
  subtitle: Localized
  heroCaption: Localized
  lore: { title: Localized; text: Localized[] }
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
    subtitle: { fi: "Kartanon sydän. Matkasi alkaa täältä.", en: "The heart of the Manor. Your journey begins here." },
    heroCaption: { fi: "Jokainen vieras astuu kartanoon näiden ovien kautta. Tervetulon, tarinoiden ja loputtomien mahdollisuuksien paikka.", en: "Every guest enters the Manor through these doors. A place of welcome, stories, and endless possibilities." },
    lore: { title: { fi: "Kutsu", en: "The Invitation" }, text: [
      { fi: "Jokainen matka kartanon läpi alkaa samalla tavalla.", en: "Every journey through the Manor begins the same way." },
      { fi: "Tervetulo.", en: "A welcome." },
      { fi: "Sirpale.", en: "A fragment." },
      { fi: "Ja kysymys, jota kukaan ei vielä osaa esittää.", en: "And a question no one yet knows to ask." },
    ] },
    unlocks: { theme: { fi: "Pääsali", en: "Main Hall" }, roomAccess: { fi: "Pääsali", en: "Main Hall" }, lore: { fi: "Kutsu", en: "The Invitation" }, artefact: { fi: "Ensimmäinen sirpale", en: "The First Fragment" }, achievement: { fi: "Ei sovellettavissa", en: "Not applicable" } },
  },
  library: {
    id: "library",
    subtitle: { fi: "Tiedon vartija. Etsi, opi, muista.", en: "The keeper of knowledge. Seek, learn, remember." },
    heroCaption: { fi: "Näiden seinien sisällä säilytetään lukemattomia tarinoita. Tieto on avain, joka avaa jokaisen muun oven. Mitä sinä löydät?", en: "Within these walls, countless stories are preserved. Knowledge is the key that unlocks every other door. What will you discover?" },
    lore: { title: { fi: "Arkistonhoitajan muistiinpanot", en: "The Archivist's Notes" }, text: [
      { fi: "Kartanon arkistonhoitajat ovat omistaneet elämänsä tiedon keräämiselle jokaisesta valtakunnasta.", en: "The Archivists of the Manor have dedicated their lives to gathering knowledge from every realm." },
      { fi: "Jotkin totuudet on kirjoitettu kirjoihin. Toiset on kirjoitettu ihmisiin.", en: "Some truths are written in books. Others are written in people." },
      { fi: "Lue. Pohdi. Muista.", en: "Read. Reflect. Remember." },
    ] },
    unlocks: { theme: { fi: "Kirjasto", en: "Library" }, roomAccess: { fi: "Kirjasto", en: "Library" }, lore: { fi: "Arkistonhoitajan muistiinpanot", en: "The Archivist's Notes" }, artefact: { fi: "Arkistonhoitajan sulkakynä", en: "Archivist's Quill" }, achievement: { fi: "Tiedon etsijä", en: "Seeker of Knowledge" } },
  },
  conservatory: {
    id: "conservatory",
    subtitle: { fi: "Elämän, kasvun ja yhteyden pyhäkkö.", en: "A sanctuary of life, growth, and connection." },
    heroCaption: { fi: "Täällä monien maailmojen luontoa vaalitaan ja jaetaan. Jokainen siemen, jokainen kukka, jokainen kosketus muistuttaa meitä siitä, että kasvamme vahvemmiksi yhdessä.", en: "Here, nature from many worlds is nurtured and shared. Every seed, every bloom, every touch is a reminder that we grow stronger together." },
    lore: { title: { fi: "Puutarhurin muistiinpanot", en: "The Gardener's Notes" }, text: [
      { fi: "Puutarhuri huolehtii muustakin kuin kasveista.", en: "The Gardener tends to more than plants." },
      { fi: "Hän viljelee ymmärrystä, kärsivällisyyttä ja huolenpitoa.", en: "They cultivate understanding, patience, and care." },
      { fi: "Vaali sitä, mitä rakastat, ja katso sen kukoistavan.", en: "Nurture what you love, and watch it flourish." },
    ] },
    unlocks: { theme: { fi: "Talvipuutarha", en: "Conservatory" }, roomAccess: { fi: "Talvipuutarha", en: "Conservatory" }, lore: { fi: "Puutarhurin muistiinpanot", en: "The Gardener's Notes" }, artefact: { fi: "Harmonian siemen", en: "Seed of Harmony" }, achievement: { fi: "Viljelijä", en: "Cultivator" } },
  },
  "fireside-lounge": {
    id: "fireside-lounge",
    subtitle: { fi: "Lämmön, tarinoiden ja ystävyyden paikka.", en: "A place of warmth, stories, and friendship." },
    heroCaption: { fi: "Vedä tuoli lähemmäs, jaa tarina ja kuuntele. Tulen lämmössä tuntemattomista tulee ystäviä ja seikkailut saavat muistonsa.", en: "Pull up a chair, share a story, and listen. In the warmth of the fire, strangers become friends and adventures are remembered." },
    lore: { title: { fi: "Oleskelusalin kronikat", en: "The Lounge Chronicles" }, text: [
      { fi: "Monet tarinat alkavat oleskelusalista.", en: "Many tales begin in the Lounge." },
      { fi: "Voittoja juhlitaan. Tappioista selvitään. Suunnitelmia tehdään. Unelmia jaetaan.", en: "Victories celebrated. Defeats survived. Plans made. Dreams shared." },
      { fi: "Tuli muistaa jokaisen äänen.", en: "The fire remembers every voice." },
    ] },
    unlocks: { theme: { fi: "Takkahuone", en: "Fireside Lounge" }, roomAccess: { fi: "Takkahuone", en: "Fireside Lounge" }, lore: { fi: "Oleskelusalin kronikat", en: "The Lounge Chronicles" }, artefact: { fi: "Toveruuden hiillos", en: "Ember of Camaraderie" }, achievement: { fi: "Ystävyyden kipinä", en: "Kindled Bonds" } },
  },
  bar: {
    id: "bar",
    subtitle: { fi: "Naurun, maljojen ja legendojen paikka.", en: "A place of laughter, toasts, and legends." },
    heroCaption: { fi: "Nosta malja. Jaa tarina. Juhli voittoja, naura epäonnistumisille ja nauti seurasta. Baarissa jokainen seikkailija kuuluu joukkoon.", en: "Raise a glass. Share a tale. Celebrate the wins, laugh at the fails, and enjoy the company. In the Bar, every adventurer belongs." },
    lore: { title: { fi: "Baarimestarin merkinnät", en: "The Bartender's Records" }, text: [
      { fi: "Baarimestari on nähnyt kaiken.", en: "The bartender has seen it all." },
      { fi: "Sankareita ja ensikertalaisia. Voittoja ja katastrofeja. Uusia ystävyyksiä ja vanhoja kiistoja.", en: "Heroes and rookies. Victories and disasters. New friendships and old rivalries." },
      { fi: "Kaikki on kirjoitettu tänne, hyvässä hengessä.", en: "All are written here, in good spirit." },
      { fi: "Nosta malja ja tule osaksi tarinaa.", en: "Raise a glass and become part of the story." },
    ] },
    unlocks: { theme: { fi: "Baari", en: "The Bar" }, roomAccess: { fi: "Baari", en: "The Bar" }, lore: { fi: "Baarimestarin merkinnät", en: "The Bartender's Records" }, artefact: { fi: "Baarimestarin lokikirja", en: "Bartender's Ledger" }, achievement: { fi: "Maljat ja tarinat", en: "Tales & Toasts" } },
  },
  spa: {
    id: "spa",
    subtitle: { fi: "Pyhäkkö keholle, mielelle ja hengelle.", en: "A sanctuary for body, mind, and spirit." },
    heroCaption: { fi: "Hengitä syvään. Päästä irti siitä, mikä painaa sinua. Virkisty, pohdi ja löydä tasapainosi uudelleen. Et voi ammentaa tyhjästä kupista.", en: "Take a breath. Let go of what weighs you down. Rejuvenate, reflect, and realign. You cannot pour from an empty cup." },
    lore: { title: { fi: "Hyvinvointipäiväkirja", en: "The Wellness Journal" }, text: [
      { fi: "Kylpylässä vieraita muistutetaan siitä, että todellinen voima tulee sisältä.", en: "In the Spa, guests are reminded that true strength comes from within." },
      { fi: "Keho palautuu. Mieli rauhoittuu. Henki virkistyy.", en: "Body restored. Mind quieted. Spirit refreshed." },
      { fi: "Vain itsestään huolehtivat kestävät suurimmat matkat.", en: "Only those who care for themselves can endure the greatest journeys." },
    ] },
    unlocks: { theme: { fi: "Kylpylä", en: "Spa" }, roomAccess: { fi: "Kylpylä", en: "Spa" }, lore: { fi: "Hyvinvointipäiväkirja", en: "The Wellness Journal" }, artefact: { fi: "Rauhan pullo", en: "Vial of Tranquility" }, achievement: { fi: "Sisäinen tasapaino", en: "Inner Balance" } },
  },
  gallery: {
    id: "gallery",
    subtitle: { fi: "Inspiraation, kauneuden ja näkökulmien sali.", en: "A hall of inspiration, beauty, and perspective." },
    heroCaption: { fi: "Jokainen taideteos kantaa tuhatta tarinaa. Jokainen näkökulma paljastaa uuden totuuden. Katso lähempää. Tunne syvemmin. Näe pidemmälle. Galleriassa inspiraatio on kaikkialla.", en: "Every piece of art holds a thousand stories. Every perspective reveals a new truth. Look closer. Feel deeper. See beyond. In the Gallery, inspiration is everywhere." },
    lore: { title: { fi: "Kuraattorin muistiinpanot", en: "The Curator's Notes" }, text: [
      { fi: "Kuraattori matkustaa kauas ja laajalle etsien kauneutta, merkitystä ja muistamisen arvoisia hetkiä.", en: "The Curator travels far and wide, seeking beauty, meaning, and moments worth remembering." },
      { fi: "Taide puhuu ilman sanoja. Se haastaa. Se lohduttaa. Se yhdistää meidät maailmoihin, joita emme ehkä koskaan näe, mutta jotenkin ymmärrämme.", en: "Art speaks without words. It challenges. It comforts. It connects us to worlds we may never see, yet somehow understand." },
      { fi: "Avaa mielesi. Pidä sydämesi avoinna. Galleria on niille, jotka etsivät.", en: "Open your mind. Keep your heart open. The Gallery is for those who seek." },
    ] },
    unlocks: { theme: { fi: "Galleria", en: "Gallery" }, roomAccess: { fi: "Galleria", en: "Gallery" }, lore: { fi: "Kuraattorin muistiinpanot", en: "The Curator's Notes" }, artefact: { fi: "Oivalluksen linssi", en: "Lens of Insight" }, achievement: { fi: "Inspiroitunut mieli", en: "Inspired Mind" } },
  },
  artroom: {
    id: "artroom",
    subtitle: { fi: "Ilmaisun, mielikuvituksen ja luomisen studio.", en: "A studio of expression, imagination, and creation." },
    heroCaption: { fi: "Luo ilman rajoja. Tutki ilman pelkoa. Jokainen siveltimen veto on näkyväksi tehty ajatus. Jokainen väri, vapaaksi päästetty tunne. Artroomissa mielikuvituksesi on kotona.", en: "Create without limits. Explore without fear. Every stroke is a thought made visible. Every color, an emotion set free. In the Artroom, your imagination has a home." },
    lore: { title: { fi: "Taiteilijan luonnoskirja", en: "The Artist's Sketchbook" }, text: [
      { fi: "Suuri taide ei synny täydellisyydestä, vaan harjoittelusta.", en: "Great art is not born in perfection, but in practice." },
      { fi: "Ideat ovat hauraita. Ne on vangittava, muovattava ja niitä on vaalittava.", en: "Ideas are fragile. They must be captured, shaped, and nurtured." },
      { fi: "Virheet ovat osa mestariteosta. Luo. Pohdi. Kehity. Se on taiteilijan tie.", en: "Mistakes are part of the masterpiece. Create. Reflect. Evolve. That is the artist's way." },
    ] },
    unlocks: { theme: { fi: "Taidehuone", en: "Artroom" }, roomAccess: { fi: "Taidehuone", en: "Artroom" }, lore: { fi: "Taiteilijan luonnoskirja", en: "The Artist's Sketchbook" }, artefact: { fi: "Inspiraation sivellin", en: "Brush of Inspiration" }, achievement: { fi: "Luova kipinä", en: "Creative Spark" } },
  },
  "map-room": {
    id: "map-room",
    subtitle: { fi: "Tiedon, suunnittelun ja reittien kammio.", en: "A chamber of knowledge, planning, and paths." },
    heroCaption: { fi: "Jokainen matka alkaa valinnasta. Jokainen valinta alkaa tiedosta. Täällä kartat ovat enemmän kuin piirroksia — ne ovat mahdollisuuksia, riskejä ja unelmia. Maproomissa suunnitelmat saavat muodon ja määränpäät tulevat lähemmäs.", en: "Every journey begins with a choice. Every choice begins with knowledge. Here, maps are more than drawings—they are possibilities, risks, and dreams. In the Maproom, plans take shape and destinations come closer." },
    lore: { title: { fi: "Kartografin lokikirja", en: "The Cartographer's Log" }, text: [
      { fi: "Maailma on laaja, eikä yksikään kartta ole koskaan valmis.", en: "The world is vast, and no map is ever complete." },
      { fi: "Silti keskeneräiset kartat voivat johdattaa rohkeita.", en: "Yet even incomplete maps can guide the brave." },
      { fi: "Viisaat eivät etsi karttaa, joka näyttää kaiken — he etsivät karttaa, joka näyttää sen, mitä on niiden tuolla puolen.", en: "The wise do not seek a map that shows everything—they seek one that shows what lies beyond." },
      { fi: "Piirrä polkusi. Kulje sitten sitä.", en: "Draw your path. Then walk it." },
    ] },
    unlocks: { theme: { fi: "Karttahuone", en: "Maproom" }, roomAccess: { fi: "Karttahuone", en: "Maproom" }, lore: { fi: "Kartografin lokikirja", en: "The Cartographer's Log" }, artefact: { fi: "Ohjauksen kompassi", en: "Compass of Guidance" }, achievement: { fi: "Tiennäyttäjä", en: "Pathfinder" } },
  },
}

export function getArtifactPage(roomId: string): ArtifactPage | undefined {
  return ARTIFACT_PAGES[roomId]
}
