import { useState, useEffect } from 'react'
import { getSession, signOut } from './lib/supabase'
import { useStaffProfile } from './lib/useStaffProfile'
import Login from './pages/Login'
import ShiftChecklist from './pages/ShiftChecklist'
import IncidentReport from './pages/IncidentReport'
import Playbooks from './pages/Playbooks'
import BotQA from './pages/BotQA'
import Admin from './pages/Admin'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [page, setPage] = useState('checklist')
  const [unreadIncidents, setUnreadIncidents] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Invite token from URL
  const inviteToken = new URLSearchParams(window.location.search).get('invite')

  const { staff, loading: staffLoading, error: staffError } = useStaffProfile(session)

  useEffect(() => {
    initAuth()
  }, [])

  async function initAuth() {
    try {
      const sess = await getSession()
      setSession(sess)
    } catch (err) {
      console.error('Auth init error:', err)
      setSession(null)
    } finally {
      setAuthLoading(false)
    }
  }

  const isLoading = authLoading || (session && staffLoading)

  if (isLoading) {
    return <div className="app-loading">Loading...</div>
  }

  // Show login/invite screen if not authenticated
  if (!session) {
    return (
      <Login
        onLogin={() => initAuth()}
        inviteToken={inviteToken}
      />
    )
  }

  // Staff profile not found after login
  if (staffError === 'no_staff_record') {
    return (
      <div className="app-no-staff">
        <div className="no-staff-card">
          <span className="no-staff-icon">⚠️</span>
          <h2>Account not linked</h2>
          <p>Your email is not linked to a staff profile at any property.</p>
          <p>Ask your manager to invite you using the Admin panel.</p>
          <button
            className="btn-secondary"
            onClick={async () => { await signOut(); setSession(null) }}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  const isManager = staff?.role === 'Manager'
  const isLeader = staff?.role === 'Team Leader'
  const canAdmin = isManager || isLeader

  return (
    <div className="app">
      <nav className="app-nav">
        {/* Staff name / role */}
        <div className="nav-identity">
          <span className="nav-name">{staff?.name?.split(' ')[0] ?? 'Staff'}</span>
          <span className="nav-role">{staff?.role ?? ''}</span>
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${page === 'checklist' ? 'active' : ''}`}
            onClick={() => setPage('checklist')}
          >
            ✅ Checklist
          </button>
          <button
            className={`nav-btn ${page === 'incident' ? 'active' : ''}`}
            onClick={() => setPage('incident')}
          >
            🚨 Report
            {unreadIncidents > 0 && <span className="badge">{unreadIncidents}</span>}
          </button>
          <button
            className={`nav-btn ${page === 'playbooks' ? 'active' : ''}`}
            onClick={() => setPage('playbooks')}
          >
            📚 Playbooks
          </button>
          <button
            className={`nav-btn ${page === 'bot' ? 'active' : ''}`}
            onClick={() => { setPage('bot'); setUnreadMessages(0) }}
          >
            💬 Bot
            {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
          </button>
          {canAdmin && (
            <button
              className={`nav-btn nav-btn-admin ${page === 'admin' ? 'active' : ''}`}
              onClick={() => setPage('admin')}
            >
              👑 Admin
            </button>
          )}
        </div>

        <button
          className="nav-btn nav-signout"
          onClick={async () => {
            await signOut()
            setSession(null)
            setPage('checklist')
          }}
        >
          Sign Out
        </button>
      </nav>

      <main className="app-main">
        {page === 'checklist' && <ShiftChecklist staff={staff} />}
        {page === 'incident' && (
          <IncidentReport
            staff={staff}
            onNewIncident={() => setUnreadIncidents(u => u + 1)}
          />
        )}
        {page === 'playbooks' && <Playbooks staff={staff} />}
        {page === 'bot' && <BotQA staff={staff} />}
        {page === 'admin' && canAdmin && <Admin staff={staff} />}
      </main>
    </div>
  )
}
