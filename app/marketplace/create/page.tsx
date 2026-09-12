"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2, Store } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  ArchiveCard,
  ArchiveCardButton,
  ArchiveCardContent,
  ArchiveIconButton,
  archiveField,
  archiveSelectContent,
  archiveSelectItem,
} from "@/components/archive-frame"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createMultidomainListing, getMarketplaceSources, type MarketplaceSource } from "@/app/actions/marketplace-multidomain"
import type { ListingCondition, ListingType } from "@/app/actions/marketplace"

type SourceFilter = "all" | "board_game" | "tcg" | "miniature"

export default function CreateListingPage() {
  const t = useTranslations()
  const { user, loading: userLoading } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselected = searchParams.get("sourceId")
  const [sources, setSources] = useState<MarketplaceSource[]>([])
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [selectedSourceId, setSelectedSourceId] = useState(preselected || "")
  const [loadingSources, setLoadingSources] = useState(true)
  const [listingType, setListingType] = useState<ListingType>("sell")
  const [condition, setCondition] = useState<ListingCondition>("good")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!user) return
    getMarketplaceSources().then((result) => {
      if (result.error) toast({ title: t("common.error"), description: result.error, variant: "destructive" })
      else {
        setSources(result.data)
        if (preselected && result.data.some((source) => source.id === preselected)) setSelectedSourceId(preselected)
      }
      setLoadingSources(false)
    })
  }, [user, preselected, t, toast])

  const visibleSources = sources.filter((source) => sourceFilter === "all" || source.sourceType === sourceFilter)
  const selectedSource = sources.find((source) => source.id === selectedSourceId)

  async function handleCreateListing() {
    if (!selectedSource) return
    setCreating(true)
    const result = await createMultidomainListing({
      sourceType: selectedSource.sourceType,
      ownershipId: selectedSource.ownershipId,
      listingType,
      condition,
      price: listingType === "sell" ? Number(price) || undefined : undefined,
      description: description || undefined,
    })
    setCreating(false)
    if (!result.success) {
      toast({ title: t("common.error"), description: result.error || "Failed to create listing", variant: "destructive" })
      return
    }
    toast({ title: t("marketplace.listingCreated"), description: t("marketplace.listingCreatedDescription") || "Your item is now listed on the marketplace." })
    router.push("/marketplace")
  }

  if (userLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent-gold" /></div>
  if (!user) return <div className="container mx-auto px-4 py-8 pt-20"><ArchiveCard className="max-w-md mx-auto text-center"><ArchiveCardContent className="p-8"><Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-heading text-2xl mb-2">{t("auth.loginRequired")}</h2><p className="text-muted-foreground mb-4">{t("marketplace.loginToCreateListing")}</p><ArchiveCardButton asChild active><Link href="/auth/login">{t("auth.login")}</Link></ArchiveCardButton></ArchiveCardContent></ArchiveCard></div>

  return <div className="container mx-auto px-4 py-8 pt-20">
    <div className="flex items-center gap-4 mb-8"><ArchiveIconButton icon={<ArrowLeft className="h-5 w-5" />} aria-label={t("common.cancel")} onClick={() => router.push("/marketplace")} /><div><h1 className="font-heading text-3xl md:text-4xl text-accent-gold">{t("marketplace.createListing")}</h1><p className="text-muted-foreground font-body">{t("marketplace.createListingDescription") || "List an item from your collection on the marketplace"}</p></div></div>
    <div className="max-w-2xl mx-auto"><ArchiveCard><ArchiveCardContent className="p-6 md:p-8 space-y-6">
      <div className="space-y-3"><Label className="font-heading text-lg">{t("marketplace.selectGameFromCollection") || "Select from your collection"}</Label>
        <div className="flex flex-wrap gap-2"><ArchiveCardButton active={sourceFilter === "all"} onClick={() => setSourceFilter("all")}>All</ArchiveCardButton><ArchiveCardButton active={sourceFilter === "board_game"} onClick={() => setSourceFilter("board_game")}>Board games & RPG</ArchiveCardButton><ArchiveCardButton active={sourceFilter === "tcg"} onClick={() => setSourceFilter("tcg")}>TCG</ArchiveCardButton><ArchiveCardButton active={sourceFilter === "miniature"} onClick={() => setSourceFilter("miniature")}>Miniatures</ArchiveCardButton></div>
        {loadingSources ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-accent-gold" /></div> : visibleSources.length === 0 ? <p className="text-muted-foreground py-6">{t("marketplace.noGamesInCollection") || "No eligible items in your collection."}</p> : <Select value={selectedSourceId} onValueChange={setSelectedSourceId}><SelectTrigger className={cn("h-14", archiveField)}><SelectValue placeholder={t("marketplace.selectGame")} /></SelectTrigger><SelectContent className={archiveSelectContent}>{visibleSources.map((source) => <SelectItem key={source.id} value={source.id} className={cn("py-3", archiveSelectItem)}><div className="flex items-center gap-3">{source.image && <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0"><Image src={source.image} alt={source.title} fill className="object-cover" /></div>}<div><div>{source.title}</div><div className="text-xs text-muted-foreground">{source.subtitle}</div></div></div></SelectItem>)}</SelectContent></Select>}
        {selectedSource && <div className="p-4 bg-black/30 rounded-lg"><p className="font-heading font-medium">{selectedSource.title}</p><p className="text-sm text-muted-foreground">{selectedSource.subtitle}</p></div>}
      </div>
      <div className="space-y-3"><Label className="font-heading text-lg">{t("marketplace.listingType")}</Label><Select value={listingType} onValueChange={(v) => setListingType(v as ListingType)}><SelectTrigger className={cn("h-12", archiveField)}><SelectValue /></SelectTrigger><SelectContent className={archiveSelectContent}><SelectItem value="sell" className={archiveSelectItem}>{t("marketplace.forSale")}</SelectItem><SelectItem value="trade" className={archiveSelectItem}>{t("marketplace.forTrade")}</SelectItem><SelectItem value="give" className={archiveSelectItem}>{t("marketplace.freeToGive")}</SelectItem></SelectContent></Select></div>
      <div className="space-y-3"><Label className="font-heading text-lg">{t("marketplace.condition")}</Label><Select value={condition} onValueChange={(v) => setCondition(v as ListingCondition)}><SelectTrigger className={cn("h-12", archiveField)}><SelectValue /></SelectTrigger><SelectContent className={archiveSelectContent}>{(["new", "like_new", "good", "fair", "poor"] as ListingCondition[]).map((value) => <SelectItem key={value} value={value} className={archiveSelectItem}>{value.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
      {listingType === "sell" && <div className="space-y-3"><Label className="font-heading text-lg">{t("marketplace.price")}</Label><Input type="number" min="0" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className={cn("h-12", archiveField)} /></div>}
      <div className="space-y-3"><Label className="font-heading text-lg">{t("marketplace.descriptionOptional")}</Label><Textarea placeholder={t("marketplace.descriptionPlaceholder")} value={description} onChange={(e) => setDescription(e.target.value)} className={cn("min-h-[120px]", archiveField)} /></div>
      <div className="flex flex-col sm:flex-row gap-3 pt-4"><ArchiveCardButton asChild fullWidth className="flex-1"><Link href="/marketplace">{t("common.cancel")}</Link></ArchiveCardButton><ArchiveCardButton active fullWidth className="flex-1" onClick={handleCreateListing} disabled={creating || !selectedSource} icon={creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}>{t("marketplace.createListing")}</ArchiveCardButton></div>
    </ArchiveCardContent></ArchiveCard></div>
  </div>
}
