import { useState, useEffect } from 'react'
import { getSession, signOut } from './lib/supabase'
import Login from './pages/Login'
import ShiftChecklist from './pages/ShiftChecklist'
import IncidentReport from './pages/IncidentReport'
import Playbooks from './pages/Playbooks'
import BotQA from './pages/BotQA'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('checklist')
  const [unreadIncidents, setUnreadIncidents] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

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
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="app-loading">Loading...</div>
  }

  if (!session) {
    return <Login onLogin={() => setSession(true)} />
  }

  return (
    <div className="app">
      <nav className="app-nav">
        <button
          className={`nav-btn ${page === 'checklist' ? 'active' : ''}`}
          onClick={() => setPage('checklist')}
        >
          Checklist
        </button>
        <button
          className={`nav-btn ${page === 'incident' ? 'active' : ''}`}
          onClick={() => setPage('incident')}
        >
          Report Issue
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
          onClick={() => {
            setPage('bot')
            setUnreadMessages(0)
          }}
        >
          💬 Bot
          {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
        </button>
        <button
          className="nav-btn logout"
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
        {page === 'checklist' && <ShiftChecklist />}
        {page === 'incident' && <IncidentReport onNewIncident={() => setUnreadIncidents(u => u + 1)} />}
        {page === 'playbooks' && <Playbooks />}
        {page === 'bot' && <BotQA />}
      </main>
    </div>
  )
}
