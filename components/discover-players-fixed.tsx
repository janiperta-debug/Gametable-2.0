"use client"

import { useState } from "react"
import { searchUsers } from "@/app/actions/search-users"
import { sendFriendRequest, removeFriend, type DiscoverUser } from "@/app/actions/friends"
import { ArchiveButton, ArchiveCard, ArchiveCardButton } from "@/components/archive-frame"
import { ArchiveDivider } from "@/components/archive-divider"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n"

export function DiscoverPlayersFixed() {
  const [location, setLocation] = useState("")
  const [gameTitle, setGameTitle] = useState("")
  const [gameType, setGameType] = useState("")
  const [players, setPlayers] = useState<DiscoverUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const t = useTranslations()

  async function handleSearch() {
    setLoading(true)
    const result = await searchUsers({ location, gameTitle, gameType })
    setPlayers(result.data)
    setSearched(true)
    setLoading(false)
  }

  async function handleFriendAction(player: DiscoverUser) {
    setBusy(player.id)
    if (player.friendship_status === "pending" || player.friendship_status === "accepted") {
      if (player.friendship_id) await removeFriend(player.friendship_id)
    } else {
      await sendFriendRequest(player.id)
    }
    await handleSearch()
    setBusy(null)
  }

  return (
    <section className="space-y-6">
      <ArchiveCard>
        <div className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-3">
          <input className="rounded-md border bg-background px-3 py-2" placeholder="Sijainti" value={location} onChange={(e) => setLocation(e.target.value)} />
          <input className="rounded-md border bg-background px-3 py-2" placeholder="Pelin nimi" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)} />
          <select className="rounded-md border bg-background px-3 py-2" value={gameType} onChange={(e) => setGameType(e.target.value)}>
            <option value="">Kaikki pelityypit</option>
            <option value="board_game">Lautapelit</option>
            <option value="rpg">Roolipelit</option>
            <option value="miniature">Miniatyyripelit</option>
            <option value="trading_card">Keräilykorttipelit</option>
          </select>
          </div>
          <ArchiveButton onClick={handleSearch} disabled={loading} active>
            {loading ? "Haetaan…" : "Hae pelaajia"}
          </ArchiveButton>
        </div>
      </ArchiveCard>

      {searched && players.length === 0 ? <p className="text-center text-muted-foreground">Pelaajia ei löytynyt näillä hakuehdoilla.</p> : null}
      <ArchiveCard>
        <div className="space-y-0">
        {players.map((player, index) => {
          const name = player.display_name || player.username || "Pelaaja"
          const initials = name.slice(0, 2).toUpperCase()
          const status = player.friendship_status
          return (
            <div key={player.id}> 
              <article className="px-1 py-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-muted flex items-center justify-center font-semibold">{initials}</div>
                <div className="min-w-0 flex-1">
                  <Link href={`/users/${player.username || player.id}`} className="block truncate font-semibold hover:text-accent-gold transition-colors">{name}</Link>
                  {player.location ? <p className="truncate text-sm text-muted-foreground">{player.location}</p> : null}
                  <p className="text-sm text-muted-foreground">{player.games_count} {t("collection.gameCountLabel")} kokoelmassa</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ArchiveCardButton asChild className="w-full">
                  <Link href={`/users/${player.username || player.id}`}>
                    {t("profile.viewProfile")}
                  </Link>
                </ArchiveCardButton>
                <ArchiveCardButton
                  className="w-full"
                  disabled={busy === player.id || status === "accepted"}
                  onClick={() => handleFriendAction(player)}
                >
                  {status === "accepted"
                    ? "Ystävä"
                    : status === "pending"
                      ? "Peru pyyntö"
                      : busy === player.id
                        ? "…"
                        : "Lisää ystävä"}
                </ArchiveCardButton>
              </div>
            </article>
              {index < players.length - 1 && <ArchiveDivider className="my-1" />}
            </div>
          )
        })}
        </div>
      </ArchiveCard>
    </section>
  )
}
