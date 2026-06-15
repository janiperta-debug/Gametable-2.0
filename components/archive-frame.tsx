import type React from "react"
import { forwardRef, useId } from "react"
import { Slot } from "@radix-ui/react-slot"
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
export type ArchiveWeight = "regular" | "thin" | "hairline"

interface ArchiveFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface material. Currently only "wood"; API reserved for future materials. */
  material?: ArchiveMaterial
  /** Render the decorative SVG corner flourishes. Defaults to true. */
  corners?: boolean
  /** Size of the corner flourishes. "md" (panels) | "sm" (buttons/toggles). */
  cornerSize?: ArchiveCornerSize
  /** Frame-band thickness. "regular" for large elements (panels/cards),
   *  "thin" for compact controls (buttons/toggles). Defaults to "regular". */
  weight?: ArchiveWeight
  /** Render the subtle palmette ornaments centered on the top/bottom edges.
   *  Defaults to true for "md" corners (panels), false for "sm" (buttons). */
  centerOrnaments?: boolean
  children: React.ReactNode
}

const CORNER_DIMENSIONS: Record<ArchiveCornerSize, string> = {
  sm: "h-7 w-7",
  md: "h-12 w-12",
}

/** Frame-band geometry per weight: outer gold pad, dark channel inset, and the
 *  two inner hairlines. "thin" keeps compact controls from looking heavy. */
const WEIGHT_STYLE: Record<
  ArchiveWeight,
  { pad: string; outerRadius: string; channelInset: number; channelRadius: string; surfaceRadius: string }
> = {
  regular: { pad: "p-[5px]", outerRadius: "rounded-xl", channelInset: 2, channelRadius: "rounded-[0.62rem]", surfaceRadius: "rounded-[0.5rem]" },
  thin: { pad: "p-[3px]", outerRadius: "rounded-lg", channelInset: 1, channelRadius: "rounded-[0.5rem]", surfaceRadius: "rounded-[0.4rem]" },
  hairline: { pad: "p-[2px]", outerRadius: "rounded-md", channelInset: 1, channelRadius: "rounded-[0.4rem]", surfaceRadius: "rounded-[0.3rem]" },
}

/**
 * Ornate baroque corner flourish — layered gold scrollwork with an antique
 * gradient fill so it reads as aged, carved relief. Mirrored into each corner
 * via CSS transforms.
 */
function CornerFlourish({ id, className, size = "md" }: { id: string; className?: string; size?: ArchiveCornerSize }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none absolute z-20", CORNER_DIMENSIONS[size], className)}
      style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.7))" }}
    >
      <defs>
        <linearGradient id={`${id}-cg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4e3a8" />
          <stop offset="34%" stopColor="#d8b25a" />
          <stop offset="62%" stopColor="#9a7320" />
          <stop offset="100%" stopColor="#6b4a08" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}-cg)`} stroke={`url(#${id}-cg)`}>
        {/* solid carved corner cap */}
        <path
          d="M4 4c10 0 16 0 22 1.4-7 1.2-12 6-13 13C11.8 8.4 11.8 8.4 4 4z"
          stroke="none"
          opacity="0.98"
        />
        {/* double scroll running along the two outer edges */}
        <path d="M12 9c14-1 28 0 46-1" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <path d="M9 12c-1 16 0 30-1 46" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <path d="M14 13c12-1 24 0 40-1" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M13 14c-1 14 0 26-1 40" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.7" />
        {/* large inner volute (the showpiece curl) */}
        <path
          d="M17 17c11-2 19 1 22 6 2.2 4-.6 8-4.6 6.6-3-1-2.2-5 .8-3.8"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M17 17c-2 11 1 19 6 22 4 2.2 8-.6 6.6-4.6-1-3-5-2.2-3.8.8"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* acanthus leaf sprigs fanning off the corner */}
        <path
          d="M22 8c4-3.4 9-3.4 13-1.2M8 22c-3.4 4-3.4 9-1.2 13"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M30 7c3-2 6.5-2 9.5-.6M7 30c-2 3-2 6.5-.6 9.5"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {/* anchor stud + tiny accent bead */}
        <circle cx="9" cy="9" r="2.4" stroke="none" />
        <circle cx="29" cy="29" r="1.5" stroke="none" opacity="0.85" />
      </g>
    </svg>
  )
}

