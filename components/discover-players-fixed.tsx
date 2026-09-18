"use client"

import { useState } from "react"
import { searchUsers } from "@/app/actions/search-users"
import { sendFriendRequest, removeFriend, type DiscoverUser } from "@/app/actions/friends"
import { ArchiveCard } from "@/components/archive-frame"
import { ArchiveDivider } from "@/components/archive-divider"
import Link from "next/link"

export function DiscoverPlayersFixed() {
  const [location, setLocation] = useState("")
  const [gameTitle, setGameTitle] = useState("")
  const [gameType, setGameType] = useState("")
  const [players, setPlayers] = useState<DiscoverUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

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
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" onClick={handleSearch} disabled={loading}>
            {loading ? "Haetaan…" : "Hae pelaajia"}
          </button>
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
              <article className="flex items-center gap-4 px-1 py-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-semibold">{initials}</div>
              <div className="min-w-0 flex-1">
                <Link href={`/users/${player.username || player.id}`} className="font-semibold truncate hover:text-accent-gold transition-colors">{name}</Link>
                {player.location ? <p className="text-sm text-muted-foreground">{player.location}</p> : null}
                <p className="text-sm text-muted-foreground">{player.games_count} t("collection.gameCountLabel") + " kokoelmassa"</p>
              </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/users/${player.username || player.id}`}
                    className="rounded-md border border-accent-gold/40 px-3 py-2 text-sm text-accent-gold hover:bg-accent-gold/10 transition-colors"
                  >
                    Näytä profiili
                  </Link>
                  <button className="rounded-md border px-3 py-2 text-sm disabled:opacity-50" disabled={busy === player.id || status === "accepted"} onClick={() => handleFriendAction(player)}>
                    {status === "accepted" ? "Ystävä" : status === "pending" ? "Peru pyyntö" : busy === player.id ? "…" : "Lisää ystävä"}
                  </button>
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
