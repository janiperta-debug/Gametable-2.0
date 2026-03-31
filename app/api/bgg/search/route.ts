import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

// Fetch from BGG with retry
async function fetchFromBGG(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/xml, text/xml, */*',
      'User-Agent': 'GameTable/1.0 (https://gametable.fi)',
    },
    cache: 'no-store',
  })
  
  if (response.ok) return response
  
  // Retry with different user agent
  return fetch(url, {
    headers: {
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (compatible; GameTableBot/1.0)',
    },
    cache: 'no-store',
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const bggUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    
    const searchResponse = await fetchFromBGG(bggUrl)

    if (!searchResponse.ok) {
      // BGG API requires registration - return helpful message
      if (searchResponse.status === 401) {
        return NextResponse.json({ 
          results: [], 
          error: 'BGG API requires domain registration. Please use manual entry for now.',
          needsRegistration: true
        })
      }
      return NextResponse.json({ results: [], note: 'BGG API temporarily unavailable' })
    }

    const xmlText = await searchResponse.text()
    
    if (!xmlText || xmlText.length < 50) {
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

    return NextResponse.json({ results })
  } catch (error) {
    console.error('BGG search error:', error)
    // Return empty results with error note rather than failing
    return NextResponse.json({ 
      results: [], 
      error: 'BoardGameGeek search temporarily unavailable' 
    })
  }
}
