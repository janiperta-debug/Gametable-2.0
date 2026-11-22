import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MapPin, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ThemeHero } from "@/components/theme-hero"
import { ArchiveCard, ArchiveCardButton, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle } from "@/components/archive-frame"
import { GroupMembershipControls } from "@/components/group-membership-controls"
import { GroupInviteLink } from "@/components/group-invite-link"
import { GroupMembershipRequests } from "@/components/group-membership-requests"

const categoryLabels: Record<string, string> = {
  board_game: "Lautapelit",
  miniature: "Miniatyyripelit",
  rpg: "Roolipelit",
  trading_card: "Keräilykorttipelit",
  other: "Muu harrastus",
}

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: group, error } = await supabase
    .from("groups")
    .select("id, name, short_description, description, category, game_interests, location, visibility, join_policy, invite_token, cover_image_url, created_at")
    .eq("id", id)
    .single()

  if (error || !group) return notFound()
  const [{ data: counts, error: countError }, { data: membership }] = await Promise.all([
    supabase.rpc("get_group_member_counts", { p_group_ids: [id] }),
    supabase.from("group_memberships")
      .select("role, status")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ])
  if (countError) {
    console.error("Error loading group member count:", countError)
    return notFound()
  }
  const memberCount = counts?.[0]?.member_count ?? 0
  const isAdmin = membership && ["founder", "admin"].includes(membership.role) && membership.status === "active"
  const { data: pendingRequests } = isAdmin
    ? await supabase.from("group_memberships")
        .select("user_id, joined_at")
        .eq("group_id", id)
        .eq("status", "pending")
        .order("joined_at", { ascending: true })
    : { data: [] }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-5">
        <ArchiveCardButton asChild><Link href="/discover"><ArrowLeft className="mr-2 inline h-4 w-4" />Yhteisö</Link></ArchiveCardButton>
      </div>
      {group.cover_image_url ? (
        <section className="relative mb-8 overflow-hidden rounded-xl border border-accent-gold/40">
          <img src={group.cover_image_url} alt="" className="h-56 w-full object-cover sm:h-72" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <h1 className="font-cinzel text-3xl font-bold text-white drop-shadow-lg">{group.name}</h1>
            <p className="mt-1 text-white/85">{group.short_description}</p>
          </div>
        </section>
      ) : (
        <ThemeHero page="discover" mode="banner" title={group.name} subtitle={group.short_description} />
      )}
      {isAdmin ? <GroupInviteLink groupId={group.id} initialToken={group.invite_token} /> : null}
      {isAdmin ? <GroupMembershipRequests groupId={group.id} requests={pendingRequests ?? []} /> : null}
      <div className="mb-6">
        <GroupMembershipControls
          groupId={group.id}
          visibility={group.visibility}
          joinPolicy={group.join_policy}
          membership={membership ? { role: membership.role, status: membership.status } : null}
        />
      </div>
      <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
        <ArchiveCard>
          <ArchiveCardHeader><ArchiveCardTitle>Kuvaus</ArchiveCardTitle></ArchiveCardHeader>
          <ArchiveCardContent>
            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">{group.description || group.short_description}</p>
          </ArchiveCardContent>
        </ArchiveCard>
        <ArchiveCard>
          <ArchiveCardHeader><ArchiveCardTitle>Ryhmän tiedot</ArchiveCardTitle></ArchiveCardHeader>
          <ArchiveCardContent className="space-y-3 text-sm">
            <p>{categoryLabels[group.category] || categoryLabels.other}</p>
            <p className="flex items-center gap-2"><Users className="h-4 w-4 text-accent-gold" />{memberCount} jäsentä</p>
            {group.location ? <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent-gold" />{group.location}</p> : null}
            {group.game_interests?.length ? <div><p className="mb-1 font-semibold">Pelit ja järjestelmät</p><p>{group.game_interests.join(" · ")}</p></div> : null}
          </ArchiveCardContent>
        </ArchiveCard>
      </div>
    </main>
  )
}
