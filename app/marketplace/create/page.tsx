"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArchiveCard, ArchiveCardButton, ArchiveCardContent } from "@/components/archive-frame"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Store } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/i18n"
import { createListing, type ListingType, type ListingCondition } from "@/app/actions/marketplace"
import { getMarketplaceListingGames, type ListingGameCategory } from "@/app/actions/marketplace-listing-games"

const categories: { value: ListingGameCategory; label: string }[] = [
  { value: "all" as ListingGameCategory, label: "Kaikki kategoriat" },
  { value: "board_game", label: "Lautapelit" },
  { value: "rpg", label: "Roolipelit" },
  { value: "miniature", label: "Miniatyyrit" },
  { value: "trading_card", label: "Keräilykortit" },
  { value: "other", label: "Muut" },
]

function normalizeCategory(category: string | null): ListingGameCategory {
  const value = (category || "").toLowerCase()
  if (value.includes("rpg") || value.includes("role")) return "rpg"
  if (value.includes("miniature") || value.includes("wargame")) return "miniature"
  if (value.includes("trading") || value.includes("card") || value.includes("tcg")) return "trading_card"
  if (value.includes("board") || value.includes("table")) return "board_game"
  return "other"
}

export default function CreateListingPage() {
  const t = useTranslations()
  const { user, loading: userLoading } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const [games, setGames] = useState<Awaited<ReturnType<typeof getMarketplaceListingGames>>["data"]>([])
  const [selected, setSelected] = useState("")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [listingType, setListingType] = useState<ListingType>("sell")
  const [condition, setCondition] = useState<ListingCondition>("good")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    getMarketplaceListingGames().then(result => {
      if (result.error) toast({ title: t("common.error"), description: result.error, variant: "destructive" })
      setGames(result.data)
      setLoading(false)
    })
  }, [user, toast, t])

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase()
    return games.filter(game => {
      const matchesSearch = !query || game.game?.name?.toLowerCase().includes(query)
      const matchesCategory = category === "all" || normalizeCategory(game.game?.category) === category
      return matchesSearch && matchesCategory
    })
  }, [games, search, category])

  async function submit() {
    if (!selected) return
    setSaving(true)
    const result = await createListing({
      user_game_id: selected,
      listing_type: listingType,
      condition,
      price: listingType === "sell" ? Number(price) || undefined : undefined,
      description: description || undefined,
    })
    setSaving(false)
    if (!result.success) {
      toast({ title: t("common.error"), description: result.error, variant: "destructive" })
      return
    }
    toast({ title: t("marketplace.listingCreated"), description: t("marketplace.listingCreatedDescription") })
    router.push("/marketplace")
  }

  const conditionLabels: Record<ListingCondition, string> = {
    new: t("marketplace.conditionNew"), like_new: t("marketplace.likeNew"), good: t("marketplace.good"), fair: t("marketplace.fair"), poor: t("marketplace.poor"),
  }

  if (userLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!user) return <div className="container mx-auto px-4 py-20"><ArchiveCard><ArchiveCardContent className="p-8 text-center"><p className="mb-4">{t("marketplace.loginToCreateListing")}</p><ArchiveCardButton asChild active><Link href="/auth/login">{t("nav.login")}</Link></ArchiveCardButton></ArchiveCardContent></ArchiveCard></div>

  return <div className="container mx-auto px-4 py-20"><div className="max-w-2xl mx-auto"><ArchiveCard><ArchiveCardContent className="p-6 md:p-8 space-y-6">
    <div><h1 className="font-heading text-3xl text-accent-gold">{t("marketplace.createListing")}</h1><p className="text-muted-foreground">{t("marketplace.listOnMarketplace")}</p></div>

    <div className="space-y-3"><Label>{t("marketplace.selectGame")}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Hae kokoelmastasi..." className="pl-9" /></div><Select value={category} onValueChange={setCategory}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent>{categories.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
      {loading ? <Loader2 className="animate-spin" /> : <Select value={selected} onValueChange={setSelected}><SelectTrigger className="w-full min-w-0"><SelectValue placeholder={t("marketplace.selectGame")} /></SelectTrigger><SelectContent className="max-w-[calc(100vw-3rem)]">{filteredGames.map(game => <SelectItem key={game.id} value={game.id} className="max-w-full"><span className="block max-w-[min(70vw,32rem)] truncate">{game.game?.name ?? "Unknown game"}</span></SelectItem>)}</SelectContent></Select>}
      {!loading && filteredGames.length === 0 && <p className="text-sm text-muted-foreground">Hakuehdoilla ei löytynyt pelejä.</p>}
      {!loading && games.length > 0 && <p className="text-xs text-muted-foreground">Näytetään {filteredGames.length} / {games.length} kokoelmasi peliä.</p>}
    </div>

    <div className="space-y-2"><Label>{t("marketplace.listingType")}</Label><Select value={listingType} onValueChange={value => setListingType(value as ListingType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sell">{t("marketplace.forSale")}</SelectItem><SelectItem value="trade">{t("marketplace.forTrade")}</SelectItem><SelectItem value="give">{t("marketplace.freeToGive")}</SelectItem></SelectContent></Select></div>
    <div className="space-y-2"><Label>{t("marketplace.condition")}</Label><Select value={condition} onValueChange={value => setCondition(value as ListingCondition)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["new", "like_new", "good", "fair", "poor"] as ListingCondition[]).map(value => <SelectItem key={value} value={value}>{conditionLabels[value]}</SelectItem>)}</SelectContent></Select></div>
    {listingType === "sell" && <div className="space-y-2"><Label>{t("marketplace.price")} (€)</Label><Input type="number" min="0" step="0.01" value={price} onChange={event => setPrice(event.target.value)} placeholder="0.00" /></div>}
    <div className="space-y-2"><Label>{t("marketplace.descriptionOptional")}</Label><Textarea value={description} onChange={event => setDescription(event.target.value)} placeholder={t("marketplace.descriptionPlaceholder")} /></div>
    <div className="flex flex-col sm:flex-row gap-3"><ArchiveCardButton asChild fullWidth><Link href="/marketplace">{t("common.cancel")}</Link></ArchiveCardButton><ArchiveCardButton fullWidth active disabled={!selected || saving} onClick={submit} icon={saving ? <Loader2 className="animate-spin" /> : <Store />}>{saving ? t("common.loading") : t("marketplace.createListing")}</ArchiveCardButton></div>
  </ArchiveCardContent></ArchiveCard></div></div>
}
