import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ThemeHero } from "@/components/theme-hero"
import { ArchiveCard, ArchiveCardContent, ArchiveCardHeader, ArchiveCardTitle } from "@/components/archive-frame"
import { GroupInviteAccept } from "@/components/group-invite-accept"

export default async function GroupInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[0-9a-f-]{36}$/i.test(token)) return notFound()
  const supabase = await createClient()
  const [{ data: { user } }, { data: groups, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("get_group_by_invite_token", { p_token: token }),
  ])
  const group = groups?.[0]
  if (error || !group) return notFound()

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <ThemeHero page="discover" mode="banner" title={group.name} subtitle={group.short_description} />
      <ArchiveCard className="mt-6">
        <ArchiveCardHeader><ArchiveCardTitle>Sinut on kutsuttu ryhmään</ArchiveCardTitle></ArchiveCardHeader>
        <ArchiveCardContent className="space-y-4">
          {group.cover_image_url ? <img src={group.cover_image_url} alt="" className="max-h-64 w-full rounded-lg object-cover" /> : null}
          <p className="whitespace-pre-wrap">{group.description || group.short_description}</p>
          <p className="text-sm text-muted-foreground">{group.member_count} jäsentä · {group.category === "board_game" ? "Lautapelit" : group.category}</p>
          {user ? (
            <GroupInviteAccept token={token} />
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-md border border-accent-gold px-5 py-3 text-accent-gold" href={`/auth/signup?next=${encodeURIComponent(`/groups/invite/${token}`)}`}>Luo GameTable-tili ja liity</Link>
              <Link className="rounded-md border border-accent-gold/40 px-5 py-3" href={`/auth/login?redirect=${encodeURIComponent(`/groups/invite/${token}`)}`}>Kirjaudu sisään</Link>
            </div>
          )}
        </ArchiveCardContent>
      </ArchiveCard>
    </main>
  )
}
