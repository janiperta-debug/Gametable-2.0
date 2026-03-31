import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

const BGG_API_TOKEN = process.env.BGG_API_TOKEN

export interface BGGCollectionItem {
  id: number
  name: string
  yearPublished: number | null
  thumbnail: string | null
  image: string | null
  status: {
    own: boolean
    wishlist: boolean
  }
  numPlays: number
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username parameter is required' }, { status: 400 })
  }

  try {
    // Fetch user's collection from BGG API
    const collectionUrl = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&stats=1&own=1`
    
    const headers: Record<string, string> = {
      'Accept': 'application/xml, text/xml, */*',
      'User-Agent': 'GameTable/1.0 (https://gametable.fi)',
    }
    
    if (BGG_API_TOKEN) {
      headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`
    }
    
    let response = await fetch(collectionUrl, { headers, cache: 'no-store' })

    // BGG returns 202 when collection is being prepared - need to retry
    let retries = 0
    while (response.status === 202 && retries < 5) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      response = await fetch(collectionUrl, { headers, cache: 'no-store' })
      retries++
    }

    if (!response.ok) {
      if (response.status === 202) {
        return NextResponse.json({ error: 'BGG is still processing your collection. Please try again in a moment.' }, { status: 503 })
      }
      throw new Error(`BGG API error: ${response.status}`)
    }

    const xmlText = await response.text()

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xmlText)

    // Handle empty collection
    if (!result.items || !result.items.item) {
      return NextResponse.json({ items: [], message: 'No items found in collection' })
    }

    // Normalize to array
    const items = Array.isArray(result.items.item)
      ? result.items.item
      : [result.items.item]

    // Transform to our format
    const collection: BGGCollectionItem[] = items.map((item: Record<string, unknown>) => {
      const status = item.status as Record<string, unknown> || {}
      
      return {
        id: parseInt(String(item['@_objectid']), 10),
        name: String(item.name || ''),
        yearPublished: item.yearpublished ? parseInt(String(item.yearpublished), 10) : null,
        thumbnail: item.thumbnail ? String(item.thumbnail) : null,
        image: item.image ? String(item.image) : null,
        status: {
          own: status['@_own'] === '1',
          wishlist: status['@_wishlist'] === '1',
        },
        numPlays: item.numplays ? parseInt(String(item.numplays), 10) : 0,
      }
    })

    return NextResponse.json({ items: collection })
  } catch (error) {
    console.error('BGG collection error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collection from BoardGameGeek' },
      { status: 500 }
    )
  }
}
