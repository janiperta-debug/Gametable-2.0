"use client"

import { ArchiveCard, ArchiveCardButton, ArchiveIconButton } from "@/components/archive"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Clock, Heart, ShoppingBag, Store, Puzzle, ChevronDown, Layers, Trash2, Minus, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "@/lib/i18n"
import { assertUnreachableCollectionCard, type CollectionCardItem } from "@/lib/types/collection"
import { removeCardFromCollection, updateTCGCollectionQuantity } from "@/app/actions/tcg"
import { updateMiniatureModelCount } from "@/app/actions/miniatures"

const CATEGORY_LABELS: Record<string, string> = {
  board_game: "Lautapeli",
  rpg: "Roolipeli",
  trading_card: "Keräilykortti",
  miniature: "Miniatyyri",
}

interface CollectionCardProps {
  item: CollectionCardItem
  onToggleForTrade?: (gameId: string) => void
  onToggleWishlist?: (gameId: string, domain: CollectionCardItem["entry"]["domain"]) => void
  onRemoveTCGCard?: (collectionEntryId: string) => void
  onUpdateCollection?: () => void
  showMarketplaceButton?: boolean
  showWishlistButton?: boolean
  variant?: "grid" | "list"
}

/** Shared visual skeleton for every Collection card variant. */
function CollectionCardShell({ children }: { children: React.ReactNode }) {
  return (
    <ArchiveCard className="group h-full">
      <div className="flex h-full flex-col p-4">{children}</div>
    </ArchiveCard>
  )
}

/** Shared media treatment keeps image ratio, clipping and hover behavior identical. */
function CollectionCardMedia({
  src,
  alt,
  overlay,
}: {
  src: string
  alt: string
  overlay?: React.ReactNode
}) {
  return (
    <div className="relative mb-4">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-archive-wood/40">
        <Image src={src || "/placeholder.svg"} alt={alt} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        {overlay}
      </div>
    </div>
  )
}

function CollectionCardHeading({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 font-heading text-lg font-semibold">{children}</h3>
      {badge}
    </div>
  )
}

