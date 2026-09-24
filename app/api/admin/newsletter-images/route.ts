import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export const runtime = "nodejs"
const BUCKET = "newsletter-images"
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Kirjaudu sisään." }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Ei käyttöoikeutta." }, { status: 403 })

  const contentLength = Number(request.headers.get("content-length") || 0)
  if (contentLength > 6 * 1024 * 1024) return NextResponse.json({ error: "Kuva on liian suuri (enintään 5 Mt)." }, { status: 413 })

  let formData: FormData
  try { formData = await request.formData() }
  catch { return NextResponse.json({ error: "Kuvan käsittely epäonnistui." }, { status: 400 }) }
  const file = formData.get("image")
  if (!(file instanceof File)) return NextResponse.json({ error: "Valitse kuva." }, { status: 400 })
  const ext = EXTENSIONS[file.type]
  if (!ext || file.size === 0 || file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "Valitse JPG-, PNG-, WebP- tai GIF-kuva (enintään 5 Mt)." }, { status: 400 })

  const path = user.id + "/" + crypto.randomUUID() + "." + ext
  const service = createServiceClient()
  const { error } = await service.storage.from(BUCKET).upload(path, file, {
    contentType: file.type, cacheControl: "31536000", upsert: false,
  })
  if (error) {
    console.error("[Newsletter image] Storage upload failed:", error)
    return NextResponse.json({ error: "Kuvan tallennus epäonnistui: " + error.message }, { status: 500 })
  }
  const url = service.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  return NextResponse.json({ url })
}
