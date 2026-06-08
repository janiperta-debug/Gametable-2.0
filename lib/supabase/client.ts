import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // In environments where the Supabase env vars are not present (e.g. the v0
  // preview sandbox), createBrowserClient throws and takes the whole page down.
  // Production has these vars set, so this guard never triggers there. When they
  // are missing we fall back to harmless placeholder values so the UI can still
  // render for design/preview work (data calls simply won't succeed).
  return createBrowserClient(
    supabaseUrl ?? 'https://placeholder.supabase.co',
    supabaseAnonKey ?? 'placeholder-anon-key',
  )
}
