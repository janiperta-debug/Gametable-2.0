import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

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

  console.log("[v0] BGG collection import called for username:", username)

  if (!username) {
    return NextResponse.json({ error: 'Username parameter is required' }, { status: 400 })
  }

  try {
    // Fetch user's collection from BGG API
    // Note: BGG collection API can be slow and may require retries
    const collectionUrl = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&stats=1&own=1`
    
    console.log("[v0] Fetching BGG collection from:", collectionUrl)
    
    let response = await fetch(collectionUrl, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    })

    console.log("[v0] BGG collection response status:", response.status)

    // BGG returns 202 when collection is being prepared - need to retry
    let retries = 0
    while (response.status === 202 && retries < 5) {
      console.log("[v0] BGG collection not ready, retrying in 2s...")
      await new Promise(resolve => setTimeout(resolve, 2000))
      response = await fetch(collectionUrl, {
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        cache: 'no-store',
      })
      retries++
      console.log("[v0] Retry", retries, "status:", response.status)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] BGG collection API error:", response.status, errorText)
      if (response.status === 202) {
        return NextResponse.json({ error: 'BGG is still processing your collection. Please try again in a moment.' }, { status: 503 })
      }
      throw new Error(`BGG API error: ${response.status}`)
    }

    const xmlText = await response.text()
    console.log("[v0] BGG collection response length:", xmlText.length)

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xmlText)

    // Handle empty collection
    if (!result.items || !result.items.item) {
      console.log("[v0] BGG collection is empty or user not found")
      return NextResponse.json({ items: [], message: 'No items found in collection' })
    }

    // Normalize to array
    const items = Array.isArray(result.items.item)
      ? result.items.item
      : [result.items.item]

    console.log("[v0] Found", items.length, "items in BGG collection")

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
    console.error('[v0] BGG collection error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collection from BoardGameGeek' },
      { status: 500 }
    )
  }
}
