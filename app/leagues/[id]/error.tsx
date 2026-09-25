"use client"

import { useEffect } from "react"

export default function LeagueError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("League page failed:", error) }, [error])
  return <main className="mx-auto max-w-xl space-y-4 p-6 text-center">
    <h1 className="text-2xl font-semibold">Liigan avaaminen epäonnistui / Could not open league</h1>
    <p>Liigan tietoja ei ole poistettu. Päivitä sivu tai yritä uudelleen.</p>
    <p className="text-sm opacity-70">The league data has not been deleted. Refresh and try again.</p>
    <button className="rounded border px-4 py-2" onClick={reset}>Yritä uudelleen / Retry</button>
    {error.digest && <p className="text-xs opacity-60">Virhetunnus: {error.digest}</p>}
  </main>
}