/**
 * CenterFlourish — a small symmetric palmette/fleur seated on the mid-point of
 * an edge, echoing the reference frame's top & bottom center ornaments. Kept
 * deliberately subtle so it enriches rather than clutters the frame.
 */
function CenterFlourish({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 24"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none absolute left-1/2 z-20 h-5 w-10 -translate-x-1/2", className)}
      style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.7))" }}
    >
      <defs>
        <linearGradient id={`${id}-mg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e3a8" />
          <stop offset="55%" stopColor="#c9a14a" />
          <stop offset="100%" stopColor="#7c5710" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}-mg)`} stroke={`url(#${id}-mg)`}>
        {/* central bud */}
        <path d="M24 4c2.4 0 4 2 4 4.5S26 13 24 13s-4-2-4-4.5S21.6 4 24 4z" stroke="none" />
        {/* symmetric side scrolls */}
        <path d="M23 11c-4 1-7 3-10 3 3 .6 6-.4 9-2.4" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M25 11c4 1 7 3 10 3-3 .6-6-.4-9-2.4" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path d="M20 9c-3-.6-5.5-2-8-2M28 9c3-.6 5.5-2 8-2" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.8" />
        <circle cx="24" cy="8.2" r="1.2" stroke="none" />
      </g>
    </svg>
  )
}

export function ArchiveFrame({
  material = "wood",
  corners = true,
  cornerSize = "md",
  weight = "regular",
  centerOrnaments,
  className,
  children,
  style,
  ...props
}: ArchiveFrameProps) {
  const uid = useId()
  const showCenter = centerOrnaments ?? cornerSize === "md"
  const w = WEIGHT_STYLE[weight]
  return (
    <div
      data-material={material}
      className={cn("relative isolate", w.outerRadius, w.pad, className)}
      style={{
        // Outer ANTIQUE-GOLD frame: a muted, aged gradient across the border
        // thickness gives a real beveled/sheen look without the bright "new
        // brass" tone. Darker stops read as tarnish in the recesses.
        backgroundImage:
          "linear-gradient(135deg,#e7d49a 0%,#b8902f 24%,#5f4308 50%,#9c7a28 72%,#dcc384 100%)",
        boxShadow: "0 14px 34px rgba(0,0,0,0.65), 0 0 0 1px rgba(45,30,8,0.9)",
        ...style,
      }}
      {...props}
    >
      {/* Thin dark channel separating the two gold frames (the "double frame") */}
      <div
        className={cn("relative overflow-hidden", w.channelRadius)}
        style={{ boxShadow: `inset 0 0 0 ${w.channelInset}px rgba(40,26,10,0.85)` }}
      >
        {/* WOOD surface — deeper, richer plank with horizontal grain */}
        <div
          className={cn("relative overflow-hidden", w.surfaceRadius)}
          style={{
            backgroundColor: "#2b190c",
            backgroundImage: [
              // soft top-down sheen
              "linear-gradient(180deg, rgba(255,225,180,0.10) 0%, rgba(0,0,0,0.55) 100%)",
              // fine HORIZONTAL grain hairlines
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, rgba(255,235,200,0.025) 2px, rgba(255,235,200,0) 9px)",
              // broader HORIZONTAL plank streaks for depth
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0) 14px, rgba(120,80,40,0.12) 22px, rgba(0,0,0,0) 30px)",
              // deep plank tone falloff
              "linear-gradient(0deg, #1f1107 0%, #4a2c16 50%, #23140a 100%)",
            ].join(","),
            backgroundBlendMode: "overlay, overlay, soft-light, normal",
            boxShadow: "inset 0 0 0 1px rgba(231,212,154,0.5), inset 0 3px 16px rgba(0,0,0,0.65)",
          }}
        >
          {/* inner gold beaded hairline — second visible gold line of the double frame */}
          <div
            className={cn(
              "pointer-events-none absolute rounded-[0.4rem] border border-[var(--archive-gold,#d9b65c)]/45",
              weight === "regular" ? "inset-[3px]" : weight === "thin" ? "inset-[2px]" : "inset-[1.5px]",
            )}
          />
          {weight === "regular" && (
            <div className="pointer-events-none absolute inset-[5px] rounded-[0.34rem] border border-black/30" />
          )}
          <div className="relative z-10">{children}</div>
        </div>
      </div>

      {showCenter && (
        <>
          <CenterFlourish id={`${uid}-mt`} className="-top-2.5" />
          <CenterFlourish id={`${uid}-mb`} className="-bottom-2.5 rotate-180" />
        </>
      )}

      {corners && (
        <>
          <CornerFlourish id={`${uid}-tl`} size={cornerSize} className="-left-1.5 -top-1.5" />
          <CornerFlourish id={`${uid}-tr`} size={cornerSize} className="-right-1.5 -top-1.5 -scale-x-100" />
          <CornerFlourish id={`${uid}-bl`} size={cornerSize} className="-bottom-1.5 -left-1.5 -scale-y-100" />
          <CornerFlourish id={`${uid}-br`} size={cornerSize} className="-bottom-1.5 -right-1.5 -scale-100" />
        </>
      )}
    </div>
  )
}

