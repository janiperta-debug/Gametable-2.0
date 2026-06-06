"use client"

import type React from "react"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { useAppTheme } from "@/components/app-theme-provider"
import { getButtonFrame, getButtonRoundFrame } from "@/lib/theme-assets"

/**
 * FrameButton — the gold image-frame button used in the desktop navigation,
 * extracted into a reusable component for the theme re-imagine.
 *
 * The visual is an <img> frame (per-theme, falls back to main-hall) layered
 * behind a label/icon. We keep a real <button> underneath so keyboard focus,
 * disabled state, and click semantics are preserved.
 *
 * Variants:
 *  - "rect"  : rectangular label button (Lisää peli, Näytä suodattimet, sort)
 *  - "icon"  : square/round icon button (grid / list view toggle)
 */

type FrameButtonVariant = "rect" | "icon"

interface FrameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: FrameButtonVariant
  /** Renders brighter to indicate the selected/active state (like nav isActive). */
  active?: boolean
  /** Optional leading icon. */
  icon?: React.ReactNode
}

export const FrameButton = forwardRef<HTMLButtonElement, FrameButtonProps>(function FrameButton(
  { variant = "rect", active = false, icon, children, className, ...props },
  ref,
) {
  const { currentAppTheme } = useAppTheme()
  const frameSrc = variant === "icon" ? getButtonRoundFrame(currentAppTheme) : getButtonFrame(currentAppTheme)

  return (
    <button
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center transition-all hover:scale-105 active:scale-100 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed",
        active && "brightness-125",
        variant === "icon" ? "w-12 h-12" : "h-12 px-6 min-w-[7rem]",
        className,
      )}
      {...props}
    >
      {/* Gold frame art */}
      <img src={frameSrc || "/placeholder.svg"} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" />
      {/* Label / icon */}
      <span className="relative z-10 inline-flex items-center justify-center gap-2 font-cinzel text-xs sm:text-sm uppercase tracking-wide text-center text-accent-gold font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {icon}
        {children}
      </span>
    </button>
  )
})
