"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Menu, Navigation, Save } from "lucide-react"
import { ArchiveButton, ArchiveCard, ArchiveCardContent } from "@/components/archive-frame"
import { NAV_ICONS, NAV_ICON_IMAGES, MOBILE_NAV_ROUTES, type MobileNavRoute } from "@/components/nav-icons"
import { useTranslations } from "@/lib/i18n"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"

const DEFAULT_ROUTES: MobileNavRoute[] = [
  "/collection",
  "/discover",
  "/events",
  "/themes",
]

function readMobileNavRoutes(preferences: Record<string, unknown> | null | undefined): MobileNavRoute[] {
  const navigation = preferences?.navigation
  if (!navigation || typeof navigation !== "object" || Array.isArray(navigation)) return DEFAULT_ROUTES

  const saved = (navigation as Record<string, unknown>).mobileBottomSlots
  if (!Array.isArray(saved)) return DEFAULT_ROUTES

  const valid = saved.filter((value): value is MobileNavRoute =>
    typeof value === "string" && (MOBILE_NAV_ROUTES as readonly string[]).includes(value)
  )

  if (valid.length !== 4 || new Set(valid).size !== 4) return DEFAULT_ROUTES
  return valid
}

function ShortcutPreview({ route }: { route: MobileNavRoute }) {
  const Icon = NAV_ICONS[route]
  const image = NAV_ICON_IMAGES[route]

  return (
    <div className="flex h-14 w-14 items-center justify-center">
      {image ? (
        <img
          src={image}
          alt=""
          className="h-14 w-14 object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
        />
      ) : (
        <ArchiveCard className="h-12 w-12 rounded-xl">
          <div className="flex h-full w-full items-center justify-center text-accent-gold">
            {Icon && <Icon className="h-7 w-7" />}
          </div>
        </ArchiveCard>
      )}
    </div>
  )
}

export function ProfileNavigationSettings() {
  const { profile, loading: profileLoading, refetch } = useUser()
  const [routes, setRoutes] = useState<MobileNavRoute[]>(DEFAULT_ROUTES)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const t = useTranslations()

  useEffect(() => {
    if (profile) setRoutes(readMobileNavRoutes(profile.preferences))
  }, [profile])

  const labels = useMemo<Record<MobileNavRoute, string>>(() => ({
    "/collection": t("nav.collection"),
    "/discover": t("nav.community"),
    "/events": t("nav.events"),
    "/themes": t("nav.themes"),
    "/marketplace": t("nav.marketplace"),
    "/messages": t("nav.messages"),
    "/trophies": t("nav.trophies"),
    "/contact": t("nav.contact"),
  }), [t])

  const updateSlot = (index: number, value: MobileNavRoute) => {
    setRoutes(current => {
      const next = [...current]
      const otherIndex = next.indexOf(value)
      if (otherIndex !== -1 && otherIndex !== index) {
        next[otherIndex] = next[index]
      }
      next[index] = value
      return next
    })
    setStatus(null)
  }

  const handleSave = async () => {
    if (!profile || saving) return

    setSaving(true)
    setStatus(null)

    try {
      const supabase = createClient()
      const currentPreferences = profile.preferences ?? {}
      const nextPreferences = {
        ...currentPreferences,
        navigation: {
          ...(currentPreferences.navigation && typeof currentPreferences.navigation === "object" && !Array.isArray(currentPreferences.navigation)
            ? currentPreferences.navigation
            : {}),
          mobileBottomSlots: routes,
        },
      }

      const { data: savedProfile, error } = await supabase
        .from("profiles")
        .update({ preferences: nextPreferences })
        .eq("id", profile.id)
        .select("preferences")
        .single()

      if (error) throw error

      const savedRoutes = readMobileNavRoutes(savedProfile?.preferences as Record<string, unknown> | null)
      if (JSON.stringify(savedRoutes) !== JSON.stringify(routes)) {
        throw new Error("Saved navigation preferences could not be verified.")
      }

      await refetch()
      window.dispatchEvent(new CustomEvent("gametable-navigation-updated", {
        detail: { routes: savedRoutes },
      }))
      setStatus(t("profile.mobileNavigationSaved"))
    } catch (error) {
      console.error("Error saving mobile navigation:", error)
      setStatus(t("profile.mobileNavigationSaveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ArchiveCard>
      <ArchiveCardContent className="p-8 space-y-6">
        <div className="flex items-start gap-3">
          <Navigation className="w-6 h-6 text-accent-gold mt-1" />
          <div>
            <h2 className="text-2xl text-accent-gold">{t("profile.mobileNavigation")}</h2>
            <p className="text-sm text-muted-foreground font-merriweather">
              {t("profile.mobileNavigationDesc")}
            </p>
          </div>
        </div>

        {!profile && !profileLoading ? (
          <p className="text-center text-muted-foreground font-merriweather py-6">
            {t("profile.loginToManageNavigation")}
          </p>
        ) : profileLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent-gold" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3 rounded-xl border border-accent-gold/20 bg-black/10 px-4 py-5">
              {routes.map((route, index) => (
                <div key={index} className="flex items-center gap-3">
                  {index === 2 && <div className="flex h-14 w-10 items-center justify-center text-accent-gold/60"><Menu className="h-5 w-5" /></div>}
                  <ShortcutPreview route={route} />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {routes.map((route, index) => {
                const availableRoutes = MOBILE_NAV_ROUTES.filter(candidate =>
                  candidate === route || !routes.includes(candidate)
                )

                return (
                  <div key={index} className="grid grid-cols-[80px_1fr] items-center gap-4">
                    <div className="text-sm font-cinzel uppercase tracking-wide text-accent-gold">
                      {t("profile.mobileNavigationSlot")} {index + 1}
                    </div>
                    <select
                      value={route}
                      onChange={event => updateSlot(index, event.target.value as MobileNavRoute)}
                      disabled={saving}
                      className="w-full rounded-lg border border-accent-gold/30 bg-background px-4 py-3 font-merriweather text-foreground outline-none transition focus:border-accent-gold focus:ring-1 focus:ring-accent-gold"
                      aria-label={`${t("profile.mobileNavigationSlot")} ${index + 1}`}
                    >
                      {availableRoutes.map(candidate => (
                        <option key={candidate} value={candidate}>
                          {labels[candidate]}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>

            <p className="text-sm text-muted-foreground font-merriweather">
              {t("profile.mobileNavigationOrder")}
            </p>

            <ArchiveButton active disabled={saving} onClick={handleSave}>
              {saving ? <><Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />{t("common.saving")}...</> : <><Save className="mr-2 inline-block h-4 w-4" />{t("profile.saveMobileNavigation")}</>}
            </ArchiveButton>

            {status && (
              <p role="status" className="text-sm text-muted-foreground font-merriweather">
                {status}
              </p>
            )}
          </>
        )}
      </ArchiveCardContent>
    </ArchiveCard>
  )
}