interface ArchiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional leading icon. */
  icon?: React.ReactNode
  /** Renders brighter to indicate the selected/active state. */
  active?: boolean
  /** Stretch to fill the available width (e.g. paired card actions). */
  fullWidth?: boolean
  /** Render as a Slot so the child (e.g. a Link) becomes the interactive element. */
  asChild?: boolean
}

/** Per-variant frame config so the two button tiers can't visually drift apart. */
const BUTTON_VARIANT = {
  /** Tabs + standalone action buttons: thin double frame + corner flourishes. */
  button: { weight: "thin" as ArchiveWeight, corners: true, pad: "px-7 py-2.5" },
  /** Buttons living inside a card: hairline frame, NO corners, so they don't
   *  fight with the card's own ornate frame. */
  cardbutton: { weight: "hairline" as ArchiveWeight, corners: false, pad: "px-6 py-2" },
}

function makeArchiveButton(variant: keyof typeof BUTTON_VARIANT, displayName: string) {
  const cfg = BUTTON_VARIANT[variant]
  const Component = forwardRef<HTMLButtonElement, ArchiveButtonProps>(function ArchiveButtonBase(
    { icon, active = false, fullWidth = false, asChild = false, children, className, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref as never}
        className={cn(
          "transition-transform hover:scale-[1.03] active:scale-100",
          "disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed",
          fullWidth ? "block w-full" : "inline-block",
          className,
        )}
        {...props}
      >
        <ArchiveFrame
          weight={cfg.weight}
          corners={cfg.corners}
          cornerSize="sm"
          className={cn(fullWidth && "w-full", "rounded-lg", active && "brightness-125")}
        >
          <span
            className={cn(
              "flex items-center justify-center gap-2 font-cinzel text-xs sm:text-sm uppercase tracking-wide font-semibold",
              "text-[var(--archive-gold,#d9b65c)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]",
              cfg.pad,
            )}
          >
            {icon}
            {children}
          </span>
        </ArchiveFrame>
      </Comp>
    )
  })
  Component.displayName = displayName
  return Component
}

/**
 * ArchiveButton (tier: "button") — standalone action button + tab segments.
 * Thin double frame with corner flourishes, sharing the ArchivePanel language.
 */
export const ArchiveButton = makeArchiveButton("button", "ArchiveButton")

/**
 * ArchiveCardButton (tier: "cardbutton") — for buttons placed inside a card.
 * Hairline frame and no corner flourishes so it reads as a quieter control that
 * doesn't compete with the surrounding ArchiveCard frame.
 */
export const ArchiveCardButton = makeArchiveButton("cardbutton", "ArchiveCardButton")

interface ArchiveIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon to render (e.g. a lucide icon at h-4 w-4). */
  icon: React.ReactNode
  /** Renders brighter to indicate the selected/active state (e.g. wishlisted). */
  active?: boolean
  /** Render as a Slot so the child (e.g. a Link) becomes the interactive element. */
  asChild?: boolean
}

/**
 * ArchiveIconButton — a compact square icon control on the "cardbutton" tier
 * (hairline frame, no corner flourishes). Pairs with ArchiveCardButton for
 * icon-only actions inside cards (marketplace, wishlist, kebab menus, steppers).
 */
