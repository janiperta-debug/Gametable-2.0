import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'
import { createClient } from '@/lib/supabase/server'
import type { BGGSearchResult } from '@/lib/types/database'

const BGG_API_TOKEN = process.env.BGG_API_TOKEN

interface SearchResult {
  id: number
  name: string
  yearPublished: number | null
  thumbnail?: string
}

function parseXMLSearchResults(xmlText: string): SearchResult[] {
  if (!xmlText || xmlText.length < 50) {
    return []
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  })
  const result = parser.parse(xmlText)

  if (!result.items || !result.items.item) {
    return []
  }

  const items = Array.isArray(result.items.item) 
    ? result.items.item 
    : [result.items.item]

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

type ThingMeta = {
  thumbnail: string | null
  type: string
  baseGame: { bggId: number; name: string } | null
}

// Fetch thumbnail + item type + (for expansions) the inbound base game for
// multiple IDs in a single API call. The `thing` response already contains the
// <link> elements, so classifying + linking costs no extra requests.
async function fetchThingMeta(
  ids: number[],
  headers: Record<string, string>
): Promise<Map<number, ThingMeta>> {
  const metaMap = new Map<number, ThingMeta>()

  if (ids.length === 0) return metaMap

  try {
    // BGG API allows comma-separated IDs for batch requests
    const idsParam = ids.join(',')
    const detailsUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${idsParam}`
    
    const response = await fetch(detailsUrl, { headers, cache: 'no-store' })
    
    if (!response.ok) {
      console.log("[v0] BGG thing batch fetch failed:", response.status)
      return metaMap
    }

    const xmlText = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xmlText)

    if (!result.items || !result.items.item) {
      return metaMap
    }

    const items = Array.isArray(result.items.item) 
      ? result.items.item 
      : [result.items.item]

    for (const item of items) {
      const id = parseInt(String(item['@_id']), 10)
      const thumbnail = (item.thumbnail as string | undefined) || null
      const type = String(item['@_type'] || 'boardgame')

      // For expansions, find the inbound boardgameexpansion link → base game.
      let baseGame: { bggId: number; name: string } | null = null
      if (type === 'boardgameexpansion') {
        const links = Array.isArray(item.link) ? item.link : item.link ? [item.link] : []
        const inbound = links.find(
          (l: Record<string, unknown>) =>
            l['@_type'] === 'boardgameexpansion' && String(l['@_inbound']) === 'true',
        )
        if (inbound) {
          const baseId = parseInt(String(inbound['@_id']), 10)
          if (!Number.isNaN(baseId)) {
            baseGame = { bggId: baseId, name: String(inbound['@_value'] || '') }
          }
        }
      }

      metaMap.set(id, { thumbnail, type, baseGame })
    }
  } catch (error) {
    console.error("[v0] BGG thing batch fetch error:", error)
  }

  return metaMap
}

async function searchCatalog(query: string): Promise<BGGSearchResult[] | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id, name, year, thumbnail_url')
      .eq('category', 'board_game')
      .not('bgg_id', 'is', null)
      .ilike('name', `%${query}%`)
      .limit(20)

    if (error) {
      console.error('Board Game Catalog search error:', error)
      return null
    }

    return (data ?? []).flatMap((game) => {
      if (game.bgg_id === null) return []

      return [{
        id: game.bgg_id,
        name: game.name,
        yearPublished: game.year,
        thumbnail: game.thumbnail_url,
        type: 'base' as const,
        baseGame: null,
      }]
    })
  } catch (error) {
    console.error('Board Game Catalog search failed:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')?.trim()

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  const catalogResults = await searchCatalog(query)
  if (catalogResults && catalogResults.length > 0) {
    return NextResponse.json({ results: catalogResults })
  }

  const headers: Record<string, string> = {
    'Accept': 'application/xml, text/xml, */*',
  }

  if (BGG_API_TOKEN) {
    headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`
  }

  try {
    // Catalog miss: search BGG as the external fallback.
    const bggUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    const searchResponse = await fetch(bggUrl, { headers, cache: 'no-store' })

    if (!searchResponse.ok) {
      return NextResponse.json({ results: [], note: 'BGG API temporarily unavailable' })
    }

    const xmlText = await searchResponse.text()
    const results = parseXMLSearchResults(xmlText)

    if (results.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Step 2: Fetch thumbnail + type + base game for all results in one batch.
    const ids = results.map(r => r.id)
    const meta = await fetchThingMeta(ids, headers)

    // Step 3: Annotate each result with thumbnail, whether it's an expansion,
    // and its base game. Expansions are KEPT so the client can nest them under
    // their base game (never dropped).
    const annotated = results.map(r => {
      const m = meta.get(r.id)
      const isExpansion = m?.type === 'boardgameexpansion'
      return {
        ...r,
        thumbnail: m?.thumbnail || null,
        type: isExpansion ? ('expansion' as const) : ('base' as const),
        baseGame: m?.baseGame || null,
      }
    })

    return NextResponse.json({ results: annotated })
  } catch (error) {
    console.error('BGG search error:', error)
    return NextResponse.json({ 
      results: [], 
      error: 'BoardGameGeek search temporarily unavailable' 
    })
  }
}
