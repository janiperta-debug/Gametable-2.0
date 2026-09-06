export function getSearchResultId(result: { catalogId?: string; id?: string | number }): string | number {
  const id = result.catalogId ?? result.id
  if (id === undefined || id === null || id === "") {
    throw new Error("Search result is missing a canonical identity")
  }
  return id
}

export function isAmbiguousMiniatureMatch(results: unknown[], name: string): boolean {
  if (results.length > 1) {
    console.warn(`Ambiguous miniature catalog match for "${name}"`)
    return true
  }
  return false
}
