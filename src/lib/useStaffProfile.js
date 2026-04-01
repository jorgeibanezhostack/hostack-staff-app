import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// DEMO staff profile used when Supabase is not configured
const DEMO_STAFF = {
  id: 'demo-staff-001',
  email: 'demo@hostack.co',
  name: 'Demo Manager',
  role: 'Manager',
  property_id: '550e8400-e29b-41d4-a716-446655440000',
  status: 'active',
  preferred_language: 'en',
  auth_user_id: null,
}

export function useStaffProfile(session) {
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) {
      setStaff(null)
      setLoading(false)
      return
    }

    loadProfile()
  }, [session])

  async function loadProfile() {
    setLoading(true)
    setError(null)

    // Demo mode: either no Supabase or session is a demo session
    if (!supabase || session?.demo) {
      const demo = localStorage.getItem('staff_demo_session')
      if (demo) {
        try {
          const parsed = JSON.parse(demo)
          setStaff({ ...DEMO_STAFF, email: parsed.email, name: parsed.email.split('@')[0] })
        } catch {
          setStaff(DEMO_STAFF)
        }
      } else {
        setStaff(DEMO_STAFF)
      }
      setLoading(false)
      return
    }

    try {
      // Use RPC to load staff profile (auto-links auth_user_id by email)
      const { data, error: rpcError } = await supabase.rpc('get_my_staff_profile')

      if (rpcError) throw rpcError

      if (data) {
        setStaff(data)
      } else {
        // No staff record found — user authenticated but not in staff table
        setError('no_staff_record')
        setStaff(null)
      }
    } catch (err) {
      console.error('Failed to load staff profile:', err)
      // If Supabase fails but we have a demo session, use demo profile
      const demo = localStorage.getItem('staff_demo_session')
      if (demo) {
        try {
          const parsed = JSON.parse(demo)
          setStaff({ ...DEMO_STAFF, email: parsed.email, name: parsed.email.split('@')[0] })
        } catch {
          setStaff(DEMO_STAFF)
        }
      } else {
        setError(err.message)
        setStaff(null)
      }
    } finally {
      setLoading(false)
    }
  }

  return { staff, loading, error, reload: loadProfile }
}
