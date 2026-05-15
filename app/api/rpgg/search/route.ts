import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

const BGG_API_TOKEN = process.env.BGG_API_TOKEN

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
  }

  try {
    // Use boardgamegeek.com with type=rpgitem (same API, different type)
    // rpggeek.com returns 403 but boardgamegeek.com works for rpgitem type
    const bggUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=rpgitem`
    
    const headers: Record<string, string> = {
      'Accept': 'application/xml, text/xml, */*',
    }
    
    if (BGG_API_TOKEN) {
      headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`
    }
    
    const searchResponse = await fetch(bggUrl, {
      headers,
      cache: 'no-store',
    })

    if (!searchResponse.ok) {
      console.log("BGG RPG search failed with status:", searchResponse.status)
      return NextResponse.json({ results: [], note: 'RPG search temporarily unavailable' })
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
    console.error('RPG search error:', error)
    return NextResponse.json({ 
      results: [], 
      error: 'RPG search temporarily unavailable' 
    })
  }
}
