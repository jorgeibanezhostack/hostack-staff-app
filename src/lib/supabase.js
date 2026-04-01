import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper: Check auth state (checks Supabase, falls back to demo session)
export async function getSession() {
  // Check demo session first (always works offline)
  const demoSession = localStorage.getItem('staff_demo_session')
  if (demoSession) {
    try {
      const parsed = JSON.parse(demoSession)
      if (parsed?.email) return { demo: true, user: { email: parsed.email, id: parsed.id } }
    } catch {
      localStorage.removeItem('staff_demo_session')
    }
  }

  // Try Supabase
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) return session
    } catch {
      // Supabase unavailable, return null
    }
  }

  return null
}

// Helper: Sign out
export async function signOut() {
  localStorage.removeItem('staff_demo_session')
  if (supabase) {
    try { await supabase.auth.signOut() } catch { /* ignore */ }
  }
}
