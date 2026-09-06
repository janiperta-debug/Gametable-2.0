export function getSearchResultId(result: { catalogId?: string; id?: string | number }): string | number {
  return result.catalogId ?? result.id ?? ""
}
