import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'
import { createClient } from '@/lib/supabase/server'

const BGG_API_TOKEN = process.env.BGG_API_TOKEN

interface SearchResult {
  id: number
  name: string
  yearPublished: number | null
  thumbnail?: string
}

interface CatalogGame {
  bgg_id: number
  name: string
  year: number | null
  thumbnail_url: string | null
}

function parseXMLSearchResults(xmlText: string): SearchResult[] {
  if (!xmlText || xmlText.length < 50) return []

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const result = parser.parse(xmlText)
  if (!result.items || !result.items.item) return []

  const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item]

  return items.slice(0, 20).map((item: Record<string, unknown>) => {
    const nameData = item.name
    let name = ''
    if (Array.isArray(nameData)) {
      const primary = nameData.find((n: Record<string, unknown>) => n['@_type'] === 'primary')
      name = primary ? String(primary['@_value'] || '') : String(nameData[0]?.['@_value'] || '')
    } else if (nameData && typeof nameData === 'object') {
      name = String((nameData as Record<string, unknown>)['@_value'] || '')
    }

    const yearData = item.yearpublished as Record<string, unknown> | undefined
    const yearPublished = yearData ? parseInt(String(yearData['@_value']), 10) || null : null

    return {
      id: parseInt(String(item['@_id']), 10),
      name,
      yearPublished,
    }
  })
}

async function fetchThumbnails(ids: number[], headers: Record<string, string>): Promise<Map<number, string>> {
  const thumbnailMap = new Map<number, string>()
  if (ids.length === 0) return thumbnailMap

  try {
    const detailsUrl = `https://rpggeek.com/xmlapi2/thing?id=${ids.join(',')}`
    const response = await fetch(detailsUrl, { headers, cache: 'no-store' })
    if (!response.ok) return thumbnailMap

    const xmlText = await response.text()
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const result = parser.parse(xmlText)
    if (!result.items || !result.items.item) return thumbnailMap

    const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item]
    for (const item of items) {
      const id = parseInt(String(item['@_id']), 10)
      const thumbnail = item.thumbnail as string | undefined
      if (thumbnail) thumbnailMap.set(id, thumbnail)
    }
  } catch (error) {
    console.error('RPGGeek thumbnail batch fetch error:', error)
  }

  return thumbnailMap
}

async function searchCatalog(query: string): Promise<CatalogGame[]> {
  try {
    const supabase = await createClient()
    const normalizedQuery = query.trim()

    const { data, error } = await supabase
      .from('games')
      .select('bgg_id, name, year, thumbnail_url')
      .eq('category', 'rpg')
      .not('bgg_id', 'is', null)
      .ilike('name', `%${normalizedQuery}%`)
      .limit(20)

    if (error) {
      console.error('Catalog RPG search failed:', error)
      return []
    }

    return (data ?? []) as CatalogGame[]
  } catch (error) {
    console.error('Catalog RPG search error:', error)
    return []
  }
}

function mapCatalogResults(games: CatalogGame[]): SearchResult[] {
  return games.map(game => ({
    id: game.bgg_id,
    name: game.name,
    yearPublished: game.year,
    thumbnail: game.thumbnail_url ?? undefined,
  }))
}

function mergeSearchResults(catalogResults: SearchResult[], externalResults: SearchResult[]): SearchResult[] {
  const merged = new Map<number, SearchResult>()
  for (const result of catalogResults) merged.set(result.id, result)
  for (const result of externalResults) {
    if (!merged.has(result.id)) merged.set(result.id, result)
  }
  return Array.from(merged.values()).slice(0, 20)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
  }

  const headers: Record<string, string> = { 'Accept': 'application/xml, text/xml, */*' }
  if (BGG_API_TOKEN) headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`

  let catalogResults: CatalogGame[] = []

  try {
    catalogResults = await searchCatalog(query)

    // Catalog-first means local Catalog data is preferred, not that RPGGeek is skipped.
    // RPGGeek remains the complementary source so broader matches stay discoverable.
    let externalResults: SearchResult[] = []
    const normalizedQuery = query.trim()
    const rpggUrl = `https://rpggeek.com/xmlapi2/search?query=${encodeURIComponent(normalizedQuery)}&type=rpgitem`
    const rpggResponse = await fetch(rpggUrl, { headers, cache: 'no-store' })

    if (rpggResponse.ok) {
      externalResults = parseXMLSearchResults(await rpggResponse.text())
    } else {
      const bggUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(normalizedQuery)}&type=rpgitem`
      const bggResponse = await fetch(bggUrl, { headers, cache: 'no-store' })
      if (bggResponse.ok) externalResults = parseXMLSearchResults(await bggResponse.text())
    }

    const merged = mergeSearchResults(mapCatalogResults(catalogResults), externalResults)
    if (merged.length === 0) return NextResponse.json({ results: [] })

    const limited = merged.slice(0, 20)
    const thumbnails = await fetchThumbnails(limited.map(result => result.id), headers)
    const resultsWithThumbnails = limited.map(result => ({
      ...result,
      thumbnail: thumbnails.get(result.id) || result.thumbnail || null,
    }))

    return NextResponse.json({ results: resultsWithThumbnails })
  } catch (error) {
    console.error('RPG search error:', error)
    return NextResponse.json({
      results: mapCatalogResults(catalogResults),
      error: 'RPG search temporarily unavailable',
    })
  }
}
