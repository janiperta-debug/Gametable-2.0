"use client"

import { useState } from "react"
import { ArchiveButton, ArchiveCard, ArchiveCardContent } from "@/components/archive-frame"
import { AlertTriangle, Loader2, ArrowRightLeft } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/useUser"
import {
  deleteOwnAccount,
  getAccountDeletionPlan,
  transferAccountResponsibility,
  type AccountResponsibility,
} from "@/app/actions/account-deletion"

export function AccountManagement() {
  const t = useTranslations()
  const { user, profile } = useUser()
  const [exporting, setExporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [plan, setPlan] = useState<AccountResponsibility[] | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string>>({})
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleExportData = async () => {
    if (!user || exporting) return
    setExporting(true)
    setStatus(null)
    try {
      const supabase = createClient()
      const { data: freshProfile, error } = await supabase
        .from("profiles").select("*").eq("id", user.id).single()
      if (error) throw error
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email ?? null, createdAt: user.created_at },
        profile: freshProfile ?? profile,
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "gametable-my-data.json"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStatus("Tietojen vienti on valmis.")
    } catch (error) {
      console.error("Error exporting user data:", error)
      setStatus("Tietojen vienti epäonnistui. Yritä uudelleen.")
    } finally {
      setExporting(false)
    }
  }

  const loadPlan = async () => {
    setLoadingPlan(true)
    setStatus(null)
    const result = await getAccountDeletionPlan()
    if (result.error) {
      setStatus("Vastuiden tarkistus epäonnistui: " + result.error)
      setPlan(null)
    } else {
      setPlan(result.responsibilities)
      setSelectedUsers({})
    }
    setLoadingPlan(false)
  }

  const handleTransfer = async (item: AccountResponsibility) => {
    const targetUserId = selectedUsers[item.id]
    if (!targetUserId || busyId) return
    setBusyId(item.id)
    setStatus(null)
    const result = await transferAccountResponsibility(item.kind, item.id, targetUserId)
    if (!result.success) {
      setStatus("Vastuun siirto epäonnistui: " + (result.error || "Tuntematon virhe"))
    } else {
      setStatus("Vastuu siirrettiin onnistuneesti.")
      await loadPlan()
    }
    setBusyId(null)
  }

  const handleDeleteAccount = async () => {
    if (!user || deleting || plan === null || plan.length > 0) return
    const confirmed = window.confirm(
      "Haluatko varmasti poistaa GameTable-tilisi pysyvästi? Tätä toimintoa ei voi peruuttaa."
    )
    if (!confirmed) return
    setDeleting(true)
    setStatus(null)
    const result = await deleteOwnAccount()
    if (!result.success) {
      setStatus("Tilin poistaminen epäonnistui: " + (result.error || "Tuntematon virhe"))
      setDeleting(false)
      return
    }
    window.location.href = "/"
  }

  const kindLabel = (kind: AccountResponsibility["kind"]) =>
    kind === "group" ? "Ryhmän perustajuus" : kind === "event" ? "Tapahtuman järjestäjyys" : "Liigan omistajuus"

  return (
    <ArchiveCard>
      <ArchiveCardContent className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl text-accent-gold mb-2">{t("profile.accountManagement")}</h2>
          <p className="text-sm font-merriweather text-accent-gold/60">{t("profile.accountManagementDesc")}</p>
        </div>

        <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-1" />
            <div className="space-y-2">
              <h3 className="text-lg font-cinzel text-red-400">{t("profile.deleteAccount")}</h3>
              <p className="text-sm font-merriweather text-red-300/80">{t("profile.deleteAccountWarning")}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <ArchiveButton onClick={handleExportData} disabled={exporting || !user}>
              {exporting ? "Viedään…" : t("profile.exportData")}
            </ArchiveButton>
            <button
              onClick={loadPlan}
              disabled={!user || loadingPlan || deleting}
              className="inline-flex items-center justify-center rounded-md border border-accent-gold/40 px-4 py-2 text-sm font-cinzel text-accent-gold disabled:opacity-50"
            >
              {loadingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tarkista siirrettävät vastuut
            </button>
          </div>

          {plan !== null ? (
            <div className="space-y-3 border-t border-red-500/20 pt-4">
              {plan.length === 0 ? (
                <p className="text-sm text-green-300">Vastuita ei ole siirtämättä. Tilin voi poistaa.</p>
              ) : (
                <>
                  <p className="text-sm text-red-200">Seuraavat vastuut on siirrettävä ennen tilin poistamista:</p>
                  {plan.map((item) => (
                    <div key={item.id} className="rounded-md border border-red-500/20 bg-black/20 p-3 space-y-2">
                      <div>
                        <p className="text-sm font-semibold text-accent-gold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{kindLabel(item.kind)}{item.detail ? " · " + item.detail : ""}</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          aria-label={`Uusi vastuuhenkilö: ${item.name}`}
                          className="min-w-0 flex-1 rounded-md border border-accent-gold/30 bg-black/40 px-3 py-2 text-sm text-foreground"
                          value={selectedUsers[item.id] ?? ""}
                          onChange={(event) => setSelectedUsers(previous => ({ ...previous, [item.id]: event.target.value }))}
                        >
                          <option value="">Valitse uusi vastuuhenkilö</option>
                          {item.eligibleUsers.map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.display_name || candidate.username || "GameTable-käyttäjä"}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleTransfer(item)}
                          disabled={!selectedUsers[item.id] || busyId !== null || deleting}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-gold px-3 py-2 text-sm text-black disabled:opacity-40"
                        >
                          {busyId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                          Siirrä vastuu
                        </button>
                      </div>
                      {item.eligibleUsers.length === 0 ? (
                        <p className="text-xs text-red-300">Siirrolle ei ole vielä sopivaa vastaanottajaa. Ryhmän uuden perustajan täytyy olla aktiivinen jäsen.</p>
                      ) : null}
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : null}

          <button
            onClick={handleDeleteAccount}
            disabled={!user || plan === null || plan.length > 0 || deleting || loadingPlan}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-cinzel text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "Poistetaan tiliä…" : t("profile.deleteAccount")}
          </button>

          {status ? <p role="status" className="text-sm font-merriweather text-red-200/80">{status}</p> : null}
        </div>
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
