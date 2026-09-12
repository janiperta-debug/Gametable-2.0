"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArchiveCard, ArchiveCardButton, ArchiveCardContent } from "@/components/archive-frame"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Store } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/i18n"
import { getMarketplaceSources, createMultidomainListing, type MarketplaceListingType, type MarketplaceCondition } from "@/app/actions/marketplace-multidomain"

export default function CreateListingPage() {
  const t = useTranslations()
  const { user, loading: userLoading } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const [sources, setSources] = useState<Awaited<ReturnType<typeof getMarketplaceSources>>["data"]>([])
  const [selected, setSelected] = useState("")
  const [listingType, setListingType] = useState<MarketplaceListingType>("sell")
  const [condition, setCondition] = useState<MarketplaceCondition>("good")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    getMarketplaceSources().then(result => {
      if (result.error) toast({ title: t("common.error"), description: result.error, variant: "destructive" })
      setSources(result.data)
      setLoading(false)
    })
  }, [user, toast, t])

  async function submit() {
    const source = sources.find(item => item.id === selected)
    if (!source) return
    setSaving(true)
    const result = await createMultidomainListing({ sourceType: source.sourceType, ownershipId: source.ownershipId, listingType, condition, price: listingType === "sell" ? Number(price) || undefined : undefined, description: description || undefined })
    setSaving(false)
    if (!result.success) return toast({ title: t("common.error"), description: result.error, variant: "destructive" })
    toast({ title: t("marketplace.listingCreated"), description: t("marketplace.listingCreatedDescription") })
    router.push("/marketplace")
  }

  const conditionLabels: Record<MarketplaceCondition, string> = {
    new: t("marketplace.conditionNew"),
    like_new: t("marketplace.likeNew"),
    good: t("marketplace.good"),
    fair: t("marketplace.fair"),
    poor: t("marketplace.poor"),
  }

  if (userLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!user) return <div className="container mx-auto px-4 py-20"><ArchiveCard><ArchiveCardContent className="p-8 text-center"><p className="mb-4">{t("marketplace.loginToCreateListing")}</p><ArchiveCardButton asChild active><Link href="/auth/login">{t("nav.login")}</Link></ArchiveCardButton></ArchiveCardContent></ArchiveCard></div>

  return <div className="container mx-auto px-4 py-20"><div className="max-w-2xl mx-auto"><ArchiveCard><ArchiveCardContent className="p-6 md:p-8 space-y-6"><div><h1 className="font-heading text-3xl text-accent-gold">{t("marketplace.createListing")}</h1><p className="text-muted-foreground">{t("marketplace.listOnMarketplace")}</p></div><div className="space-y-2"><Label>{t("marketplace.selectGame")}</Label>{loading ? <Loader2 className="animate-spin" /> : <Select value={selected} onValueChange={setSelected}><SelectTrigger><SelectValue placeholder={t("marketplace.selectGame")} /></SelectTrigger><SelectContent>{sources.map(source => <SelectItem key={source.id} value={source.id}>{source.title} — {source.subtitle}</SelectItem>)}</SelectContent></Select>}{sources.length === 0 && !loading && <p className="text-sm text-muted-foreground">{t("marketplace.noGamesInCollection")}</p>}</div><div className="space-y-2"><Label>{t("marketplace.listingType")}</Label><Select value={listingType} onValueChange={value => setListingType(value as MarketplaceListingType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sell">{t("marketplace.forSale")}</SelectItem><SelectItem value="trade">{t("marketplace.forTrade")}</SelectItem><SelectItem value="give">{t("marketplace.freeToGive")}</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>{t("marketplace.condition")}</Label><Select value={condition} onValueChange={value => setCondition(value as MarketplaceCondition)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["new", "like_new", "good", "fair", "poor"] as MarketplaceCondition[]).map(value => <SelectItem key={value} value={value}>{conditionLabels[value]}</SelectItem>)}</SelectContent></Select></div>{listingType === "sell" && <div className="space-y-2"><Label>{t("marketplace.price")} (€)</Label><Input type="number" min="0" step="0.01" value={price} onChange={event => setPrice(event.target.value)} placeholder="0.00" /></div>}<div className="space-y-2"><Label>{t("marketplace.descriptionOptional")}</Label><Textarea value={description} onChange={event => setDescription(event.target.value)} placeholder={t("marketplace.descriptionPlaceholder")} /></div><div className="flex gap-3"><ArchiveCardButton asChild fullWidth><Link href="/marketplace">{t("common.cancel")}</Link></ArchiveCardButton><ArchiveCardButton fullWidth active disabled={!selected || saving} onClick={submit} icon={saving ? <Loader2 className="animate-spin" /> : <Store />}>{saving ? t("common.loading") : t("marketplace.createListing")}</ArchiveCardButton></div></ArchiveCardContent></ArchiveCard></div></div>
}
