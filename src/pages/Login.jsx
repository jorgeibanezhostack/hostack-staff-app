import { useState } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/Login.css'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Login attempt - supabase:', !!supabase, 'email:', email, 'password length:', password.length)

      if (!supabase) {
        console.log('DEMO MODE')
        // DEMO MODE: Accept any email + password
        if (email && password.length >= 4) {
          console.log('Demo login success!')
          localStorage.setItem('staff_demo_session', JSON.stringify({ email, id: Date.now() }))
          onLogin()
        } else {
          console.log('Demo login failed - validation', email, password.length)
          setError('Email and password required (min 4 chars)')
        }
      } else {
        // REAL SUPABASE AUTH
        console.log('SUPABASE MODE')
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) throw authError
        onLogin()
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
              {/* Top left - Accent green */}
              <rect x="4" y="4" width="20" height="20" rx="6" fill="#019179"/>
              {/* Top right - Light neon green */}
              <rect x="32" y="4" width="20" height="20" rx="6" fill="#4af8d4"/>
              {/* Bottom left - Light neon green */}
              <rect x="4" y="32" width="20" height="20" rx="6" fill="#4af8d4"/>
              {/* Bottom right - Accent green */}
              <rect x="32" y="32" width="20" height="20" rx="6" fill="#019179"/>
            </svg>
          </div>
          <h1>Hostack Staff</h1>
          <p>Shift checklist & incident reporting</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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
