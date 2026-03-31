import { useState } from 'react'
import '../styles/IncidentReport.css'

const CATEGORIES = [
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'safety', label: 'Safety', icon: '⚠️' },
  { id: 'guest_complaint', label: 'Guest Complaint', icon: '😕' },
  { id: 'other', label: 'Other', icon: '❓' },
]

export default function IncidentReport({ onNewIncident }) {
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoPreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!category || !description.trim()) {
      alert('Please select a category and add a description.')
      return
    }

    setLoading(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)

    // In real app, post to Supabase here
    console.log('Incident reported:', { category, description, photo })

    setSubmitted(true)
    onNewIncident?.()

    // Reset form
    setTimeout(() => {
      setCategory('')
      setDescription('')
      setPhoto(null)
      setPhotoPreview(null)
      setSubmitted(false)
    }, 2000)
  }

  if (submitted) {
    return (
      <div className="incident-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Incident Reported</h2>
          <p>Manager has been notified. You will receive updates here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="incident-container">
      <div className="incident-header">
        <h1>Report an Issue</h1>
        <p>Quickly notify the manager about maintenance, safety, or guest concerns.</p>
      </div>

      <form onSubmit={handleSubmit} className="incident-form">
        {/* CATEGORY SELECTION */}
        <div className="form-section">
          <label className="form-label">Category *</label>
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-btn ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="form-section">
          <label htmlFor="description" className="form-label">
            What happened? *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={5}
            className="form-textarea"
          />
          <p className="char-count">
            {description.length} characters
          </p>
        </div>

        {/* PHOTO UPLOAD */}
        <div className="form-section">
          <label htmlFor="photo" className="form-label">
            Attach a photo (optional)
          </label>
          <label htmlFor="photo" className="photo-input-label">
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
            />
            <span className="photo-input-text">📷 Choose photo from camera or library</span>
          </label>

          {photoPreview && (
            <div className="photo-preview-incident">
              <img src={photoPreview} alt="Incident photo" />
              <button
                type="button"
                className="btn-remove-photo"
                onClick={() => {
                  setPhoto(null)
                  setPhotoPreview(null)
                }}
              >
                ✕ Remove
              </button>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Submitting...' : 'Report Incident'}
        </button>
      </form>

      {/* RECENT INCIDENTS */}
      <div className="recent-incidents">
        <h3>Recent Reports</h3>
        <p className="recent-empty">No incidents reported today.</p>
      </div>
    </div>
  )
}
