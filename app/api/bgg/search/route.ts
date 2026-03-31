import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  console.log("[v0] BGG search called with query:", query)

  if (!query) {
    console.log("[v0] BGG search: No query provided")
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    console.log("[v0] BGG search: Fetching from BGG API...")
    // Search BGG API - requires browser-like headers to avoid 401
    const searchResponse = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`,
      { 
        headers: { 
          'Accept': 'application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store', // Don't cache to avoid stale responses
      }
    )

    console.log("[v0] BGG API response status:", searchResponse.status)
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error(`[v0] BGG API error: ${searchResponse.status}, ${errorText}`)
      throw new Error(`BGG API error: ${searchResponse.status}`)
    }

    const xmlText = await searchResponse.text()
    console.log("[v0] BGG API response length:", xmlText.length)
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
        // Find primary name or use first
        const primary = nameData.find((n: Record<string, unknown>) => n['@_type'] === 'primary')
        name = primary ? String(primary['@_value'] || '') : String(nameData[0]?.['@_value'] || '')
      } else if (nameData && typeof nameData === 'object') {
        name = String((nameData as Record<string, unknown>)['@_value'] || '')
      }

      // Handle year published
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
    return NextResponse.json(
      { error: 'Failed to search BoardGameGeek' },
      { status: 500 }
    )
  }
}
