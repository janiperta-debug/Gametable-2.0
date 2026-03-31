import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

// Try multiple approaches to fetch from BGG
async function fetchFromBGG(url: string): Promise<Response> {
  // Try direct fetch first
  const directResponse = await fetch(url, {
    headers: {
      'Accept': 'application/xml, text/xml, */*',
      'User-Agent': 'GameTable/1.0 (https://gametable.fi)',
    },
    cache: 'no-store',
  })
  
  if (directResponse.ok) {
    return directResponse
  }
  
  console.log("[v0] Direct BGG fetch failed with status:", directResponse.status)
  
  // If direct fails, try with different user agent
  const retryResponse = await fetch(url, {
    headers: {
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (compatible; GameTableBot/1.0)',
    },
    cache: 'no-store',
  })
  
  return retryResponse
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  console.log("[v0] BGG search called with query:", query)

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const bggUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    console.log("[v0] Fetching from BGG:", bggUrl)
    
    const searchResponse = await fetchFromBGG(bggUrl)
    console.log("[v0] BGG response status:", searchResponse.status)

    if (!searchResponse.ok) {
      // Return empty results instead of error for blocked requests
      console.log("[v0] BGG API blocked or error, returning empty results")
      return NextResponse.json({ results: [], note: 'BGG API temporarily unavailable' })
    }

    const xmlText = await searchResponse.text()
    console.log("[v0] BGG response length:", xmlText.length, "chars")
    
    if (!xmlText || xmlText.length < 50) {
      console.log("[v0] BGG returned empty or minimal response")
      return NextResponse.json({ results: [] })
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xmlText)

    // Handle empty results
    if (!result.items || !result.items.item) {
      return NextResponse.json({ results: [] })
    }

    // Normalize to array (BGG returns object if single result)
    const items = Array.isArray(result.items.item) 
      ? result.items.item 
      : [result.items.item]

    // Transform to our format
    const results = items.slice(0, 20).map((item: Record<string, unknown>) => {
      // Handle name - can be array or object
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

    console.log("[v0] BGG search returning", results.length, "results")
    return NextResponse.json({ results })
  } catch (error) {
    console.error('[v0] BGG search error:', error)
    // Return empty results with error note rather than failing
    return NextResponse.json({ 
      results: [], 
      error: 'BoardGameGeek search temporarily unavailable' 
    })
  }
}
