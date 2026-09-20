import { NextRequest, NextResponse } from "next/server"

const ALLOWED_PAGE_HOSTS = new Set([
  "www.atomicmassgames.com",
  "atomicmassgames.com",
  "www.warhammer-community.com",
  "warhammer-community.com",
])

const ALLOWED_IMAGE_HOSTS = new Set([
  "cdn.svc.asmodee.net",
  "assets.warhammer-community.com",
])

async function fetchImage(imageUrl: string) {
  const response = await fetch(imageUrl, {
    headers: { "User-Agent": "GameTable Miniatures Catalog/1.0" },
    next: { revalidate: 86400 },
  })

  if (!response.ok) return null

  const contentType = response.headers.get("content-type") ?? "image/jpeg"
  if (!contentType.startsWith("image/")) return null

  return {
    body: await response.arrayBuffer(),
    contentType,
  }
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")
  if (!rawUrl) return new NextResponse("Missing url", { status: 400 })

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return new NextResponse("Invalid url", { status: 400 })
  }

  if (url.protocol !== "https:") {
    return new NextResponse("Image source not allowed", { status: 403 })
  }

  try {
    // Direct official image URL.
    if (ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
      const image = await fetchImage(url.toString())
      if (!image) return new NextResponse("Image unavailable", { status: 502 })

      return new NextResponse(image.body, {
        status: 200,
        headers: {
          "Content-Type": image.contentType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      })
    }

    // Official product/article page: resolve its og:image first.
    if (!ALLOWED_PAGE_HOSTS.has(url.hostname)) {
      return new NextResponse("Image source not allowed", { status: 403 })
    }

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

    const imageUrl = new URL(match[1], url)
    if (imageUrl.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.has(imageUrl.hostname)) {
      return new NextResponse("Invalid image source", { status: 502 })
    }

    const image = await fetchImage(imageUrl.toString())
    if (!image) return new NextResponse("Image unavailable", { status: 502 })

    return new NextResponse(image.body, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    })
  } catch {
    return new NextResponse("Image fetch failed", { status: 502 })
  }
}
