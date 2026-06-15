import type { SVGProps } from "react"

/**
 * Archive navigation icon set.
 *
 * Clean line-art SVGs on a 24x24 viewBox drawn with `currentColor`, so they
 * inherit the active theme accent (e.g. --accent-gold) and stay crisp at any
 * size. Each icon is a single, simple, recognizable shape to match the
 * Archive Icon mockup (no busy overlapping props).
 */

type IconProps = SVGProps<SVGSVGElement>

const baseProps = (props: IconProps): IconProps => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
})

/** Collection / Pelit — clean faceted d20 (icosahedron). */
export function GamesIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 2.5 20.5 7.2V16.8L12 21.5 3.5 16.8V7.2Z" />
      <path d="M3.5 7.2 12 10.5l8.5-3.3" />
      <path d="M12 2.5v8" />
      <path d="M12 10.5 3.5 16.8M12 10.5v11M12 10.5l8.5 6.3" />
    </svg>
  )
}

/** Discover / Yhteisö — three figures. */
export function CommunityIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="7.5" r="2.4" />
      <path d="M7.7 15.6a4.3 4.3 0 0 1 8.6 0" />
      <circle cx="5.4" cy="9.6" r="1.7" />
      <path d="M2.4 15.6a3 3 0 0 1 3-2.7" />
      <circle cx="18.6" cy="9.6" r="1.7" />
      <path d="M21.6 15.6a3 3 0 0 0-3-2.7" />
    </svg>
  )
}

/** Events / Tapahtumat — calendar with a star. */
export function EventsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.5" y="5" width="17" height="15" rx="1.8" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      <path d="M12 10.8l1.35 2.7 3 .45-2.17 2.1.5 3-2.68-1.42L9.32 19.1l.5-3-2.17-2.1 3-.45Z" />
    </svg>
  )
}

/** Themes / Home — castle / manor with battlements + flag. */
export function ManorIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* ground */}
      <path d="M3 20.5h18" />
      {/* left battlemented wall */}
      <path d="M3.5 20.5V8.5h1.1V10h1.1V8.5h1.1V10H8" />
      {/* center tower with battlements */}
      <path d="M8 20.5V6.5h1.3V5h1.3v1.5h1.3V5h1.3v1.5h1.3V5h1.3v1.5H16V20.5" />
      {/* right battlemented wall */}
      <path d="M20.5 20.5V8.5h-1.1V10h-1.1V8.5h-1.1V10H16" />
      {/* flag */}
      <path d="M12 5V2.5M12 2.9l2.2.7-2.2.7" />
      {/* arched door */}
      <path d="M10.5 20.5v-3.5a1.5 1.5 0 0 1 3 0v3.5" />
      {/* windows */}
      <path d="M9.2 9.5h1.4v1.8H9.2zM13.4 9.5h1.4v1.8h-1.4z" />
    </svg>
  )
}

/** Marketplace / Tori — market stall with striped awning + counter. */
export function MarketIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* awning */}
      <path d="M4.5 9 6 5.5h12L19.5 9Z" />
      <path d="M8.6 5.5 7.8 9M11.4 5.5 11 9M13 9l.6-3.5M16.4 5.5 17.2 9" />
      {/* posts */}
      <path d="M6.5 9v3.5M17.5 9v3.5" />
      {/* counter */}
      <path d="M5.5 12.5h13v8h-13z" />
      <path d="M5.5 15.2h13" />
    </svg>
  )
}

/** Messages / Viestit — envelope inside a speech bubble. */
export function MessagesIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 4.5h16a1.6 1.6 0 0 1 1.6 1.6V15a1.6 1.6 0 0 1-1.6 1.6H9.5l-3.6 3v-3H4A1.6 1.6 0 0 1 2.4 15V6.1A1.6 1.6 0 0 1 4 4.5Z" />
      <rect x="6.2" y="7.2" width="11.6" height="6.6" rx="0.9" />
      <path d="m6.6 7.7 5.4 3.4 5.4-3.4" />
    </svg>
  )
}

/** Trophies / Saavutukset — trophy cup with handles + base. */
export function TrophiesIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M7.5 4.5h9v4.5a4.5 4.5 0 0 1-9 0Z" />
      <path d="M7.5 5.5H5.2a2.3 2.3 0 0 0 2.1 3.4M16.5 5.5h2.3a2.3 2.3 0 0 1-2.1 3.4" />
      <path d="M12 13.5v2.8M8.5 20.5h7M9.6 20.5c.2-2.6 1.1-3.7 2.4-3.7s2.2 1.1 2.4 3.7" />
    </svg>
  )
}

/** Contact / Yhteystiedot — classic telephone handset. */
export function ContactIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6.6 4.5A1.9 1.9 0 0 0 4.7 6.4C4.7 13.6 10.4 19.3 17.6 19.3a1.9 1.9 0 0 0 1.9-1.9v-2.3a1.2 1.2 0 0 0-.9-1.2l-2.6-.6a1.2 1.2 0 0 0-1.2.4l-1 1.2a9.6 9.6 0 0 1-4.4-4.4l1.2-1a1.2 1.2 0 0 0 .4-1.2l-.6-2.6a1.2 1.2 0 0 0-1.2-.9Z" />
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
