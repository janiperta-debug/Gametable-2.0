"use client"

import { useState, type ReactNode } from "react"
import { House, MessageCircle, CalendarDays, Users } from "lucide-react"
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

  const memberTabs = [
    { value: "overview" as const, label: "Yleiskuva", icon: <House className="h-4 w-4" /> },
    { value: "chat" as const, label: "Keskustelu", icon: <MessageCircle className="h-4 w-4" /> },
    { value: "events" as const, label: "Tapahtumat", icon: <CalendarDays className="h-4 w-4" /> },
    { value: "members" as const, label: "Jäsenet", icon: <Users className="h-4 w-4" /> },
  ]
  const visitorTabs = [
    { value: "overview" as const, label: "Yleiskuva", icon: <House className="h-4 w-4" /> },
  ]

  const tabs = isMember ? memberTabs : visitorTabs
  const content: Record<Tab, ReactNode> = { overview, chat, events, members }

  return (
    <section className="mt-6">
      <div className="sticky top-2 z-30 mb-6 flex justify-center">
        <ArchiveToggle
          options={tabs}
          value={activeTab}
          onChange={value => setActiveTab(value as Tab)}
          className="max-w-full"
        />
      </div>
      <div key={activeTab} className="min-w-0">
        {content[activeTab]}
      </div>
    </section>
  )
}
