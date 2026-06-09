"use client"

import type React from "react"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { useAppTheme } from "@/components/app-theme-provider"
import { getButtonFrame, getButtonRoundFrame } from "@/lib/theme-assets"

/**
 * FrameButton — the gold image-frame button used across the themed UI.
 *
 * KEY IDEA ("the image IS the button"): the frame <img> is rendered in normal
 * flow so it dictates the button's exact size at the art's natural aspect
 * ratio — no letterboxing/empty gold space. The label/icon is then absolutely
 * overlaid and inset (percentage padding) so it always sits on the wood panel,
 * never over the ornate gold border or corner flourishes.
 *
 * Size is controlled by CSS height only, so swapping the per-theme frame art
 * keeps every button the SAME size — only the look changes.
 *
 * Variants:
 *  - "rect" : rectangular label button (Lisää peli, Suodattimet, sort)
 *  - "icon" : round/oval icon button (grid / list view toggle)
 */

type FrameButtonVariant = "rect" | "icon"
type FrameButtonSize = "sm" | "md" | "lg" | "xl"

interface FrameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: FrameButtonVariant
  size?: FrameButtonSize
  /** Renders brighter to indicate the selected/active state (like nav isActive). */
  active?: boolean
  /** Optional leading icon. */
  icon?: React.ReactNode
}

// Rect buttons are sized by PADDING (not a fixed height): the wood plate uses
// object-fill so it stretches to whatever box the label needs — height grows
// with content and the label is always centered on both axes with no distortion.
const RECT_PADDING: Record<FrameButtonSize, string> = {
  sm: "px-9 py-4",
  md: "px-11 py-5",
  lg: "px-14 py-6",
  xl: "px-16 py-7",
}
// Icon buttons keep the oval art's aspect ratio (a fixed square box reads well).
const ICON_SIZE: Record<FrameButtonSize, string> = {
  sm: "h-12 w-12",
  md: "h-14 w-14",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
}
const ICON_GLYPH: Record<FrameButtonSize, string> = {
  sm: "[&_svg]:h-4 [&_svg]:w-4",
  md: "[&_svg]:h-5 [&_svg]:w-5",
  lg: "[&_svg]:h-6 [&_svg]:w-6",
  xl: "[&_svg]:h-7 [&_svg]:w-7",
}
const RECT_TEXT: Record<FrameButtonSize, string> = {
  sm: "text-[9px] lg:text-[11px]",
  md: "text-[9px] lg:text-[11px]",
  lg: "text-[9px] lg:text-[11px]",
  xl: "text-[9px] lg:text-[11px]",
}

export const FrameButton = forwardRef<HTMLButtonElement, FrameButtonProps>(function FrameButton(
  { variant = "rect", size = "lg", active = false, icon, children, className, ...props },
  ref,
) {
  const { currentAppTheme } = useAppTheme()
  const frameSrc = variant === "icon" ? getButtonRoundFrame(currentAppTheme) : getButtonFrame(currentAppTheme)

  if (variant === "icon") {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-grid place-items-center transition-all hover:scale-105 active:scale-100 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed",
          active && "brightness-125",
          ICON_SIZE[size],
          className,
        )}
        {...props}
      >
        {/* Oval frame art fills the square box (object-fill keeps it centered) */}
        <img
          src={frameSrc || "/placeholder.svg"}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-fill pointer-events-none select-none"
        />
        {/* Glyph centered on the wood panel. Accept the icon from either the
            `icon` prop or `children` so callers can use whichever is natural. */}
        <span
          className={cn(
            "relative z-10 grid place-items-center text-accent-gold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
            ICON_GLYPH[size],
          )}
        >
          {icon ?? children}
        </span>
      </button>
    )
  }

  return (
    <button
      ref={ref}
      className={cn(
        // Padding-sized: the wood plate (object-fill) stretches to whatever box
        // the label needs, so height grows with content and the label stays
        // centered on BOTH axes. A horizontal plate stretches cleanly.
        "relative inline-flex items-center justify-center transition-all hover:scale-105 active:scale-100 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed",
        active && "brightness-125",
        RECT_PADDING[size],
        className,
      )}
      {...props}
    >
      {/* Frame art fills the button box exactly (the image IS the button). */}
      <img
        src={frameSrc || "/placeholder.svg"}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-fill pointer-events-none select-none"
      />
      {/* Label centered on the wood panel. The upward translate optically
          centers Cinzel ALL-CAPS, whose em box has extra empty space above the
          cap height — without it the text reads as bottom-aligned. */}
      <span
        className={cn(
          "relative z-10 inline-flex -translate-y-[0.16em] items-center justify-center whitespace-nowrap",
          "font-cinzel uppercase tracking-wide text-center leading-none text-accent-gold font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
          RECT_TEXT[size],
        )}
      >
        {children}
      </span>
    </button>
  )
})

/**
 * FrameToggle — a single gold frame image as the decorative container, with a
 * CSS segmented two-option toggle sitting transparently on the wood panel.
 * Width-driven (the art fills the given width) so two labels fit comfortably.
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
    <div className={cn("relative inline-block w-[22rem] max-w-full", className)}>
      {/* Frame art fills width → toggle size == image size */}
      <img
        src={frameSrc || "/placeholder.svg"}
        alt=""
        aria-hidden="true"
        className="block h-auto w-full pointer-events-none select-none"
      />
      {/* Segmented control sitting directly on the wood panel — no container
          background/border, so it reads as part of the frame. Only the active
          option gets a gold pill. */}
      <div className="absolute inset-0 flex items-center justify-center px-[14%]">
        <div role="tablist" className="inline-flex items-center gap-2">
          {options.map((opt) => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(opt.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 font-cinzel text-[9px] lg:text-[11px] uppercase tracking-wide transition-colors",
                  isActive
                    ? "bg-accent-gold text-background font-semibold shadow"
                    : "text-accent-gold/80 hover:text-accent-gold",
                )}
              >
                <span className="inline-block -translate-y-[0.16em]">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