function CollectionCardList({
  item,
  onToggleWishlist,
  showMarketplaceButton,
  showWishlistButton,
  onRemoveTCGCard,
  onUpdateCollection,
}: Pick<CollectionCardProps, "item" | "onToggleWishlist" | "onRemoveTCGCard" | "onUpdateCollection" | "showMarketplaceButton" | "showWishlistButton">) {
  const t = useTranslations()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const { card, entry } = item

  const media = (
    <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-archive-wood/40 sm:h-32 sm:w-24">
      <Image
        src={card.image || "/placeholder.svg"}
        alt={card.title}
        fill
        sizes="(min-width: 640px) 96px, 64px"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  )

  if (card.kind === "tcg") {
    const set = [card.setName, card.setCode ? `(${card.setCode})` : null].filter(Boolean).join(" ")

    return (
      <article className="group min-w-0 py-3 sm:py-4">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {media}
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="break-words font-heading text-lg font-semibold sm:text-xl">{card.title}</h3>
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {card.tcgSystem && <span className="text-accent-gold">{card.tcgSystem}</span>}
                  {card.rarity && <span className="text-accent-gold">{card.rarity}</span>}
                  {set && <span className="break-words">{set}</span>}
                  <span className="shrink-0">×{card.quantity}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <ArchiveIconButton icon={<Minus className="h-4 w-4" />} onClick={async () => {
                  const result = await updateTCGCollectionQuantity(entry.ownershipId, -1)
                  if (result.success) onUpdateCollection?.()
                  else window.alert(result.error || "Kortin määrän muuttaminen epäonnistui.")
                }} aria-label="Vähennä kortteja" title="Vähennä kortteja" />
                <span className="min-w-6 text-center text-sm text-muted-foreground">×{card.quantity}</span>
                <ArchiveIconButton icon={<Plus className="h-4 w-4" />} onClick={async () => {
                  const result = await updateTCGCollectionQuantity(entry.ownershipId, 1)
                  if (result.success) onUpdateCollection?.()
                  else window.alert(result.error || "Kortin määrän muuttaminen epäonnistui.")
                }} aria-label="Lisää kortteja" title="Lisää kortteja" />
                <ArchiveIconButton icon={<Trash2 className="h-4 w-4" />} onClick={async () => {
                  const confirmed = window.confirm("Poistetaanko kaikki tämän kortin kappaleet kokoelmasta?")
                  if (!confirmed) return
                  const ids = Array.isArray(entry.metadata.ownership_ids) ? entry.metadata.ownership_ids as string[] : [entry.ownershipId]
                  for (const id of ids) {
                    const result = await removeCardFromCollection(id)
                    if (!result.success) { window.alert(result.error || "Kortin poistaminen epäonnistui."); return }
                  }
                  onRemoveTCGCard?.(entry.ownershipId)
                }} aria-label="Poista kaikki kortit" title="Poista kaikki kortit" />
              </div>
            </div>
          </div>
        </div>
      </article>
    )
  }

  if (card.kind === "miniature") {
    return (
      <article className="group min-w-0 py-3 sm:py-4">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {media}
          <div className="min-w-0 flex-1">
            <h3 className="break-words font-heading text-lg font-semibold sm:text-xl">{card.title}</h3>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {card.system && <span className="text-accent-gold">{card.system}</span>}
              {card.faction && <span className="text-accent-gold">{card.faction}</span>}
              {card.paintStatus && <span>{card.paintStatus}</span>}
              {card.modelCount != null && (
                <span className="flex items-center gap-1">
                  <ArchiveIconButton icon={<Minus className="h-3 w-3" />} onClick={async () => {
                    const result = await updateMiniatureModelCount(entry.ownershipId, -1)
                    if (result.success) onUpdateCollection?.()
                    else window.alert(result.error || "Mallimäärän muuttaminen epäonnistui.")
                  }} aria-label="Vähennä malleja" title="Vähennä malleja" />
                  <span>{card.modelCount} models</span>
                  <ArchiveIconButton icon={<Plus className="h-3 w-3" />} onClick={async () => {
                    const result = await updateMiniatureModelCount(entry.ownershipId, 1)
                    if (result.success) onUpdateCollection?.()
                    else window.alert(result.error || "Mallimäärän muuttaminen epäonnistui.")
                  }} aria-label="Lisää malleja" title="Lisää malleja" />
                </span>
              )}
              {card.pointsTotal != null && <span>{card.pointsTotal} pts</span>
            </div>
            {showWishlistButton && (
              <div className="mt-3 flex justify-end">
                <ArchiveIconButton
                  icon={<Heart className={`h-4 w-4 ${entry.status === "wishlist" ? "fill-current" : ""}`} />}
                  active={entry.status === "wishlist"}
                  onClick={() => onToggleWishlist?.(card.id, entry.domain)}
                  aria-label={t("collection.wishlist")}
                  title={t("collection.wishlist")}
                />
              </div>
            )}
          </div>
        </div>
      </article>
    )
  }

  if (card.kind !== "board-rpg") return assertUnreachableCollectionCard(card)

  const expansions = card.expansions || []
  const ownedCount = card.ownedExpansionCount ?? expansions.filter((exp) => exp.owned).length
  const totalCount = card.totalExpansionCount ?? expansions.length

  return (
    <article className="group min-w-0 py-3 sm:py-4">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        {media}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="break-words font-heading text-lg font-semibold sm:text-xl">{card.title}</h3>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-accent-gold">{CATEGORY_LABELS[card.category] || card.category}</span>
                {card.wishlist && !card.owned && (
                  <span className="text-accent-gold">
                    <Heart className="mr-1 inline h-3 w-3 fill-current" />
                    {t("collection.wishlist")}
                  </span>
                )}
              </div>
            </div>
            <ArchiveIconButton
              icon={<Layers className="h-4 w-4" />}
              aria-label={t("collection.viewDetails")}
              title={t("collection.viewDetails")}
            />
          </div>

          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:gap-x-4">
            <span className="flex items-center gap-1 shrink-0">
              <Star className="h-4 w-4 fill-accent-gold text-accent-gold" />
              {card.rating}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Users className="h-4 w-4" />
              {card.playerCount}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="h-4 w-4" />
              {card.playTime}m
            </span>
            <span className="shrink-0">{card.yearPublished}</span>
          </div>

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
            {entry.detailTarget && (card.owned || card.wishlist) ? (
              <ArchiveCardButton asChild className="min-w-0 flex-1 sm:flex-none">
                <Link href={entry.detailTarget}>{t("collection.viewDetails")}</Link>
              </ArchiveCardButton>
            ) : (
              <ArchiveCardButton active className="min-w-0 flex-1 sm:flex-none">
                {t("collection.addToCollection")}
              </ArchiveCardButton>
            )}
            {showMarketplaceButton && card.owned && (
              <ArchiveIconButton
                icon={<Store className="h-4 w-4" />}
                onClick={() => router.push(`/marketplace/create?gameId=${card.userGameId || entry.catalogId}`)}
                title={t("marketplace.listOnMarketplace")}
                aria-label={t("marketplace.listOnMarketplace")}
              />
            )}
            {showWishlistButton && (
              <ArchiveIconButton
                icon={<Heart className={`h-4 w-4 ${card.wishlist ? "fill-current" : ""}`} />}
                active={card.wishlist}
                onClick={() => onToggleWishlist?.(card.id, entry.domain)}
                aria-label={t("collection.wishlist")}
                title={t("collection.wishlist")}
              />
            )}
          </div>

          {totalCount > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className="flex min-h-10 w-full min-w-0 items-center justify-between gap-2 border border-accent-gold/20 bg-archive-wood/30 px-3 py-2 text-sm font-body text-accent-gold transition-colors hover:bg-accent-gold/10"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Puzzle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t("game.expansionsProgress", { owned: ownedCount, total: totalCount })}</span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && (
                <ul className="mt-2 space-y-1 border-l border-accent-gold/20 pl-3">
                  {expansions.map((exp) => (
                    <li key={exp.id} className={`flex min-w-0 items-center gap-2 py-1 ${exp.owned ? "" : "opacity-40"}`}>
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-archive-wood/40">
                        <Image src={exp.image_url || "/placeholder.svg"} alt={exp.name} fill className={exp.owned ? "object-cover" : "object-cover grayscale"} />
                      </div>
                      <span className="truncate text-sm">{exp.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export function CollectionCard({
  item,
  onToggleForTrade,
  onToggleWishlist,
  showMarketplaceButton = false,
  showWishlistButton = false,
  variant = "grid",
}: CollectionCardProps) {
  if (variant === "list") {
    return (
      <CollectionCardList
        item={item}
        onToggleWishlist={onToggleWishlist}
        showMarketplaceButton={showMarketplaceButton}
        showWishlistButton={showWishlistButton}
      />
    )
  }
  const t = useTranslations()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const { card, entry } = item

  if (card.kind === "tcg") {
    const set = [card.setName, card.setCode ? `(${card.setCode})` : null].filter(Boolean).join(" ")

    return (
      <CollectionCardShell>
        <CollectionCardMedia src={card.image} alt={card.title} />
        <div className="flex flex-1 flex-col space-y-3">
          <div className="flex items-start gap-2">
            <CollectionCardHeading
              badge={
                <div className="flex flex-wrap gap-2">
                  {card.tcgSystem && <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold font-body">{card.tcgSystem}</Badge>}
                  {card.rarity && <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold font-body">{card.rarity}</Badge>}
                </div>
              }
            >
              {card.title}
            </CollectionCardHeading>
            <div className="flex shrink-0 items-center gap-1">
              <ArchiveIconButton icon={<Minus className="h-4 w-4" />} onClick={async () => {
                const result = await updateTCGCollectionQuantity(entry.ownershipId, -1)
                if (result.success) onUpdateCollection?.()
                else window.alert(result.error || "Kortin määrän muuttaminen epäonnistui.")
              }} aria-label="Vähennä kortteja" title="Vähennä kortteja" />
              <span className="min-w-6 text-center text-sm text-muted-foreground">×{card.quantity}</span>
              <ArchiveIconButton icon={<Plus className="h-4 w-4" />} onClick={async () => {
                const result = await updateTCGCollectionQuantity(entry.ownershipId, 1)
                if (result.success) onUpdateCollection?.()
                else window.alert(result.error || "Kortin määrän muuttaminen epäonnistui.")
              }} aria-label="Lisää kortteja" title="Lisää kortteja" />
            </div>
          </div>
          {(set || card.quantity > 0) && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {set && <span className="truncate">{set}</span>}
              <span className="flex shrink-0 items-center gap-1"><Layers className="h-4 w-4" />{card.quantity}</span>
            </div>
          )}
        </div>
      </CollectionCardShell>
    )
  }

  if (card.kind === "miniature") {
    return (
      <CollectionCardShell>
        <CollectionCardMedia
          src={card.image}
          alt={card.title}
          overlay={entry.status === "wishlist" ? (
            <div className="absolute right-2 top-2">
              <Badge variant="secondary" className="bg-accent-gold/90 text-background font-body">
                <Heart className="mr-1 h-3 w-3 fill-current" />{t("collection.wishlist")}
              </Badge>
            </div>
          ) : undefined}
        />
        <div className="flex flex-1 flex-col space-y-3">
          <CollectionCardHeading
            badge={
              <div className="flex flex-wrap gap-2">
                {card.system && <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold font-body">{card.system}</Badge>}
                {card.faction && <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold font-body">{card.faction}</Badge>}
                {card.isWarlord && <Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold font-body">Warlord</Badge>}
              </div>
            }
          >
            {card.title}
          </CollectionCardHeading>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {card.paintStatus && <span className="truncate">{card.paintStatus}</span>}
            <span className="flex shrink-0 items-center gap-1">
              {card.modelCount != null && <Layers className="h-4 w-4" />}
              {card.modelCount != null && (
                <>
                  <ArchiveIconButton icon={<Minus className="h-3 w-3" />} onClick={async () => {
                    const result = await updateMiniatureModelCount(entry.ownershipId, -1)
                    if (result.success) onUpdateCollection?.()
                    else window.alert(result.error || "Mallimäärän muuttaminen epäonnistui.")
                  }} aria-label="Vähennä malleja" title="Vähennä malleja" />
                  <span>{card.modelCount}</span>
                  <ArchiveIconButton icon={<Plus className="h-3 w-3" />} onClick={async () => {
                    const result = await updateMiniatureModelCount(entry.ownershipId, 1)
                    if (result.success) onUpdateCollection?.()
                    else window.alert(result.error || "Mallimäärän muuttaminen epäonnistui.")
                  }} aria-label="Lisää malleja" title="Lisää malleja" />
                </>
              )}
              {card.pointsTotal != null && ` (${card.pointsTotal} pts)`}
            </span>
          </div>
          {showWishlistButton && (
            <div className="flex justify-end pt-2">
              <ArchiveIconButton
                icon={<Heart className={`h-4 w-4 ${entry.status === "wishlist" ? "fill-current" : ""}`} />}
                active={entry.status === "wishlist"}
                onClick={() => onToggleWishlist?.(card.id, entry.domain)}
                aria-label={t("collection.wishlist")}
                title={t("collection.wishlist")}
              />
            </div>
          )}
        </div>
      </CollectionCardShell>
    )
  }

  if (card.kind !== "board-rpg") return assertUnreachableCollectionCard(card)

  const expansions = card.expansions || []
  const ownedCount = card.ownedExpansionCount ?? expansions.filter((exp) => exp.owned).length
  const totalCount = card.totalExpansionCount ?? expansions.length

  return (
    <CollectionCardShell>
      <CollectionCardMedia
        src={card.image}
        alt={card.title}
        overlay={
          <>
            {card.forTrade && <div className="absolute left-2 top-2"><Badge variant="secondary" className="bg-green-600/90 text-white font-body"><ShoppingBag className="mr-1 h-3 w-3" />For Trade</Badge></div>}
            {card.wishlist && !card.owned && <div className="absolute right-2 top-2"><Badge variant="secondary" className="bg-accent-gold/90 text-background font-body"><Heart className="mr-1 h-3 w-3 fill-current" />{t("collection.wishlist")}</Badge></div>}
          </>
        }
      />
      <div className="flex flex-1 flex-col space-y-3">
        <CollectionCardHeading badge={<Badge variant="outline" className="text-xs border-accent-gold/20 text-accent-gold font-body">{CATEGORY_LABELS[card.category] || card.category}</Badge>}>{card.title}</CollectionCardHeading>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent-gold text-accent-gold" /><span className="font-medium">{card.rating}</span></div>
          <div className="flex items-center gap-3"><span className="flex items-center gap-1"><Users className="h-4 w-4" />{card.playerCount}</span><span className="flex items-center gap-1"><Clock className="h-4 w-4" />{card.playTime}m</span></div>
        </div>
        <div className="flex gap-2 pt-2">
          {entry.detailTarget && (card.owned || card.wishlist) ? <ArchiveCardButton asChild fullWidth className="flex-1"><Link href={entry.detailTarget}>{t("collection.viewDetails")}</Link></ArchiveCardButton> : <ArchiveCardButton active fullWidth className="flex-1">{t("collection.addToCollection")}</ArchiveCardButton>}
          {showMarketplaceButton && card.owned && <ArchiveIconButton icon={<Store className="h-4 w-4" />} onClick={() => router.push(`/marketplace/create?gameId=${card.userGameId || entry.catalogId}`)} title={t("marketplace.listOnMarketplace")} aria-label={t("marketplace.listOnMarketplace")} />}
          {showWishlistButton && <ArchiveIconButton icon={<Heart className={`h-4 w-4 ${card.wishlist ? "fill-current" : ""}`} />} active={card.wishlist} onClick={() => onToggleWishlist?.(card.id, entry.domain)} aria-label={t("collection.wishlist")} />}
        </div>
        {totalCount > 0 && (
          <div className="pt-1">
            <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-accent-gold/20 bg-archive-wood/30 px-3 py-2 text-sm font-body text-accent-gold transition-colors hover:bg-accent-gold/10">
              <span className="flex items-center gap-2"><Puzzle className="h-4 w-4" />{t("game.expansionsProgress", { owned: ownedCount, total: totalCount })}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
            {expanded && <ul className="mt-2 space-y-1 border-l border-accent-gold/20 pl-3">{expansions.map((exp) => <li key={exp.id} className={`flex items-center gap-2 py-1 ${exp.owned ? "" : "opacity-40"}`}><div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-archive-wood/40"><Image src={exp.image_url || "/placeholder.svg"} alt={exp.name} fill className={`object-cover ${exp.owned ? "" : "grayscale"}`} /></div><span className="truncate text-sm">{exp.name}</span></li>)}</ul>}
          </div>
        )}
      </div>
    </CollectionCardShell>
  )
}
