"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { createGroup, type GroupCategory, type GroupVisibility } from "@/app/actions/groups"
import { ArchiveCard, ArchiveCardButton, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle, ArchiveButton, archiveField } from "@/components/archive-frame"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useTranslations } from "@/lib/i18n"

export function CreateGroupForm() {
  const t = useTranslations()
  const router = useRouter()
  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<GroupCategory>("board_game")
  const [games, setGames] = useState("")
  const [location, setLocation] = useState("")
  const [visibility, setVisibility] = useState<GroupVisibility>("public")
  const [joinPolicy, setJoinPolicy] = useState<"open" | "approval">("open")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (!name.trim() || !shortDescription.trim()) {
      setError(t("community.requiredFields"))
      return
    }
    setSaving(true)
    const result = await createGroup({
      name, short_description: shortDescription, description, category,
      game_interests: games.split(","),
      location, visibility, join_policy: visibility === "invite_only" ? "invite_only" : joinPolicy,
    })
    setSaving(false)
    if (result.id) router.push(`/groups/${result.id}`)
    else setError(t("community.createFailed"))
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <ArchiveCardButton asChild><Link href="/discover"><ArrowLeft className="mr-2 inline h-4 w-4" />{t("community.backToGroups")}</Link></ArchiveCardButton>
        <h1 className="ornate-text font-heading text-2xl font-bold">{t("community.createGroupTitle")}</h1>
      </div>
      <ArchiveCard>
        <ArchiveCardHeader><ArchiveCardTitle>{t("community.createGroupTitle")}</ArchiveCardTitle></ArchiveCardHeader>
        <ArchiveCardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>{t("community.groupName")}</Label>
              <Input value={name} onChange={e=>setName(e.target.value)} maxLength={100} required placeholder={t("community.groupNamePlaceholder")} className={archiveField} />
            </div>
            <div className="space-y-2">
              <Label>{t("community.shortDescription")}</Label>
              <Input value={shortDescription} onChange={e=>setShortDescription(e.target.value)} maxLength={180} required placeholder={t("community.shortDescriptionPlaceholder")} className={archiveField} />
              <p className="text-right text-xs text-muted-foreground">{shortDescription.length}/180</p>
            </div>
            <div className="space-y-2">
              <Label>{t("community.description")}</Label>
              <Textarea value={description} onChange={e=>setDescription(e.target.value)} rows={5} placeholder={t("community.descriptionPlaceholder")} className={archiveField} />
            </div>
            <div className="space-y-2">
              <Label>{t("community.category")}</Label>
              <select value={category} onChange={e=>setCategory(e.target.value as GroupCategory)} className={`w-full rounded-md px-3 py-2 ${archiveField}`}>
                <option value="board_game">{t("community.boardGame")}</option>
                <option value="miniature">{t("community.miniature")}</option>
                <option value="rpg">{t("community.rpg")}</option>
                <option value="trading_card">{t("community.tradingCard")}</option>
                <option value="other">{t("community.other")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("community.gameInterests")}</Label>
              <Input value={games} onChange={e=>setGames(e.target.value)} placeholder={t("community.gameInterestsPlaceholder")} className={archiveField} />
              <p className="text-xs text-muted-foreground">Erota pelit pilkuilla.</p>
            </div>
            <div className="space-y-2">
              <Label>{t("community.location")}</Label>
              <Input value={location} onChange={e=>setLocation(e.target.value)} placeholder={t("community.locationPlaceholder")} className={archiveField} />
            </div>
            <div className="space-y-3">
              <Label>{t("community.visibility")}</Label>
              <div className="space-y-2">
                {([
                  ["public", "community.public"],
                  ["private", "community.private"],
                  ["invite_only", "community.inviteOnly"],
                ] as const).map(([value,label])=>(
                  <label key={value} className="flex cursor-pointer items-start gap-3 rounded-md border border-accent-gold/30 p-3">
                    <input type="radio" name="visibility" checked={visibility===value} onChange={()=>setVisibility(value)} className="mt-1 accent-yellow-600" />
                    <span className="text-sm">{t(label)}</span>
                  </label>
                ))}
              </div>
            </div>
            {visibility !== "invite_only" ? (
              <div className="space-y-2">
                <Label>{t("community.joinPolicy")}</Label>
                <select value={joinPolicy} onChange={e=>setJoinPolicy(e.target.value as "open"|"approval")} className={`w-full rounded-md px-3 py-2 ${archiveField}`}>
                  <option value="open">{t("community.openJoin")}</option>
                  <option value="approval">{t("community.approvalJoin")}</option>
                </select>
              </div>
            ) : null}
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <div className="flex justify-end">
              <ArchiveButton type="submit" disabled={saving} active>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />{t("community.creating")}</> : t("community.create")}
              </ArchiveButton>
            </div>
          </form>
        </ArchiveCardContent>
      </ArchiveCard>
    </main>
  )
}
