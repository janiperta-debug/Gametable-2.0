import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

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

// Fetch thumbnails for multiple IDs in a single API call
async function fetchThumbnails(ids: number[], headers: Record<string, string>): Promise<Map<number, string>> {
  const thumbnailMap = new Map<number, string>()
  
  if (ids.length === 0) return thumbnailMap

  try {
    // BGG API allows comma-separated IDs for batch requests
    const idsParam = ids.join(',')
    const detailsUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${idsParam}`
    
    const response = await fetch(detailsUrl, { headers, cache: 'no-store' })
    
    if (!response.ok) {
      console.log("[v0] BGG Thumbnail batch fetch failed:", response.status)
      return thumbnailMap
    }

    const xmlText = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xmlText)

    if (!result.items || !result.items.item) {
      return thumbnailMap
    }

    const items = Array.isArray(result.items.item) 
      ? result.items.item 
      : [result.items.item]

    for (const item of items) {
      const id = parseInt(String(item['@_id']), 10)
      const thumbnail = item.thumbnail as string | undefined
      if (thumbnail) {
        thumbnailMap.set(id, thumbnail)
      }
    }
  } catch (error) {
    console.error("[v0] BGG Thumbnail batch fetch error:", error)
  }

  return thumbnailMap
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  const headers: Record<string, string> = {
    'Accept': 'application/xml, text/xml, */*',
  }

  if (BGG_API_TOKEN) {
    headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`
  }

  try {
    // Step 1: Search for board games
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

    // Step 2: Fetch thumbnails for all results in one batch call
    const ids = results.map(r => r.id)
    const thumbnails = await fetchThumbnails(ids, headers)

    // Step 3: Merge thumbnails into results
    const resultsWithThumbnails = results.map(r => ({
      ...r,
      thumbnail: thumbnails.get(r.id) || null
    }))

    return NextResponse.json({ results: resultsWithThumbnails })
  } catch (error) {
    console.error('BGG search error:', error)
    return NextResponse.json({ 
      results: [], 
      error: 'BoardGameGeek search temporarily unavailable' 
    })
  }
}
