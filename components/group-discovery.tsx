"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, MapPin, Loader2 } from "lucide-react"
import { getDiscoverGroups, type DiscoverGroup } from "@/app/actions/groups"
import { ArchiveCard, ArchiveCardButton } from "@/components/archive-frame"
import { useTranslations } from "@/lib/i18n"

export function GroupDiscovery() {
  const t = useTranslations()
  const [groups, setGroups] = useState<DiscoverGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getDiscoverGroups().then(result => {
      if (!active) return
      setGroups(result.data)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return (
    <section className="space-y-5">
      <p className="text-center text-muted-foreground">{t("community.groupsIntro")}</p>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent-gold" /></div>
      ) : groups.length === 0 ? (
        <ArchiveCard>
          <p className="px-6 py-10 text-center text-muted-foreground">{t("community.noGroups")}</p>
        </ArchiveCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map(group => (
            <ArchiveCard key={group.id}>
              <div className="flex gap-4 p-5">
                {group.cover_image_url ? (
                  <img src={group.cover_image_url} alt="" className="h-24 w-28 rounded-md object-cover" />
                ) : (
                  <div className="flex h-24 w-28 shrink-0 items-center justify-center rounded-md bg-black/30 text-accent-gold">
                    <Users className="h-8 w-8" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-cinzel text-lg font-bold text-accent-gold">{group.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{group.short_description}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{t("community.groupMembers")}: {group.member_count}</span>
                    {group.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{group.location}</span> : null}
                  </div>
                  {group.game_interests.length ? <p className="mt-2 text-xs text-muted-foreground">{group.game_interests.join(" · ")}</p> : null}
                  <ArchiveCardButton asChild className="mt-3">
                    <Link href={`/groups/${group.id}`}>{t("community.openGroup")}</Link>
                  </ArchiveCardButton>
                </div>
              </div>
            </ArchiveCard>
          ))}
        </div>
      )}
    </section>
  )
}
