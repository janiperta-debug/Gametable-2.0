import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { XMLParser } from 'fast-xml-parser'

const BGG_API_TOKEN = process.env.BGG_API_TOKEN

interface RPGSearchResult {
  id: number | string
  name: string
  yearPublished: number | null
  thumbnailUrl?: string
}

// Query Supabase games table for RPGs
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

// Save RPG results to Supabase
async function saveToSupabase(results: RPGSearchResult[], source: string): Promise<void> {
  if (results.length === 0) return
  
  try {
    const supabase = await createClient()
    
    for (const rpg of results) {
      // Check if game already exists by external_id
      const { data: existing } = await supabase
        .from("games")
        .select("id")
        .eq("external_id", String(rpg.id))
        .eq("external_source", source)
        .single()
      
      if (!existing) {
        await supabase.from("games").insert({
          name: rpg.name,
          category: "rpg",
          external_id: String(rpg.id),
          external_source: source,
          year_published: rpg.yearPublished,
          thumbnail_url: rpg.thumbnailUrl || null,
        })
      }
    }
  } catch (error) {
    console.error("Error saving RPGs to Supabase:", error)
  }
}

// Search RPGGeek API directly
async function searchRPGGeek(query: string): Promise<RPGSearchResult[]> {
  try {
    // Use rpggeek.com with type=rpgitem
    const rpggUrl = `https://rpggeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=rpgitem`
    
    const headers: Record<string, string> = {
      'Accept': 'application/xml, text/xml, */*',
    }
    
    if (BGG_API_TOKEN) {
      headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`
    }
    
    const response = await fetch(rpggUrl, {
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      console.log("RPGGeek search failed with status:", response.status)
      return []
    }

    const xmlText = await response.text()
    
    // Check if response is valid XML
    if (!xmlText || xmlText.length < 50 || xmlText.includes('Just a moment')) {
      console.log("RPGGeek returned invalid response")
      return []
    }
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })
    const result = parser.parse(xmlText)

    if (!result.items || !result.items.item) {
      return []
    }

    const items = Array.isArray(result.items.item) 
      ? result.items.item 
      : [result.items.item]

    return items.slice(0, 20).map((item: Record<string, unknown>) => {
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
  
  // Step 2: If no Supabase results, try RPGGeek API
  if (results.length === 0) {
    const externalResults = await searchRPGGeek(query)
    
    // Save external results to Supabase for future searches
    if (externalResults.length > 0) {
      saveToSupabase(externalResults, "rpggeek").catch(err => 
        console.error("Background save failed:", err)
      )
      results = externalResults
    }
  }

  // If still no results, return helpful message
  if (results.length === 0) {
    return NextResponse.json({ 
      results: [],
      note: 'No RPGs found. Try a different search term or add the RPG manually.'
    })
  }

  return NextResponse.json({ results })
}
