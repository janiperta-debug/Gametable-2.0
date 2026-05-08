import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { XMLParser } from 'fast-xml-parser'

interface RPGSearchResult {
  id: number | string
  name: string
  yearPublished: number | null
  thumbnailUrl?: string
}

// Query Supabase games table for RPGs first
async function searchSupabase(query: string): Promise<RPGSearchResult[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("games")
      .select("id, name, year_published, thumbnail_url")
      .eq("category", "rpg")
      .ilike("name", `%${query}%`)
      .limit(20)
    
    if (error) {
      console.error("Supabase RPG search error:", error)
      return []
    }
    
    return (data || []).map(game => ({
      id: game.id,
      name: game.name,
      yearPublished: game.year_published,
      thumbnailUrl: game.thumbnail_url,
    }))
  } catch (error) {
    console.error("Supabase search error:", error)
    return []
  }
}

// Save external API results to Supabase
async function saveToSupabase(results: RPGSearchResult[]): Promise<void> {
  if (results.length === 0) return
  
  try {
    const supabase = await createClient()
    
    for (const rpg of results) {
      // Check if game already exists by external_id
      const { data: existing } = await supabase
        .from("games")
        .select("id")
        .eq("external_id", String(rpg.id))
        .eq("external_source", "rpggeek")
        .single()
      
      if (!existing) {
        await supabase.from("games").insert({
          name: rpg.name,
          category: "rpg",
          external_id: String(rpg.id),
          external_source: "rpggeek",
          year_published: rpg.yearPublished,
          thumbnail_url: rpg.thumbnailUrl || null,
        })
      }
    }
  } catch (error) {
    console.error("Error saving RPGs to Supabase:", error)
  }
}

// Try multiple approaches to fetch from RPGGeek
async function fetchFromRPGG(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/xml, text/xml, */*',
      'User-Agent': 'GameTable/1.0 (https://gametable.fi)',
    },
    cache: 'no-store',
  })
  
  if (response.ok) {
    return response
  }
  
  // Retry with different user agent
  return fetch(url, {
    headers: {
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (compatible; GameTableBot/1.0)',
    },
    cache: 'no-store',
  })
}

// Fetch from RPGGeek external API
async function searchRPGGeek(query: string): Promise<RPGSearchResult[]> {
  try {
    const rpggUrl = `https://rpggeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=rpgitem`
    
    const searchResponse = await fetchFromRPGG(rpggUrl)

    if (!searchResponse.ok) {
      console.log("RPGGeek API blocked or unavailable")
      return []
    }

    const xmlText = await searchResponse.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xmlText)

    // Handle empty results
    if (!result.items || !result.items.item) {
      return []
    }

    // Normalize to array (API returns object if single result)
    const items = Array.isArray(result.items.item) 
      ? result.items.item 
      : [result.items.item]

    // Transform to our format
    return items.slice(0, 20).map((item: Record<string, unknown>) => {
      // Handle name - can be array or object
      const nameData = item.name
      let name = ''
      if (Array.isArray(nameData)) {
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
  } catch (error) {
    console.error('RPGGeek search error:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
  }

  // Step 1: Query Supabase first
  let results = await searchSupabase(query)
  
  // Step 2: If no Supabase results, call RPGGeek API
  if (results.length === 0) {
    const externalResults = await searchRPGGeek(query)
    
    // Step 3: Save external results to Supabase for future searches
    if (externalResults.length > 0) {
      // Don't await - save in background
      saveToSupabase(externalResults).catch(err => 
        console.error("Background save failed:", err)
      )
      results = externalResults
    }
  }

  // If still no results, return helpful message
  if (results.length === 0) {
    return NextResponse.json({ 
      results: [],
      note: 'No RPGs found. RPGGeek API may be temporarily unavailable. Try adding manually.'
    })
  }

  return NextResponse.json({ results })
}
