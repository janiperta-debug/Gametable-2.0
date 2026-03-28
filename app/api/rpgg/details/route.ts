import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 })
  }

  try {
    // Fetch RPG details from RPGGeek API - requires browser-like headers
    const response = await fetch(
      `https://rpggeek.com/xmlapi2/thing?id=${id}&stats=1`,
      { 
        headers: { 
          'Accept': 'application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      console.error(`RPGGeek API details error: ${response.status}`)
      throw new Error(`RPGGeek API error: ${response.status}`)
    }

    const xmlText = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xmlText)

    if (!result.items || !result.items.item) {
      return NextResponse.json({ error: 'RPG not found' }, { status: 404 })
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
      // RPGs typically don't have player counts, but some do
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
    console.error('RPGGeek details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RPG details' },
      { status: 500 }
    )
  }
}
