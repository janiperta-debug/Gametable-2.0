"use client"

import { useState } from "react"
import { ArchiveButton, ArchiveCard, ArchiveCardContent } from "@/components/archive-frame"
import { AlertTriangle } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/useUser"

export function AccountManagement() {
  const t = useTranslations()
  const { user, profile } = useUser()
  const [exporting, setExporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleExportData = async () => {
    if (!user || exporting) return

    setExporting(true)
    setStatus(null)

    try {
      const supabase = createClient()
      const { data: freshProfile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) throw error

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email ?? null,
          createdAt: user.created_at,
        },
        profile: freshProfile ?? profile,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "gametable-my-data.json"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStatus("Your data export is ready.")
    } catch (error) {
      console.error("Error exporting user data:", error)
      setStatus("Could not export your data. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = () => {
    if (!window.confirm(t("profile.deleteAccountWarning"))) return
    setStatus("Account deletion is not available yet. No data was deleted.")
  }

  return (
    <ArchiveCard>
      <ArchiveCardContent className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl text-accent-gold mb-2">{t("profile.accountManagement")}</h2>
          <p className="text-sm font-merriweather text-accent-gold/60">
            {t("profile.accountManagementDesc")}
          </p>
        </div>

        <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-1" />
            <div className="space-y-2">
              <h3 className="text-lg font-cinzel text-red-400">{t("profile.deleteAccount")}</h3>
              <p className="text-sm font-merriweather text-red-300/80">
                {t("profile.deleteAccountWarning")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <ArchiveButton onClick={handleExportData} disabled={exporting || !user}>
              {exporting ? "Exporting…" : t("profile.exportData")}
            </ArchiveButton>
            <button
              onClick={handleDeleteAccount}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-cinzel text-white transition-colors hover:bg-red-700"
            >
              {t("profile.deleteAccount")}
            </button>
          </div>
          {status && (
            <p role="status" className="text-sm font-merriweather text-red-200/80">
              {status}
            </p>
          )}
        </div>
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