export const ArchiveIconButton = forwardRef<HTMLButtonElement, ArchiveIconButtonProps>(function ArchiveIconButton(
  { icon, active = false, asChild = false, className, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref as never}
      className={cn(
        "inline-block transition-transform hover:scale-[1.06] active:scale-100",
        "disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <ArchiveFrame weight="hairline" corners={false} className={cn("rounded-lg", active && "brightness-125")}>
        <span className="flex h-9 w-9 items-center justify-center text-[var(--archive-gold,#d9b65c)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {icon}
        </span>
      </ArchiveFrame>
    </Comp>
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
    <ArchiveFrame weight="thin" cornerSize="sm" className={cn("inline-block rounded-lg", className)}>
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
                  ? "font-semibold text-[var(--archive-gold,#d9b65c)]"
                  : "text-[var(--archive-gold,#d9b65c)]/55 hover:text-[var(--archive-gold,#d9b65c)]",
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-md bg-[var(--archive-gold,#d9b65c)]/12 ring-1 ring-[var(--archive-gold,#d9b65c)]/40 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]" />
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

/**
 * ArchiveCard — a content card built on the full-weight ArchiveFrame so it
 * shares the manor language with ArchivePanel. A faint inner scrim sits over
 * the wood so body text and form controls stay legible without flattening the
 * material. Pairs with ArchiveCardHeader / ArchiveCardTitle / ArchiveCardContent
 * (a drop-in shape for shadcn's Card subcomponents).
 */
interface ArchiveCardProps extends Omit<ArchiveFrameProps, "weight"> {
  /** Dim the wood behind the content for legibility. Defaults to true. */
  scrim?: boolean
}

export function ArchiveCard({ scrim = true, className, children, ...props }: ArchiveCardProps) {
  return (
    <ArchiveFrame className={cn("rounded-xl", className)} {...props}>
      <div className="relative">
        {scrim && (
          <div className="pointer-events-none absolute inset-0 z-0 rounded-[0.34rem] bg-gradient-to-b from-black/35 to-black/55" />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    </ArchiveFrame>
  )
}

export function ArchiveCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-5 pb-3", className)} {...props} />
}

export function ArchiveCardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-cinzel text-lg font-bold uppercase tracking-wide",
        "text-[var(--archive-gold,#d9b65c)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]",
        className,
      )}
      {...props}
    />
  )
}

export function ArchiveCardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />
}

/**
 * archiveField (tier: "input") — shared className for form controls
 * (Input / SelectTrigger) placed on an archive surface. The thinnest tier: a
 * single crisp gold hairline (no double frame, no corners) around a recessed
 * dark slot, so inputs read as the quietest member of the Archive family while
 * still clearly gold. `!border-*` overrides shadcn's default maroon border-input.
 */
export const archiveField = cn(
  "bg-black/50 border !border-[rgba(217,182,92,0.55)]",
  "text-foreground placeholder:text-[var(--archive-gold,#d9b65c)]/40",
  "shadow-[inset_0_1px_5px_rgba(0,0,0,0.6)]",
  "focus-visible:ring-1 focus-visible:ring-[var(--archive-gold,#d9b65c)]/60",
  "focus-visible:!border-[rgba(217,182,92,0.85)]",
)

/**
 * archiveSelectContent — className for a Select/dropdown panel. Edges read like
 * the "cardbutton" tier (hairline gold rim on a dark recessed surface) while the
 * interior hosts crest-menu-style options. Apply to <SelectContent>.
 */
export const archiveSelectContent = cn(
  "bg-[#1f1206]/95 backdrop-blur-sm",
  "border !border-[rgba(217,182,92,0.55)]",
  "shadow-[0_12px_30px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(0,0,0,0.4)]",
)

/**
 * archiveSelectItem — className for each option, matching the crest-menu rows:
 * gold-tinted label, gold-wash hover/highlight, subtle rounding. Apply to
 * <SelectItem>.
 */
export const archiveSelectItem = cn(
  "font-merriweather text-foreground rounded-md",
  "focus:bg-[var(--archive-gold,#d9b65c)]/15 focus:text-[var(--archive-gold,#d9b65c)]",
  "data-[state=checked]:text-[var(--archive-gold,#d9b65c)] data-[state=checked]:font-semibold",
)
