import { useState } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/SOPUpload.css'

const CATEGORIES = [
  'Housekeeping',
  'Kitchen Operations',
  'Breakfast',
  'Maintenance',
  'Safety & Maintenance',
  'Guest Service',
  'Operations',
  'General',
]

const DOC_TYPES = ['SOP', 'Checklist', 'Guide', 'Procedure', 'Policy']

const ALL_ROLES = ['Manager', 'Team Leader', 'Volunteer', 'Kitchen Staff', 'Housekeeping', 'Maintenance']

const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440000'

export default function SOPUpload({ staffId, staffRole, onBack }) {
  const [step, setStep] = useState('form') // 'form' | 'preview' | 'saving' | 'saved'
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [docType, setDocType] = useState(DOC_TYPES[0])
  const [roles, setRoles] = useState(['Manager', 'Team Leader'])
  const [content, setContent] = useState('')
  const [sections, setSections] = useState([])
  const [error, setError] = useState('')

  // Only managers/team leaders can upload
  const canUpload = ['Manager', 'Team Leader'].includes(staffRole)
  if (!canUpload) {
    return (
      <div className="sop-access-denied">
        <span>🔒</span>
        <h3>Acceso restringido</h3>
        <p>Solo Managers y Team Leaders pueden cargar documentos.</p>
        <button className="btn-secondary" onClick={onBack}>← Volver</button>
      </div>
    )
  }

  function toggleRole(role) {
    setRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  function parseSections(text) {
    const lines = text.split('\n')
    const result = []
    let current = null
    let sectionNum = 0

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (current && current.content.trim()) result.push(current)
        sectionNum++
        current = {
          number: sectionNum,
          title: line.replace(/^##\s+/, '').trim(),
          content: '',
        }
      } else if (line.startsWith('# ')) {
        // Skip main title
      } else if (current) {
        current.content += line + '\n'
      } else if (line.trim() && !line.startsWith('#')) {
        sectionNum++
        current = { number: sectionNum, title: 'General', content: line + '\n' }
      }
    }
    if (current && current.content.trim()) result.push(current)

    // If no ## headers found, treat whole document as one section
    if (result.length === 0 && text.trim()) {
      result.push({ number: 1, title: 'Contenido Principal', content: text.trim() })
    }

    return result
  }

  function handlePreview() {
    setError('')
    if (!title.trim()) { setError('El título es obligatorio.'); return }
    if (!content.trim()) { setError('El contenido es obligatorio.'); return }
    if (roles.length === 0) { setError('Selecciona al menos un rol.'); return }

    const parsed = parseSections(content)
    setSections(parsed)
    setStep('preview')
  }

  function extractKeywords(text) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'if', 'is', 'it', 'be', 'as', 'by', 'that', 'this', 'with', 'from', 'all', 'are', 'was', 'not', 'do', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'que', 'en', 'con', 'se', 'si'])
    return [...new Set(
      text.toLowerCase()
        .replace(/[^a-záéíóúñ\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w))
    )].slice(0, 12)
  }

  async function handleSave() {
    setStep('saving')
    setError('')
    try {
      // Insert playbook
      const { data: playbook, error: pbErr } = await supabase
        .from('playbooks')
        .insert({
          property_id: PROPERTY_ID,
          title: title.trim(),
          category,
          content_type: docType,
          content_text: content.trim(),
          role_tags: roles,
          is_archived: false,
        })
        .select()
        .single()

      if (pbErr) throw pbErr

      // Insert document sections
      if (sections.length > 0) {
        const sectionRows = sections.map(s => ({
          playbook_id: playbook.id,
          section_number: s.number,
          section_title: s.title,
          section_content: s.content.trim(),
          keywords: extractKeywords(s.title + ' ' + s.content),
        }))

        const { error: secErr } = await supabase
          .from('document_sections')
          .insert(sectionRows)

        if (secErr) console.warn('Section insert warning:', secErr.message)
      }

      setStep('saved')
    } catch (err) {
      setError('Error al guardar: ' + err.message)
      setStep('preview')
    }
  }

  function handleReset() {
    setTitle('')
    setCategory(CATEGORIES[0])
    setDocType(DOC_TYPES[0])
    setRoles(['Manager', 'Team Leader'])
    setContent('')
    setSections([])
    setError('')
    setStep('form')
  }

  // ─── SAVED STATE ───────────────────────────────────────────────────────────
  if (step === 'saved') {
    return (
      <div className="sop-saved">
        <div className="sop-saved-icon">✅</div>
        <h2>Documento guardado</h2>
        <p><strong>{title}</strong> fue publicado en la base de datos.</p>
        <p className="sop-saved-note">El bot de WhatsApp ya puede responder preguntas sobre este documento.</p>
        <div className="sop-saved-actions">
          <button className="btn-primary" onClick={handleReset}>+ Subir otro documento</button>
          <button className="btn-secondary" onClick={onBack}>← Volver a Playbooks</button>
        </div>
      </div>
    )
  }

  // ─── PREVIEW STATE ─────────────────────────────────────────────────────────
  if (step === 'preview' || step === 'saving') {
    return (
      <div className="sop-preview">
        <button className="btn-back" onClick={() => setStep('form')}>← Editar</button>

        <div className="sop-preview-header">
          <h2>Vista previa del documento</h2>
          <p>Revisa las secciones antes de publicar</p>
        </div>

        <div className="sop-meta-preview">
          <span className="meta-pill">{docType}</span>
          <span className="meta-pill">{category}</span>
          <span className="meta-pill roles">👥 {roles.join(', ')}</span>
        </div>

        <h1 className="sop-preview-title">{title}</h1>

        <div className="sop-sections-list">
          {sections.map((s, idx) => (
            <div key={idx} className="sop-section-card">
              <div className="sop-section-number">Sección {s.number}</div>
              <h3 className="sop-section-title">{s.title}</h3>
              <pre className="sop-section-content">{s.content.trim()}</pre>
            </div>
          ))}
        </div>

        <div className="sop-section-summary">
          <span>📂 {sections.length} sección(es) detectadas</span>
          <span>🤖 El bot buscará por sección para respuestas precisas</span>
        </div>

        {error && <p className="sop-error">{error}</p>}

        <div className="sop-preview-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={step === 'saving'}
          >
            {step === 'saving' ? '⏳ Guardando...' : '✅ Publicar documento'}
          </button>
          <button className="btn-secondary" onClick={() => setStep('form')}>← Editar</button>
        </div>
      </div>
    )
  }

  // ─── FORM STATE ────────────────────────────────────────────────────────────
  return (
    <div className="sop-upload">
      <div className="sop-upload-header">
        <button className="btn-back" onClick={onBack}>← Volver</button>
        <h1>📄 Subir SOP / Playbook</h1>
        <p>Agrega documentos reales y el bot de WhatsApp responderá con su contenido.</p>
      </div>

      <div className="sop-form">
        {/* Title */}
        <div className="sop-field">
          <label>Título del documento *</label>
          <input
            type="text"
            className="sop-input"
            placeholder="ej: Limpieza de habitaciones - Procedimiento completo"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Category + Type row */}
        <div className="sop-field-row">
          <div className="sop-field">
            <label>Categoría *</label>
            <select
              className="sop-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sop-field">
            <label>Tipo de documento</label>
            <select
              className="sop-select"
              value={docType}
              onChange={e => setDocType(e.target.value)}
            >
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Roles */}
        <div className="sop-field">
          <label>Roles con acceso *</label>
          <div className="sop-roles-grid">
            {ALL_ROLES.map(role => (
              <button
                key={role}
                type="button"
                className={`sop-role-toggle ${roles.includes(role) ? 'active' : ''}`}
                onClick={() => toggleRole(role)}
              >
                {roles.includes(role) ? '✓' : '+'} {role}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="sop-field">
          <label>Contenido del documento *</label>
          <div className="sop-content-hint">
            <span>💡 Tip: Usa <code>## Nombre de sección</code> para dividir el documento en secciones. El bot buscará por sección para dar respuestas más precisas.</span>
          </div>
          <textarea
            className="sop-textarea"
            placeholder={`## Preparación\n1. Primer paso\n2. Segundo paso\n\n## Procedimiento\n1. Descripción del procedimiento\n2. ...`}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={18}
          />
          <div className="sop-content-stats">
            <span>{content.split('##').length - 1} secciones detectadas</span>
            <span>{content.length} caracteres</span>
          </div>
        </div>

        {error && <p className="sop-error">{error}</p>}

        <div className="sop-form-actions">
          <button className="btn-primary" onClick={handlePreview}>
            Vista previa →
          </button>
        </div>
      </div>
    </div>
  )
}
