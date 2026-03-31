import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

const BGG_API_TOKEN = process.env.BGG_API_TOKEN

// Fetch from BGG with API token
async function fetchFromBGG(url: string): Promise<Response> {
  const headers: Record<string, string> = {
    'Accept': 'application/xml, text/xml, */*',
    'User-Agent': 'GameTable/1.0 (https://gametable.fi)',
  }
  
  if (BGG_API_TOKEN) {
    headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`
  }
  
  return fetch(url, { headers, cache: 'no-store' })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 })
  }

  try {
    const bggUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`
    const response = await fetchFromBGG(bggUrl)

    if (!response.ok) {
      return NextResponse.json({ error: 'Game details temporarily unavailable' }, { status: 503 })
    }

    const xmlText = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xmlText)

    if (!result.items || !result.items.item) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const item = result.items.item

    // Handle name - can be array or object
    const nameData = item.name
    let name = ''
    if (Array.isArray(nameData)) {
      const primary = nameData.find((n: Record<string, unknown>) => n['@_type'] === 'primary')
      name = primary ? String(primary['@_value'] || '') : String(nameData[0]?.['@_value'] || '')
    } else if (nameData && typeof nameData === 'object') {
      name = String((nameData as Record<string, unknown>)['@_value'] || '')
    }

    // Extract statistics
    const stats = item.statistics?.ratings
    const rating = stats?.average?.['@_value'] 
      ? parseFloat(String(stats.average['@_value'])) 
      : null

    const gameDetails = {
      id: parseInt(String(item['@_id']), 10),
      name,
      yearPublished: item.yearpublished?.['@_value'] 
        ? parseInt(String(item.yearpublished['@_value']), 10) 
        : null,
      minPlayers: item.minplayers?.['@_value'] 
        ? parseInt(String(item.minplayers['@_value']), 10) 
        : null,
      maxPlayers: item.maxplayers?.['@_value'] 
        ? parseInt(String(item.maxplayers['@_value']), 10) 
        : null,
      minPlaytime: item.minplaytime?.['@_value'] 
        ? parseInt(String(item.minplaytime['@_value']), 10) 
        : null,
      maxPlaytime: item.maxplaytime?.['@_value'] 
        ? parseInt(String(item.maxplaytime['@_value']), 10) 
        : null,
      rating: rating ? Math.round(rating * 10) / 10 : null,
      image: item.image || null,
      thumbnail: item.thumbnail || null,
      description: item.description 
        ? String(item.description).replace(/&#10;/g, '\n').substring(0, 2000) 
        : null,
    }

    return NextResponse.json(gameDetails)
  } catch (error) {
    console.error('BGG details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    )
  }
}
