import type React from "react"
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

interface ArchiveFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface material. Currently only "wood"; API reserved for future materials. */
  material?: ArchiveMaterial
  /** Render the decorative SVG corner flourishes. Defaults to true. */
  corners?: boolean
  children: React.ReactNode
}

/**
 * Ornate baroque corner flourish — filled/stroked gold scrollwork that reads
 * as carved relief. Mirrored into each corner via CSS transforms.
 */
function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-20 h-10 w-10",
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
          <CornerFlourish className="-left-1 -top-1" />
          <CornerFlourish className="-right-1 -top-1 -scale-x-100" />
          <CornerFlourish className="-bottom-1 -left-1 -scale-y-100" />
          <CornerFlourish className="-bottom-1 -right-1 -scale-100" />
        </>
      )}
    </div>
  )
}
