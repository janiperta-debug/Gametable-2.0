"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ArchiveToggle } from "@/components/archive-frame"

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
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab")
    if (requested === "chat" || requested === "events" || requested === "members") {
      setActiveTab(requested)
    }
  }, [])

  const tabs = [
    { value: "overview" as const, label: "Yleiskuva" },
    ...(isMember ? [
      { value: "chat" as const, label: "Keskustelu" },
      { value: "events" as const, label: "Tapahtumat" },
      { value: "members" as const, label: "Jäsenet" },
    ] : []),
  ]
  const content: Record<Tab, ReactNode> = { overview, chat, events, members }

  return (
    <section className="mt-5">
      <div className="sticky top-2 z-40 mb-6">
        <ArchiveToggle
          options={tabs}
          value={activeTab}
          onChange={(value) => {
            setActiveTab(value)
            const url = new URL(window.location.href)
            if (value === "overview") url.searchParams.delete("tab")
            else url.searchParams.set("tab", value)
            window.history.replaceState({}, "", url)
          }}
          className="w-full"
          stretch
        />
      </div>
      <div className="min-w-0">{content[activeTab]}</div>
    </section>
  )
}
