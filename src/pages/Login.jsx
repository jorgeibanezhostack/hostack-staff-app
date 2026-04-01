import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/Login.css'

export default function Login({ onLogin, inviteToken }) {
  const [mode, setMode] = useState('login') // 'login' | 'invite'
  const [invite, setInvite] = useState(null)  // { name, email, role }
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')

  // Login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Invite accept form
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteConfirm, setInviteConfirm] = useState('')
  const [acceptLoading, setAcceptLoading] = useState(false)
  const [acceptError, setAcceptError] = useState('')

  // If invite token in URL, load invitation details
  useEffect(() => {
    if (inviteToken) {
      loadInvite(inviteToken)
    }
  }, [inviteToken])

  async function loadInvite(token) {
    setInviteLoading(true)
    setMode('invite')
    try {
      if (!supabase) {
        // Demo mode: show generic invite form
        setInvite({ name: 'New Staff', email: 'staff@demo.co', role: 'Housekeeping' })
        return
      }
      const { data, error: err } = await supabase.rpc('get_invitation', { invite_token: token })
      if (err) throw err
      if (!data?.valid) {
        setInviteError('This invite link has expired or already been used.')
        setMode('login')
        return
      }
      setInvite(data)
    } catch (err) {
      setInviteError('Failed to load invitation: ' + err.message)
      setMode('login')
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!supabase) {
        // DEMO MODE
        if (email && password.length >= 4) {
          localStorage.setItem('staff_demo_session', JSON.stringify({ email, id: Date.now() }))
          onLogin()
        } else {
          setError('Email and password required (min 4 chars)')
        }
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      onLogin()
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleAcceptInvite(e) {
    e.preventDefault()
    setAcceptError('')

    if (invitePassword.length < 6) {
      setAcceptError('Password must be at least 6 characters.')
      return
    }
    if (invitePassword !== inviteConfirm) {
      setAcceptError('Passwords do not match.')
      return
    }

    setAcceptLoading(true)
    try {
      if (!supabase) {
        // Demo mode: just log in
        localStorage.setItem('staff_demo_session', JSON.stringify({ email: invite.email, id: Date.now() }))
        onLogin()
        return
      }

      // Create Supabase auth account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password: invitePassword,
      })

      if (signUpError) {
        // If user already exists, try signing in instead
        if (signUpError.message.includes('already registered')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: invite.email,
            password: invitePassword,
          })
          if (signInError) throw signInError
        } else {
          throw signUpError
        }
      }

      // Get the auth user id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign-up failed. Please try again.')

      // Accept the invitation and link to staff record
      const { data: result, error: acceptErr } = await supabase.rpc('accept_invitation', {
        invite_token: inviteToken,
        user_auth_id: user.id,
      })

      if (acceptErr) throw acceptErr
      if (!result?.success) throw new Error(result?.error || 'Invitation error')

      // Clean URL and trigger login
      window.history.replaceState({}, '', window.location.pathname)
      onLogin()
    } catch (err) {
      setAcceptError(err.message || 'Something went wrong')
    } finally {
      setAcceptLoading(false)
    }
  }

  // ─── INVITE LOADING ────────────────────────────────────────────
  if (inviteLoading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <LogoSVG />
            <h1>Hostack Staff</h1>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '20px 0' }}>
            Loading invitation...
          </p>
        </div>
      </div>
    )
  }

  // ─── ACCEPT INVITE SCREEN ──────────────────────────────────────
  if (mode === 'invite' && invite) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <LogoSVG />
            <h1>Hostack Staff</h1>
            <p>You've been invited to join the team</p>
          </div>

          <div className="invite-welcome">
            <div className="invite-welcome-name">👋 Hi, {invite.name}!</div>
            <div className="invite-welcome-role">
              <span className="invite-role-pill">{invite.role}</span>
            </div>
            <div className="invite-welcome-email">{invite.email}</div>
          </div>

          <form onSubmit={handleAcceptInvite} className="login-form">
            <div className="form-group">
              <label>Create password</label>
              <input
                type="password"
                value={invitePassword}
                onChange={e => setInvitePassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Confirm password</label>
              <input
                type="password"
                value={inviteConfirm}
                onChange={e => setInviteConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {acceptError && <div className="error-message">{acceptError}</div>}

            <button type="submit" disabled={acceptLoading} className="btn-primary">
              {acceptLoading ? 'Creating account...' : '🚀 Create account & join'}
            </button>
          </form>

          <div className="login-footer">
            <button className="link-btn" onClick={() => setMode('login')}>
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── NORMAL LOGIN SCREEN ────────────────────────────────────────
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <LogoSVG />
          </div>
          <h1>Hostack Staff</h1>
          <p>Shift checklist & incident reporting</p>
        </div>

        {inviteError && (
          <div className="error-message" style={{ marginBottom: 16 }}>
            {inviteError}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p className="hint">Demo: any email + password (4+ chars)</p>
        </div>
      </div>
    </div>
  )
}

function LogoSVG() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
      <rect x="4" y="4" width="20" height="20" rx="6" fill="#019179"/>
      <rect x="32" y="4" width="20" height="20" rx="6" fill="#4af8d4"/>
      <rect x="4" y="32" width="20" height="20" rx="6" fill="#4af8d4"/>
      <rect x="32" y="32" width="20" height="20" rx="6" fill="#019179"/>
    </svg>
  )
}
