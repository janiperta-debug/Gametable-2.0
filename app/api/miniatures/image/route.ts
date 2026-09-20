import { NextRequest, NextResponse } from "next/server"

const ALLOWED_HOSTS = new Set([
  "www.atomicmassgames.com",
  "atomicmassgames.com",
  "www.warhammer-community.com",
  "warhammer-community.com",
])

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")
  if (!rawUrl) return new NextResponse("Missing url", { status: 400 })

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return new NextResponse("Invalid url", { status: 400 })
  }

  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    return new NextResponse("Image source not allowed", { status: 403 })
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "GameTable Miniatures Catalog/1.0" },
      next: { revalidate: 86400 },
    })
    if (!response.ok) return new NextResponse("Image source unavailable", { status: 502 })

    const html = await response.text()
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)

    if (!match?.[1]) return new NextResponse("No og:image found", { status: 404 })

    const imageUrl = new URL(match[1], url).toString()
    if (new URL(imageUrl).protocol !== "https:") {
      return new NextResponse("Invalid image source", { status: 502 })
    }

    const imageResponse = await fetch(imageUrl, {
      headers: { "User-Agent": "GameTable Miniatures Catalog/1.0" },
      next: { revalidate: 86400 },
    })
    if (!imageResponse.ok) return new NextResponse("Image unavailable", { status: 502 })

    const contentType = imageResponse.headers.get("content-type") ?? "image/jpeg"
    if (!contentType.startsWith("image/")) return new NextResponse("Invalid image type", { status: 502 })

    return new NextResponse(await imageResponse.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    })
  } catch {
    return new NextResponse("Image fetch failed", { status: 502 })
  }
}
