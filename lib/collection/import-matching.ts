export type CatalogMatchScore = { score: number; reasons: string[] }

function normalizeCatalogName(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      // Normalize common English plurals without damaging names such as
      // Chaos, Adeptus or words that already end in "ss".
      if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y"
      if (word.length > 3 && word.endsWith("s") && !/(ss|us|is|os)$/.test(word)) {
        return word.slice(0, -1)
      }
      return word
    })
    .join(" ")
}

export function scoreCatalogMatch(query: string, candidateName: string): CatalogMatchScore {
  const wanted = normalizeCatalogName(query)
  const found = normalizeCatalogName(candidateName)
  if (!wanted || !found) return { score: 0, reasons: [] }
  if (wanted === found) return { score: 1, reasons: ["Exact name match"] }

  if (found.startsWith(`${wanted} `)) return { score: 0.92, reasons: ["Name prefix match"] }
  if (found.includes(` ${wanted} `)) return { score: 0.9, reasons: ["Full phrase match"] }
  if (wanted.startsWith(`${found} `)) return { score: 0.84, reasons: ["Candidate name is a shorter phrase"] }
  if (wanted.includes(` ${found} `)) return { score: 0.82, reasons: ["Candidate phrase contained in query"] }

  const wantedWords = [...new Set(wanted.split(" "))]
  const foundWords = [...new Set(found.split(" "))]
  const foundSet = new Set(foundWords)
  const overlap = wantedWords.filter((word) => foundSet.has(word)).length
  if (!overlap) return { score: 0, reasons: [] }

  const recall = overlap / wantedWords.length
  const precision = overlap / foundWords.length
  const ordered = wantedWords.every((word, index) => {
    const start = foundWords.indexOf(wantedWords[0])
    return start >= 0 && foundWords[start + index] === word
  })
  const score = 0.58 * recall + 0.27 * precision + 0.15 * (ordered ? 1 : 0.35)
  return { score, reasons: [ordered ? "Ordered word match" : "Partial word match"] }
}
