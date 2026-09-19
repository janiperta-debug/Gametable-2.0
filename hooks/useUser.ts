"use client"

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  xp: number
  level: number
  location: string | null
  role: string | null
  theme: string | null
  show_collection: boolean
  preferences: Record<string, unknown> | null
  unlocked_themes: string[] | null
  created_at: string
}

interface UseUserReturn {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profileError) {
      setProfile(profileData)
    } else {
      console.error('Error fetching profile:', profileError)
      setProfile(null)
    }
  }, [supabase])

  const refetch = useCallback(async () => {
    const currentUser = user
    if (currentUser) {
      await fetchProfile(currentUser.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    let isMounted = true
    let restoring = false

    // Restore the persisted session whenever the app starts or returns from
    // the background. On iOS PWAs the app can be suspended long enough for the
    // normal refresh timer to miss its window, so a foreground restore is
    // important.
    const restoreSession = async () => {
      if (restoring) return
      restoring = true

      try {
        let { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          if (isMounted) setError(sessionError)
          return
        }

        // If the stored token is close to expiry, explicitly refresh it while
        // the PWA is active. This covers the iOS resume case where background
        // timers may have been suspended.
        if (session?.expires_at && session.expires_at <= Math.floor(Date.now() / 1000) + 300) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError) {
            console.warn('Session refresh on app resume failed:', refreshError)
            // Keep the persisted session if it is still present. Supabase may
            // recover it on the next auth refresh attempt.
          } else {
            session = refreshData.session
          }
        }

        if (!isMounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)
        setError(null)

        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        restoring = false
        if (isMounted) setLoading(false)
      }
    }

    void restoreSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          // Do not await Supabase work inside the auth callback. Supabase's
          // auth lock can otherwise block token refreshes on resume.
          void fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      }
    )

    const handleAppResume = () => {
      if (document.visibilityState === 'visible') {
        void restoreSession()
      }
    }

    // visibilitychange is the main signal for installed PWAs. pageshow and
    // focus cover Safari/iOS resume paths where visibilitychange is not enough.
    document.addEventListener('visibilitychange', handleAppResume)
    window.addEventListener('pageshow', handleAppResume)
    window.addEventListener('focus', handleAppResume)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleAppResume)
      window.removeEventListener('pageshow', handleAppResume)
      window.removeEventListener('focus', handleAppResume)
    }
  }, [fetchProfile, supabase])

  return { user, profile, loading, error, refetch }
}
