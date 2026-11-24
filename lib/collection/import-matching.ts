export type CatalogMatchScore = { score: number; reasons: string[] }

function normalizeCatalogName(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y"
      if (word.length > 3 && word.endsWith("s") && !/(ss|us|is|os)$/.test(word)) return word.slice(0, -1)
      return word
    })
    .join(" ")
}

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0]
    previous[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j]
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return previous[b.length]
}

/** Split a natural-language miniature list into separate unit names. */
export function splitMiniatureListLine(value: string): string[] {
  return value
    .split(/\s*(?:[,;]|\bja\b)\s*/i)
    .map((part) => part.replace(/[\s\-–—:]+$/g, "").replace(/^[\s\-–—:]+/g, "").trim())
    .filter(Boolean)
}

export function miniatureSearchTerms(value: string): string[] {
  const words = normalizeCatalogName(value).split(" ").filter((word) => word.length >= 3)
  const terms = new Set<string>([value.trim()])
  for (const word of words) {
    terms.add(word)
    if (word.length >= 7) terms.add(word.slice(0, 6))
  }
  return [...terms].filter(Boolean).slice(0, 8)
}

export function scoreCatalogMatch(query: string, candidateName: string): CatalogMatchScore {
  const wanted = normalizeCatalogName(query)
  const found = normalizeCatalogName(candidateName)
  if (!wanted || !found) return { score: 0, reasons: [] }
  if (wanted === found) return { score: 1, reasons: ["Exact name match"] }

  if (found.startsWith(`${wanted} `)) return { score: 0.94, reasons: ["Name prefix match"] }
  if (found.includes(` ${wanted} `)) return { score: 0.92, reasons: ["Full phrase match"] }
  if (wanted.startsWith(`${found} `)) return { score: 0.84, reasons: ["Candidate name is a shorter phrase"] }
  if (wanted.includes(` ${found} `)) return { score: 0.82, reasons: ["Candidate phrase contained in query"] }

  const wantedWords = [...new Set(wanted.split(" "))]
  const foundWords = [...new Set(found.split(" "))]
  const matched = wantedWords.map((word) => {
    let best = 0
    for (const candidate of foundWords) {
      const distance = editDistance(word, candidate)
      const similarity = 1 - distance / Math.max(word.length, candidate.length)
      if (similarity > best) best = similarity
    }
    return best >= 0.72 ? best : 0
  })
  const recall = matched.reduce((sum, score) => sum + score, 0) / wantedWords.length
  if (recall === 0) return { score: 0, reasons: [] }
  const precision = matched.filter(Boolean).length / foundWords.length
  const score = 0.68 * recall + 0.32 * precision
  return { score, reasons: [matched.some((score) => score > 0 && score < 1) ? "Fuzzy name match" : "Partial word match"] }
}
