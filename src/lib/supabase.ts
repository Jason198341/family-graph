import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

/** True when real Supabase credentials are present in .env */
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseKey &&
  !supabaseUrl.includes('your-project') &&
  supabaseKey !== 'your-anon-key'

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    })

// ─── Auth helpers ────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}
