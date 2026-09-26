"use client"

import { useState } from "react"
import { Award, FlagTriangleRight, Gem } from "lucide-react"

export type LeagueTrophyVariant = "crystal" | "pennant" | "sculpture"

/** Put transparent PNGs in public/images/awards/league/ using these exact names. */
export const leagueTrophyPaths: Record<LeagueTrophyVariant, string> = {
 crystal: "/images/awards/league/crystal.png",
 pennant: "/images/awards/league/pennant.png",
 sculpture: "/images/awards/league/sculpture.png",
}

export function isLeagueTrophyVariant(value: unknown): value is LeagueTrophyVariant {
 return value === "crystal" || value === "pennant" || value === "sculpture"
}

export function LeagueTrophyImage({ variant, className = "", iconClassName = "", alt = "" }: {
 variant: LeagueTrophyVariant; className?: string; iconClassName?: string; alt?: string
}) {
 const [missingVariant, setMissingVariant] = useState<LeagueTrophyVariant | null>(null)
 const Icon = variant === "crystal" ? Gem : variant === "pennant" ? FlagTriangleRight : Award
 return <span className={`flex items-center justify-center ${className}`}>
  {missingVariant === variant ? <Icon aria-label={alt} role={alt ? "img" : undefined} aria-hidden={!alt} strokeWidth={1.15} className={`text-accent-gold ${iconClassName}`} /> :
   <img key={variant} src={leagueTrophyPaths[variant]} alt={alt} onError={() => setMissingVariant(variant)}
    className="h-full w-full object-contain" />}
 </span>
}
