import type React from "react"
import { cn } from "@/lib/utils"

/**
 * ArchiveFrame — a fully scalable, manor-styled frame built from CSS + SVG
 * instead of a stretched PNG. It renders a wood (or future material) surface,
 * a layered gold border, and crisp inline-SVG flourishes in each corner that
 * never distort regardless of the frame's width or height.
 *
 * This is the foundation of the planned Archive component family
 * (ArchiveButton / ArchivePanel / ArchiveCard / ArchiveWidget). The material
 * and palette are driven by CSS custom properties so additional materials
 * (e.g. patinated stone) and per-theme colors can be layered on later without
 * rewriting the markup.
 */

export type ArchiveMaterial = "wood"

interface ArchiveFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface material. Currently only "wood"; API reserved for future materials. */
  material?: ArchiveMaterial
  /** Render the decorative SVG corner flourishes. Defaults to true. */
  corners?: boolean
  children: React.ReactNode
}

/** Decorative corner flourish. Mirrored per corner via CSS transforms. */
function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none absolute h-7 w-7 text-[var(--archive-gold,theme(colors.accent-gold))]", className)}
    >
      {/* L-bracket */}
      <path
        d="M4 16V8a4 4 0 0 1 4-4h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* inner accent line */}
      <path
        d="M9 19v-6a4 4 0 0 1 4-4h6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* small laurel-like leaf sprigs along both edges */}
      <path
        d="M16 5c4 .4 7 1.8 9.5 3.8M5 16c.4 4 1.8 7 3.8 9.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* corner dot */}
      <circle cx="7" cy="7" r="1.4" fill="currentColor" />
    </svg>
  )
}

export function ArchiveFrame({
  material = "wood",
  corners = true,
  className,
  children,
  style,
  ...props
}: ArchiveFrameProps) {
  return (
    <div
      data-material={material}
      className={cn(
        "relative isolate rounded-xl",
        // Layered gold border: outer ring + subtle inner highlight via ring/shadow
        "border-2 border-[var(--archive-gold,theme(colors.accent-gold))]/70",
        "shadow-[0_10px_30px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(212,175,55,0.25),inset_0_2px_10px_rgba(0,0,0,0.6)]",
        className,
      )}
      style={{
        // Wood surface built entirely in CSS: warm base + vertical plank grain.
        backgroundColor: "#3a2418",
        backgroundImage: [
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.35) 100%)",
          "repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, rgba(255,255,255,0.025) 2px, rgba(255,255,255,0) 14px)",
          "linear-gradient(90deg, #2e1b11 0%, #432a19 50%, #2e1b11 100%)",
        ].join(","),
        backgroundBlendMode: "overlay, overlay, normal",
        ...style,
      }}
      {...props}
    >
      {/* Inner gold hairline for the double-border manor look */}
      <div className="pointer-events-none absolute inset-1.5 rounded-lg border border-[var(--archive-gold,theme(colors.accent-gold))]/25" />

      {corners && (
        <>
          <CornerFlourish className="left-1 top-1" />
          <CornerFlourish className="right-1 top-1 -scale-x-100" />
          <CornerFlourish className="bottom-1 left-1 -scale-y-100" />
          <CornerFlourish className="bottom-1 right-1 -scale-100" />
        </>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
