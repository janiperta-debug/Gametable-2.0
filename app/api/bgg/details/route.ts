import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

const BGG_API_TOKEN = process.env.BGG_API_TOKEN

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

function bggHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/xml, text/xml, */*',
  }
  if (BGG_API_TOKEN) {
    headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`
  }
  return headers
}

/** Resolve the primary name from a BGG item's name field (array or object). */
function primaryName(nameData: unknown): string {
  if (Array.isArray(nameData)) {
    const primary = nameData.find((n: Record<string, unknown>) => n['@_type'] === 'primary')
    return primary ? String(primary['@_value'] || '') : String(nameData[0]?.['@_value'] || '')
  }
  if (nameData && typeof nameData === 'object') {
    return String((nameData as Record<string, unknown>)['@_value'] || '')
  }
  return ''
}

type Expansion = { bggId: number; name: string; year: number | null; image: string | null }

/** Fetch year + image for a batch of expansion ids via a single `thing` call. */
async function enrichExpansions(
  base: { bggId: number; name: string }[],
): Promise<Expansion[]> {
  if (base.length === 0) return []
  // Cap the batch to keep the BGG request reasonable.
  const capped = base.slice(0, 60)
  try {
    const ids = capped.map((e) => e.bggId).join(',')
    const res = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${ids}`, {
      headers: bggHeaders(),
      cache: 'no-store',
    })
    if (!res.ok) {
      return capped.map((e) => ({ ...e, year: null, image: null }))
    }
    const parsed = parser.parse(await res.text())
    const items = parsed?.items?.item
    const list = Array.isArray(items) ? items : items ? [items] : []
    const byId = new Map<number, Record<string, unknown>>()
    for (const it of list) {
      byId.set(parseInt(String((it as Record<string, unknown>)['@_id']), 10), it as Record<string, unknown>)
    }
    return capped.map((e) => {
      const it = byId.get(e.bggId)
      const year = it?.yearpublished
        ? parseInt(String((it.yearpublished as Record<string, unknown>)['@_value']), 10)
        : null
      return {
        bggId: e.bggId,
        name: e.name,
        year: Number.isNaN(year as number) ? null : year,
        image: it?.image ? String(it.image) : it?.thumbnail ? String(it.thumbnail) : null,
      }
    })
  } catch {
    return capped.map((e) => ({ ...e, year: null, image: null }))
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 })
  }

  try {
    const bggUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`

    const response = await fetch(bggUrl, {
      headers: bggHeaders(),
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Game details temporarily unavailable' }, { status: 503 })
    }

    const xmlText = await response.text()
    const result = parser.parse(xmlText)

    if (!result.items || !result.items.item) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const item = result.items.item

    const name = primaryName(item.name)

    // Extract statistics
    const stats = item.statistics?.ratings
    const rating = stats?.average?.['@_value']
      ? parseFloat(String(stats.average['@_value']))
      : null

    // Is THIS item itself an expansion?
    const isExpansion = String(item['@_type']) === 'boardgameexpansion'

    const links = Array.isArray(item.link) ? item.link : item.link ? [item.link] : []

    // For an expansion, the INBOUND boardgameexpansion link points to its base
    // game. Grab the first one as the base.
    let baseGame: { bggId: number; name: string } | null = null
    if (isExpansion) {
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

    // Collect outbound expansion links (this base game HAS these expansions).
    const expansionLinks = links
      .filter(
        (l: Record<string, unknown>) =>
          l['@_type'] === 'boardgameexpansion' && String(l['@_inbound']) !== 'true',
      )
      .map((l: Record<string, unknown>) => ({
        bggId: parseInt(String(l['@_id']), 10),
        name: String(l['@_value'] || ''),
      }))
      .filter((e: { bggId: number }) => !Number.isNaN(e.bggId))

    // Only enrich the catalog for base games (expansions don't own expansions).
    const expansions = isExpansion ? [] : await enrichExpansions(expansionLinks)

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
      isExpansion,
      baseGame,
      expansions,
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
