"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export function AccountManagement() {
  const handleExportData = () => {
    // TODO: Implement data export
    console.log("Exporting user data...")
  }

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion with confirmation
    console.log("Delete account requested...")
  }

  return (
    <div className="room-furniture p-6 space-y-6">
      <div>
        <h2 className="text-2xl text-accent-gold mb-2">Account Management</h2>
        <p className="text-sm font-merriweather text-accent-gold/60">
          Manage your account data and deletion. These actions cannot be undone.
        </p>
      </div>

      <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-1" />
          <div className="space-y-2">
            <h3 className="text-lg font-cinzel text-red-400">Delete Account</h3>
            <p className="text-sm font-merriweather text-red-300/80">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleExportData}
            className="border-accent-gold/40 text-accent-gold hover:bg-accent-gold hover:text-background bg-transparent"
          >
            Export My Data
          </Button>
          <Button variant="destructive" onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  )
}
