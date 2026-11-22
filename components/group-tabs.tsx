"use client"

import { useState, type ReactNode } from "react"
import { House, MessageCircle, CalendarDays, Users } from "lucide-react"

type Tab = "overview" | "chat" | "events" | "members"

export function GroupTabs({
  isMember,
  overview,
  chat,
  events,
  members,
}: {
  isMember: boolean
  overview: ReactNode
  chat: ReactNode
  events: ReactNode
  members: ReactNode
}) {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "overview"
    const requested = new URLSearchParams(window.location.search).get("tab")
    return requested === "chat" || requested === "events" || requested === "members" ? requested : "overview"
  })

  const tabs = [
    { value: "overview" as const, label: "Yleiskuva", icon: House },
    ...(isMember ? [
      { value: "chat" as const, label: "Keskustelu", icon: MessageCircle },
      { value: "events" as const, label: "Tapahtumat", icon: CalendarDays },
      { value: "members" as const, label: "Jäsenet", icon: Users },
    ] : []),
  ]
  const content: Record<Tab, ReactNode> = { overview, chat, events, members }

  return (
    <section className="mt-5">
      <div className="sticky top-2 z-40 mb-6 rounded-xl border border-[var(--archive-gold,#d9b65c)]/50 bg-[#210d13]/95 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <div role="tablist" aria-label="Ryhmän osiot" className="grid grid-cols-4 gap-1">
          {tabs.map(({ value, label, icon: Icon }) => {
            const active = activeTab === value
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveTab(value)
                  const url = new URL(window.location.href)
                  if (value === "overview") url.searchParams.delete("tab")
                  else url.searchParams.set("tab", value)
                  window.history.replaceState({}, "", url)
                }}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide transition-colors sm:flex-row sm:gap-2 sm:px-3 sm:text-xs ${active ? "bg-[var(--archive-gold,#d9b65c)]/15 text-[var(--archive-gold,#d9b65c)] ring-1 ring-[var(--archive-gold,#d9b65c)]/60" : "text-[var(--archive-gold,#d9b65c)]/65 hover:bg-white/5 hover:text-[var(--archive-gold,#d9b65c)]"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="min-w-0">{content[activeTab]}</div>
    </section>
  )
}
