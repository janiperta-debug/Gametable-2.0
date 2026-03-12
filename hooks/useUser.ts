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
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          // Not authenticated - this is not an error state
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        setUser(user)

        if (user) {
          // Fetch profile from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error('Error fetching profile:', profileError)
            // Profile might not exist yet - not a critical error
            setProfile(null)
          } else {
            setProfile(profileData)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          // Fetch profile when auth state changes
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          if (!profileError) {
            setProfile(profileData)
          } else {
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading, error }
}
