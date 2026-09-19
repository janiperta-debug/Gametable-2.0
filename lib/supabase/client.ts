import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Keep one browser client for the lifetime of the page/PWA.
// Recreating the client during React renders can create competing auth
// listeners and token-refresh state, which is especially fragile when an
// installed iOS PWA is resumed from the background.
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (browserClient) return browserClient

  // In environments where the Supabase env vars are not present (e.g. the v0
  // preview sandbox), createBrowserClient throws and takes the whole page down.
  // Production has these vars set, so this guard never triggers there. When they
  // are missing we fall back to harmless placeholder values so the UI can still
  // render for design/preview work (data calls simply won't succeed).
  browserClient = createBrowserClient(
    supabaseUrl ?? 'https://placeholder.supabase.co',
    supabaseAnonKey ?? 'placeholder-anon-key',
  )

  return browserClient
}
