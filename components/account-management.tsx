"use client"

import { ArchiveButton, ArchiveCard, ArchiveCardContent } from "@/components/archive-frame"
import { AlertTriangle } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

export function AccountManagement() {
  const t = useTranslations()

  const handleExportData = () => {
    // TODO: Implement data export
    console.log("Exporting user data...")
  }

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion with confirmation
    console.log("Delete account requested...")
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
          <ArchiveButton onClick={handleExportData}>
            {t("profile.exportData")}
          </ArchiveButton>
          <button
            onClick={handleDeleteAccount}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-cinzel text-white transition-colors hover:bg-red-700"
          >
            {t("profile.deleteAccount")}
          </button>
        </div>
      </div>
    </ArchiveCardContent>
    </ArchiveCard>
  )
}
