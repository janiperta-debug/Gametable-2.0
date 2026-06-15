import type React from "react"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

/**
 * ArchiveFrame — a fully scalable, manor-styled frame built from CSS + SVG
 * instead of a stretched PNG. It renders:
 *   - a metallic GOLD frame (gradient border-box, gives real bevel/sheen)
 *   - a warm WOOD surface with horizontal plank grain
 *   - crisp inline-SVG filigree flourishes in each corner that never distort
 *
 * This is the foundation of the planned Archive component family
 * (ArchiveButton / ArchivePanel / ArchiveCard / ArchiveWidget). Material and
 * palette are driven by CSS custom properties so additional materials
 * (e.g. patinated stone) and per-theme colors can be layered on later without
 * rewriting the markup.
 */

export type ArchiveMaterial = "wood"
export type ArchiveCornerSize = "sm" | "md"

interface ArchiveFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface material. Currently only "wood"; API reserved for future materials. */
  material?: ArchiveMaterial
  /** Render the decorative SVG corner flourishes. Defaults to true. */
  corners?: boolean
  /** Size of the corner flourishes. "md" (panels) | "sm" (buttons/toggles). */
  cornerSize?: ArchiveCornerSize
  children: React.ReactNode
}

const CORNER_DIMENSIONS: Record<ArchiveCornerSize, string> = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
}

/**
 * Ornate baroque corner flourish — filled/stroked gold scrollwork that reads
 * as carved relief. Mirrored into each corner via CSS transforms.
 */
function CornerFlourish({ className, size = "md" }: { className?: string; size?: ArchiveCornerSize }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-20",
        CORNER_DIMENSIONS[size],
        "text-[var(--archive-gold,#e8c45a)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      {/* solid corner cap */}
      <path d="M5 5c8 0 13 0 17 1-6 1-10 5-11 11-1-9-1-9-6-12z" fill="currentColor" opacity="0.95" />
      {/* outer scrolls running along the two edges */}
      <path d="M11 10c12-1 24 0 38-1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 11c-1 14 0 26-1 38" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {/* inner scroll curls */}
      <path
        d="M15 15c8-2 14 0 16 4 1.6 3-.4 6-3.4 5-2.2-.8-1.6-3.6.6-2.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M15 15c-2 8 0 14 4 16 3 1.6 6-.4 5-3.4-.8-2.2-3.6-1.6-2.8.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* little leaf sprigs */}
      <path d="M18 9c3-3 7-3 10-1M9 18c-3 3-3 7-1 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      {/* anchor stud */}
      <circle cx="10.5" cy="10.5" r="2.1" fill="currentColor" />
    </svg>
  )
}

export function ArchiveFrame({
  material = "wood",
  corners = true,
  cornerSize = "md",
  className,
  children,
  style,
  ...props
}: ArchiveFrameProps) {
  return (
    <div
      data-material={material}
      className={cn("relative isolate rounded-xl p-[4px]", className)}
      style={{
        // Metallic GOLD frame: a diagonal gradient across the border thickness
        // gives a real beveled/sheen look instead of a flat hairline.
        backgroundImage:
          "linear-gradient(135deg,#f9eebd 0%,#d4af37 22%,#8a6109 48%,#caa23f 70%,#f9eebd 100%)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(60,40,10,0.85)",
        ...style,
      }}
      {...props}
    >
      {/* WOOD surface with horizontal grain */}
      <div
        className="relative overflow-hidden rounded-[0.6rem]"
        style={{
          backgroundColor: "#4a2e1a",
          backgroundImage: [
            // soft top-down sheen
            "linear-gradient(180deg, rgba(255,235,200,0.10) 0%, rgba(0,0,0,0.45) 100%)",
            // fine HORIZONTAL grain lines
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0) 10px)",
            // plank tone variation (vertical falloff)
            "linear-gradient(0deg, #38220f 0%, #5a3a22 50%, #38220f 100%)",
          ].join(","),
          backgroundBlendMode: "overlay, overlay, normal",
          boxShadow:
            "inset 0 0 0 1px rgba(249,238,189,0.45), inset 0 2px 12px rgba(0,0,0,0.55)",
        }}
      >
        {/* inner gold hairline for the double-frame manor look */}
        <div className="pointer-events-none absolute inset-[3px] rounded-[0.45rem] border border-[var(--archive-gold,#e8c45a)]/35" />
        <div className="relative z-10">{children}</div>
      </div>

      {corners && (
        <>
          <CornerFlourish size={cornerSize} className="-left-1 -top-1" />
          <CornerFlourish size={cornerSize} className="-right-1 -top-1 -scale-x-100" />
          <CornerFlourish size={cornerSize} className="-bottom-1 -left-1 -scale-y-100" />
          <CornerFlourish size={cornerSize} className="-bottom-1 -right-1 -scale-100" />
        </>
      )}
    </div>
  )
}

/**
 * ArchiveButton — an action button that reuses the exact ArchiveFrame surface
 * (gold gradient frame + horizontal-grain wood + SVG corners) so it shares one
 * visual language with ArchivePanel. Sizing is driven by padding, so the frame
 * grows with the label and the gold border never crops the text.
 */
interface ArchiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional leading icon. */
  icon?: React.ReactNode
  /** Renders brighter to indicate the selected/active state. */
  active?: boolean
}

export const ArchiveButton = forwardRef<HTMLButtonElement, ArchiveButtonProps>(function ArchiveButton(
  { icon, active = false, children, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-block transition-transform hover:scale-[1.03] active:scale-100",
        "disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <ArchiveFrame cornerSize="sm" className={cn("rounded-lg", active && "brightness-125")}>
        <span className="flex items-center justify-center gap-2 px-7 py-2.5 font-cinzel text-xs sm:text-sm uppercase tracking-wide font-semibold text-[var(--archive-gold,#e8c45a)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {icon}
          {children}
        </span>
      </ArchiveFrame>
    </button>
  )
})

/**
 * ArchiveToggle — a segmented tab bar built on a single ArchiveFrame. The
 * active segment is marked by a recessed gold "slot" on the wood, so it reads
 * as the same archive material as ArchivePanel/ArchiveButton. Supports 2+
 * options and optional per-option icons (drop-in for FrameToggle's API).
 */
interface ArchiveToggleOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface ArchiveToggleProps<T extends string> {
  options: ArchiveToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function ArchiveToggle<T extends string>({ options, value, onChange, className }: ArchiveToggleProps<T>) {
  return (
    <ArchiveFrame cornerSize="sm" className={cn("inline-block rounded-lg", className)}>
      <div role="tablist" className="flex items-center gap-1 p-1">
        {options.map((opt) => {
          const isActive = opt.value === value
          return (
            <button
              key={opt.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(opt.value)}
              className={cn(
                "relative rounded-md px-5 py-2 font-cinzel text-xs sm:text-sm uppercase tracking-wide transition-colors whitespace-nowrap",
                isActive
                  ? "font-semibold text-[var(--archive-gold,#e8c45a)]"
                  : "text-[var(--archive-gold,#e8c45a)]/55 hover:text-[var(--archive-gold,#e8c45a)]",
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-md bg-[var(--archive-gold,#e8c45a)]/12 ring-1 ring-[var(--archive-gold,#e8c45a)]/40 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]" />
              )}
              <span className="relative flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                {opt.icon}
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>
    </ArchiveFrame>
  )
}
