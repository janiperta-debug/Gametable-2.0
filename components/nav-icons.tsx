import type { SVGProps } from "react"

/**
 * Archive navigation icon set.
 *
 * All icons are line-art SVGs drawn on a 24x24 viewBox using `currentColor`,
 * so they inherit the active theme's accent color (e.g. --accent-gold) and
 * scale crisply at any size. Based on the Archive Icon concept sheet.
 */

type IconProps = SVGProps<SVGSVGElement>

const baseProps = (props: IconProps): IconProps => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
})

/** Collection / Pelit — d20 with inner facets + pawn + cards. */
export function GamesIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* card stack behind, to the right */}
      <path d="M15.5 6.5l3.7 1.4a1 1 0 0 1 .6 1.3l-2.3 6a1 1 0 0 1-1.3.6l-1.2-.5" />
      {/* d20 hexagon */}
      <path d="M9 3.2l5 1.9a1.4 1.4 0 0 1 .9 1.3v5.6a1.4 1.4 0 0 1-.9 1.3l-5 1.9a1.4 1.4 0 0 1-1 0l-5-1.9A1.4 1.4 0 0 1 2 13V7.4a1.4 1.4 0 0 1 .9-1.3l5-1.9a1.4 1.4 0 0 1 1 0Z" />
      {/* d20 inner facets */}
      <path d="M2.4 6.6l6.1 2.3 6.1-2.3M8.5 8.9v6.6M8.5 8.9 4.3 5.2M8.5 8.9l4.2-3.7" />
      {/* pawn in front */}
      <path d="M12 21.5h6M13 21.5c.3-1.6 1.4-2.3 2-3.1.5-.7.5-1.7-.2-2.3a1.8 1.8 0 0 0-2.6 0c-.7.6-.7 1.6-.2 2.3.6.8 1.7 1.5 2 3.1" />
      <circle cx="15" cy="13.4" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Discover / Yhteisö — three figures inside a laurel. */
export function CommunityIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* laurel arcs */}
      <path d="M5 5.5A9 9 0 0 0 3.5 14M3.5 8.3l1.6.6M4.2 11.3l1.7.4M19 5.5A9 9 0 0 1 20.5 14M20.5 8.3l-1.6.6M19.8 11.3l-1.7.4" />
      {/* center figure */}
      <circle cx="12" cy="8" r="2.1" />
      <path d="M8.4 15.2a3.6 3.6 0 0 1 7.2 0" />
      {/* side figures */}
      <circle cx="6.4" cy="9.4" r="1.6" />
      <path d="M3.6 15.2a2.9 2.9 0 0 1 3.2-2.6" />
      <circle cx="17.6" cy="9.4" r="1.6" />
      <path d="M20.4 15.2a2.9 2.9 0 0 0-3.2-2.6" />
      {/* speech bubble */}
      <path d="M9.5 19h5a1 1 0 0 0 1-1v-.6a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v.6a1 1 0 0 0 1 1l-.6 1.4Z" />
    </svg>
  )
}

/** Events / Tapahtumat — calendar with a star + ribbon. */
export function EventsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.6" />
      <path d="M3.5 9h17M7.5 3v3M16.5 3v3" />
      <path d="M12 11.2l1 2 2.2.2-1.7 1.5.5 2.1-2-1.1-2 1.1.5-2.1L8.8 13.4l2.2-.2Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Themes / Manor — mansion with central tower + side towers. */
export function ManorIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* main roof + central spire */}
      <path d="M12 2.2l3 3.3H9Z" />
      <path d="M6 11l3-5.5h6L18 11" />
      {/* body */}
      <path d="M4.5 11h15v9.5h-15Z" />
      {/* side towers */}
      <path d="M4.5 11V8l-1.3 0 1.3-2.2L5.8 8 4.5 8M19.5 11V8l1.3 0-1.3-2.2L18.2 8l1.3 0" />
      {/* door + windows */}
      <path d="M10.5 20.5v-4a1.5 1.5 0 0 1 3 0v4" />
      <path d="M7 13.5h2v2H7zM15 13.5h2v2h-2z" />
    </svg>
  )
}

/** Marketplace / Tori — market stall with awning + scales. */
export function MarketIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* awning */}
      <path d="M3 8.5l1.5-3h15L21 8.5z" />
      <path d="M3 8.5c1.2 0 1.2 1 2.4 1s1.2-1 2.4-1 1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.6 1" />
      {/* counter */}
      <path d="M4.5 20.5v-7h15v7M3.5 13.5h17" />
      {/* scales */}
      <path d="M12 9.5v3.5M9.5 11h5M9.5 11 8.3 13h2.4ZM14.5 11 13.3 13h2.4Z" />
    </svg>
  )
}

/** Messages / Viestit — sealed envelope + speech bubble. */
export function MessagesIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* envelope */}
      <rect x="2.5" y="7" width="13" height="11" rx="1.4" />
      <path d="M2.8 7.6 9 12l6.2-4.4" />
      {/* wax seal */}
      <circle cx="9" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
      {/* speech bubble */}
      <path d="M14 3.5h6a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 20 9.5h-3.5L14 11.5V9.5A1.5 1.5 0 0 1 12.5 8V5A1.5 1.5 0 0 1 14 3.5Z" />
    </svg>
  )
}

/** Trophies / Saavutukset — crowned trophy cup with handles + base. */
export function TrophiesIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* crown */}
      <path d="M9.5 3.5l1 1.2 1.5-1.5 1.5 1.5 1-1.2v2h-5z" />
      {/* cup */}
      <path d="M8 5.5h8v3a4 4 0 0 1-8 0z" />
      {/* handles */}
      <path d="M8 6.2H6a2 2 0 0 0 1.6 3M16 6.2h2a2 2 0 0 1-1.6 3" />
      {/* stem + base */}
      <path d="M12 12.5v3M9 21h6M9.5 21c.2-2 1.2-3.2 2.5-3.2S14.3 19 14.5 21" />
    </svg>
  )
}

/** Contact / Yhteystiedot — antique telephone handset + dial. */
export function ContactIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* base */}
      <path d="M5 20.5h14M6.5 20.5l1-7.5h9l1 7.5" />
      {/* dial */}
      <circle cx="12" cy="16.5" r="2.1" />
      <circle cx="12" cy="16.5" r="0.4" fill="currentColor" stroke="none" />
      {/* handset cradle */}
      <path d="M7.5 8.5a4.5 4.5 0 0 1 9 0" />
      <path d="M5.8 8.2a1.4 1.4 0 0 1 2.7-.5l.4 1.3a1.4 1.4 0 0 1-2.7.7zM18.2 8.2a1.4 1.4 0 0 0-2.7-.5l-.4 1.3a1.4 1.4 0 0 0 2.7.7z" />
    </svg>
  )
}

/** Maps a nav route to its Archive SVG icon. */
export const NAV_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  "/collection": GamesIcon,
  "/discover": CommunityIcon,
  "/events": EventsIcon,
  "/themes": ManorIcon,
  "/marketplace": MarketIcon,
  "/messages": MessagesIcon,
  "/trophies": TrophiesIcon,
  "/contact": ContactIcon,
}
