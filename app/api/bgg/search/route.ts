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
    return { id: parseInt(String(item['@_id']), 10), name, yearPublished }
  })
}

type ThingMeta = {
  thumbnail: string | null
  type: string
  baseGame: { bggId: number; name: string } | null
}

async function fetchThingMeta(ids: number[], headers: Record<string, string>): Promise<Map<number, ThingMeta>> {
  const metaMap = new Map<number, ThingMeta>()
  if (ids.length === 0) return metaMap
  try {
    const response = await fetch(
      `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}`,
      { headers, cache: 'no-store' },
    )
    if (!response.ok) {
      console.log('[v0] BGG thing batch fetch failed:', response.status)
      return metaMap
    }
    const result = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' }).parse(await response.text())
    if (!result.items || !result.items.item) return metaMap
    const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item]
    for (const item of items) {
      const id = parseInt(String(item['@_id']), 10)
      const thumbnail = (item.thumbnail as string | undefined) || null
      const type = String(item['@_type'] || 'boardgame')
      let baseGame: { bggId: number; name: string } | null = null
      if (type === 'boardgameexpansion') {
        const links = Array.isArray(item.link) ? item.link : item.link ? [item.link] : []
        const inbound = links.find(
          (l: Record<string, unknown>) => l['@_type'] === 'boardgameexpansion' && String(l['@_inbound']) === 'true',
        )
        if (inbound) {
          const baseId = parseInt(String(inbound['@_id']), 10)
          if (!Number.isNaN(baseId)) baseGame = { bggId: baseId, name: String(inbound['@_value'] || '') }
        }
      }
      metaMap.set(id, { thumbnail, type, baseGame })
    }
  } catch (error) {
    console.error('[v0] BGG thing batch fetch error:', error)
  }
  return metaMap
}

async function searchCatalog(query: string): Promise<CatalogGame[]> {
  try {
    const supabase = await createClient()
    const normalizedQuery = query.trim()
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id, name, year, thumbnail_url')
      .eq('category', 'board_game')
      .not('bgg_id', 'is', null)
      .ilike('name', `%${normalizedQuery}%`)
      .limit(20)
    if (error) {
      console.error('Catalog board game search failed:', error)
      return []
    }
    return (data ?? []) as CatalogGame[]
  } catch (error) {
    console.error('Catalog board game search error:', error)
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

function mergeSearchResults(catalogResults: SearchResult[], bggResults: SearchResult[]): SearchResult[] {
  const merged = new Map<number, SearchResult>()
  for (const result of catalogResults) merged.set(result.id, result)
  for (const result of bggResults) if (!merged.has(result.id)) merged.set(result.id, result)
  return Array.from(merged.values()).slice(0, 20)
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })

  const headers: Record<string, string> = { 'Accept': 'application/xml, text/xml, */*' }
  if (BGG_API_TOKEN) headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`

  let catalogResults: CatalogGame[] = []
  try {
    catalogResults = await searchCatalog(query)
    const bggUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    const searchResponse = await fetch(bggUrl, { headers, cache: 'no-store' })

    if (!searchResponse.ok) {
      return NextResponse.json({ results: mapCatalogResults(catalogResults) })
    }

    const bggResults = parseXMLSearchResults(await searchResponse.text())
    const merged = mergeSearchResults(mapCatalogResults(catalogResults), bggResults)
    if (merged.length === 0) return NextResponse.json({ results: [] })

    const limited = merged.slice(0, 20)
    const meta = await fetchThingMeta(limited.map(r => r.id), headers)
    const annotated = limited.map(r => {
      const m = meta.get(r.id)
      return {
        ...r,
        thumbnail: m?.thumbnail || r.thumbnail || null,
        type: m?.type === 'boardgameexpansion' ? ('expansion' as const) : ('base' as const),
        baseGame: m?.baseGame || null,
      }
    })
    return NextResponse.json({ results: annotated })
  } catch (error) {
    console.error('BGG search error:', error)
    return NextResponse.json({
      results: mapCatalogResults(catalogResults),
      error: 'BoardGameGeek search temporarily unavailable',
    })
  }
}
