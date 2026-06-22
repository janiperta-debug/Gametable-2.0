"use client"

import { useEffect, useState } from 'react'
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

  const fetchProfile = async (userId: string) => {
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
  }

  const refetch = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    let isMounted = true

    // Restore the session from local storage. getSession() reads the persisted
    // session WITHOUT a network round-trip (and refreshes the token if needed),
    // so it works reliably when an installed PWA resumes from the background on
    // iOS — unlike getUser(), whose network call can fail on resume and wrongly
    // report the user as logged out until a full app restart.
    const restoreSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!isMounted) return

        if (sessionError) {
          // Not authenticated - this is not an error state
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await fetchProfile(currentUser.id)
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    restoreSession()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      }
    )

    // When the installed PWA returns to the foreground, iOS may have suspended
    // the token-refresh timer while backgrounded. Re-read the persisted session
    // so the UI reflects the real auth state instead of showing logged-out.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        restoreSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
    }
  }, [])

  return { user, profile, loading, error, refetch }
}
