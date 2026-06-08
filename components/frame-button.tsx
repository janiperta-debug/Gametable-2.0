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
        // Sizes chosen so the frame's natural aspect ratio (~2.4:1, matching the
        // nav button) is preserved. `object-contain` keeps the art undistorted;
        // generous px keeps the label inside the frame's wood panel.
        variant === "icon" ? "h-16 w-16" : "h-16 px-12",
        className,
      )}
      {...props}
    >
      {/* Gold frame art — object-contain so the plate is never squashed/stretched */}
      <img src={frameSrc || "/placeholder.svg"} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none" />
      {/* Label / icon */}
      <span className="relative z-10 inline-flex items-center justify-center gap-2 font-cinzel text-sm sm:text-base uppercase tracking-wide text-center text-accent-gold font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {icon}
        {children}
      </span>
    </button>
  )
})

/**
 * FrameToggle — a single gold frame image acting as the decorative container,
 * with a CSS segmented two-option toggle sitting transparently inside it.
 * Matches the user's request: "css segmented toggle live inside one image".
 */
interface FrameToggleOption<T extends string> {
  value: T
  label: string
}

interface FrameToggleProps<T extends string> {
  options: [FrameToggleOption<T>, FrameToggleOption<T>]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function FrameToggle<T extends string>({ options, value, onChange, className }: FrameToggleProps<T>) {
  const { currentAppTheme } = useAppTheme()
  const frameSrc = getButtonFrame(currentAppTheme)

  return (
    <div className={cn("relative inline-flex h-20 items-center justify-center px-12", className)}>
      {/* Decorative gold frame — object-contain keeps the plate undistorted */}
      <img
        src={frameSrc || "/placeholder.svg"}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
      />
      {/* Transparent segmented toggle */}
      <div
        role="tablist"
        className="relative z-10 inline-flex items-center gap-1 rounded-full border border-accent-gold/40 bg-background/40 p-1 backdrop-blur-sm"
      >
        {options.map((opt) => {
          const isActive = opt.value === value
          return (
            <button
              key={opt.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-full px-4 py-1.5 font-cinzel text-xs sm:text-sm uppercase tracking-wide transition-colors",
                isActive
                  ? "bg-accent-gold text-background font-semibold shadow"
                  : "text-accent-gold/80 hover:text-accent-gold",
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
