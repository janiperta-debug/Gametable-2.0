"use client"

import { useRef, useState, useTransition, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { updateGroupCoverImage } from "@/app/actions/groups"
import { ArchiveCard, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle, ArchiveButton } from "@/components/archive-frame"

export function GroupCoverUploader({ groupId, currentImageUrl }: { groupId: string; currentImageUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [preview, setPreview] = useState(currentImageUrl)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError("")
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Valitse JPG-, PNG- tai WebP-kuva.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Kuvan enimmäiskoko on 5 Mt.")
      return
    }

    setUploading(true)
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
    const filePath = `${groupId}/${crypto.randomUUID()}.${extension}`
    const supabase = createClient()
    const { error: uploadError } = await supabase.storage.from("group-covers").upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })
    if (uploadError) {
      setUploading(false)
      setError("Kuvan lataaminen epäonnistui. Yritä uudelleen.")
      return
    }

    const { data } = supabase.storage.from("group-covers").getPublicUrl(filePath)
    startTransition(async () => {
      const result = await updateGroupCoverImage(groupId, data.publicUrl)
      setUploading(false)
      if (result.error) {
        setError("Kuvan tallentaminen ryhmään epäonnistui.")
        return
      }
      setPreview(data.publicUrl)
      router.refresh()
    })
  }

  function removeImage() {
    setError("")
    startTransition(async () => {
      const result = await updateGroupCoverImage(groupId, "")
      if (result.error) {
        setError("Kuvan poistaminen epäonnistui.")
        return
      }
      setPreview(null)
      router.refresh()
    })
  }

  const busy = uploading || pending

  return (
    <ArchiveCard className="mb-6">
      <ArchiveCardHeader>
        <ArchiveCardTitle><ImagePlus className="mr-2 inline h-5 w-5" />Ryhmän kansikuva</ArchiveCardTitle>
      </ArchiveCardHeader>
      <ArchiveCardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Vaihda ryhmäsivun yläosan kuva. Ryhmän kategoriakuvake säilyy ennallaan.</p>
        {preview ? (
          <img src={preview} alt="Ryhmän nykyinen kansikuva" className="h-36 w-full rounded-lg border border-accent-gold/30 object-cover" />
        ) : (
          <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-accent-gold/30 bg-black/20 text-sm text-muted-foreground">
            Ei omaa kansikuvaa – käytössä on teeman oletuskuva.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <ArchiveButton type="button" active disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {preview ? "Vaihda kuva" : "Lataa kansikuva"}
          </ArchiveButton>
          {preview ? (
            <ArchiveButton type="button" disabled={busy} onClick={removeImage}>
              <X className="h-4 w-4" />Poista oma kuva
            </ArchiveButton>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG tai WebP · enintään 5 Mt.</p>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
