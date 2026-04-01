import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/Admin.css'

const ROLES = ['Manager', 'Team Leader', 'Housekeeping', 'Kitchen Staff', 'Maintenance', 'Volunteer']

const ROLE_COLORS = {
  'Manager': 'role-manager',
  'Team Leader': 'role-leader',
  'Housekeeping': 'role-housekeeping',
  'Kitchen Staff': 'role-kitchen',
  'Maintenance': 'role-maintenance',
  'Volunteer': 'role-volunteer',
}

const APP_URL = window.location.origin

export default function Admin({ staff }) {
  const [tab, setTab] = useState('staff') // 'staff' | 'invite' | 'incidents'
  const [staffList, setStaffList] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Invite form
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Housekeeping')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteError, setInviteError] = useState('')

  const propertyId = staff?.property_id

  useEffect(() => {
    if (propertyId) {
      loadStaff()
      loadIncidents()
    }
  }, [propertyId])

  async function loadStaff() {
    setLoading(true)
    setError('')
    try {
      if (!supabase) {
        // Demo mode
        setStaffList([
          { id: 'demo-1', name: 'Demo Manager', email: 'manager@demo.co', role: 'Manager', status: 'active', has_account: true },
          { id: 'demo-2', name: 'Ana García', email: 'ana@demo.co', role: 'Housekeeping', status: 'active', has_account: false },
          { id: 'demo-3', name: 'Carlos López', email: 'carlos@demo.co', role: 'Kitchen Staff', status: 'active', has_account: true },
        ])
        return
      }
      const { data, error: err } = await supabase.rpc('get_property_staff', { prop_id: propertyId })
      if (err) throw err
      setStaffList(data || [])
    } catch (err) {
      setError('Could not load staff: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadIncidents() {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('incidents')
        .select('id, category, severity, description, status, created_at, staff_id')
        .eq('property_id', propertyId)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(20)
      setIncidents(data || [])
    } catch (_) {}
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInviteError('')
    setInviteLink('')
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Name and email are required.')
      return
    }

    setInviteLoading(true)
    try {
      if (!supabase) {
        // Demo: generate fake token
        const fakeToken = 'demo-' + Math.random().toString(36).slice(2)
        setInviteLink(`${APP_URL}/?invite=${fakeToken}`)
        return
      }
      const { data, error: err } = await supabase.rpc('create_invitation', {
        prop_id: propertyId,
        staff_email: inviteEmail.trim().toLowerCase(),
        staff_name: inviteName.trim(),
        staff_role: inviteRole,
      })
      if (err) throw err
      if (!data.success) throw new Error(data.error)
      setInviteLink(`${APP_URL}/?invite=${data.token}`)
      setInviteName('')
      setInviteEmail('')
      await loadStaff()
    } catch (err) {
      setInviteError('Error: ' + err.message)
    } finally {
      setInviteLoading(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink)
    } catch {
      // fallback: select text
    }
  }

  async function updateIncidentStatus(incidentId, newStatus) {
    if (!supabase) return
    await supabase.from('incidents').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', incidentId)
    loadIncidents()
  }

  const severityColor = { low: '#27ae60', medium: '#f39c12', high: '#e67e22', critical: '#e74c3c' }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>👑 Admin Panel</h1>
        <p>Manage staff, invitations, and open incidents</p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'staff' ? 'active' : ''}`} onClick={() => setTab('staff')}>
          👥 Staff
          <span className="tab-count">{staffList.length}</span>
        </button>
        <button className={`admin-tab ${tab === 'invite' ? 'active' : ''}`} onClick={() => setTab('invite')}>
          ✉️ Invite
        </button>
        <button className={`admin-tab ${tab === 'incidents' ? 'active' : ''}`} onClick={() => setTab('incidents')}>
          🚨 Incidents
          {incidents.length > 0 && <span className="tab-count tab-count-red">{incidents.length}</span>}
        </button>
      </div>

      {/* ─── STAFF TAB ─── */}
      {tab === 'staff' && (
        <div className="admin-section">
          {error && <div className="admin-error">{error}</div>}
          {loading ? (
            <div className="admin-loading">Loading staff...</div>
          ) : (
            <div className="staff-list">
              {staffList.length === 0 && (
                <div className="admin-empty">No staff found. Invite your first team member.</div>
              )}
              {staffList.map(member => (
                <div key={member.id} className="staff-card">
                  <div className="staff-avatar">
                    {(member.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="staff-info">
                    <div className="staff-name">{member.name}</div>
                    <div className="staff-email">{member.email}</div>
                  </div>
                  <div className="staff-meta">
                    <span className={`role-badge ${ROLE_COLORS[member.role] || ''}`}>{member.role}</span>
                    <span className={`account-status ${member.has_account ? 'linked' : 'pending'}`}>
                      {member.has_account ? '✓ Active' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="btn-invite-cta" onClick={() => setTab('invite')}>
            + Invite team member
          </button>
        </div>
      )}

      {/* ─── INVITE TAB ─── */}
      {tab === 'invite' && (
        <div className="admin-section">
          <div className="invite-info">
            <p>Generate a secure invite link for a new team member. The link expires in <strong>7 days</strong>.</p>
          </div>

          <form className="invite-form" onSubmit={handleInvite}>
            <div className="invite-field">
              <label>Full name *</label>
              <input
                className="invite-input"
                type="text"
                placeholder="Ana García"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                required
              />
            </div>

            <div className="invite-field">
              <label>Email address *</label>
              <input
                className="invite-input"
                type="email"
                placeholder="ana@property.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
              />
            </div>

            <div className="invite-field">
              <label>Role</label>
              <div className="role-selector">
                {ROLES.map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`role-option ${inviteRole === r ? 'selected' : ''}`}
                    onClick={() => setInviteRole(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {inviteError && <div className="admin-error">{inviteError}</div>}

            <button type="submit" className="btn-generate-invite" disabled={inviteLoading}>
              {inviteLoading ? '⏳ Generating...' : '🔗 Generate invite link'}
            </button>
          </form>

          {inviteLink && (
            <div className="invite-result">
              <div className="invite-result-header">
                <span>✅ Invite link ready!</span>
                <span className="invite-expires">Expires in 7 days</span>
              </div>
              <div className="invite-link-box">
                <span className="invite-link-text">{inviteLink}</span>
                <button className="btn-copy" onClick={copyLink}>Copy</button>
              </div>
              <p className="invite-instructions">
                Share this link with <strong>{inviteEmail || 'the team member'}</strong>. They will create their password and join automatically.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── INCIDENTS TAB ─── */}
      {tab === 'incidents' && (
        <div className="admin-section">
          {incidents.length === 0 ? (
            <div className="admin-empty">✅ No open incidents</div>
          ) : (
            <div className="incidents-list">
              {incidents.map(inc => (
                <div key={inc.id} className="incident-admin-card">
                  <div className="incident-admin-top">
                    <span
                      className="severity-dot"
                      style={{ background: severityColor[inc.severity] || '#888' }}
                    />
                    <span className="incident-category">{inc.category}</span>
                    <span className="incident-status-badge">{inc.status}</span>
                    <span className="incident-date">
                      {new Date(inc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="incident-desc">{inc.description}</p>
                  <div className="incident-admin-actions">
                    {inc.status === 'open' && (
                      <button
                        className="btn-incident-action"
                        onClick={() => updateIncidentStatus(inc.id, 'in_progress')}
                      >
                        Mark In Progress
                      </button>
                    )}
                    <button
                      className="btn-incident-action btn-resolve"
                      onClick={() => updateIncidentStatus(inc.id, 'resolved')}
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
