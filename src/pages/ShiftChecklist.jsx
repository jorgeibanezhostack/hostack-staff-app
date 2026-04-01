import { useState, useEffect } from 'react'
import '../styles/ShiftChecklist.css'

// DEMO DATA: Replace with Supabase query
const DEMO_TASKS = [
  {
    id: 1,
    title: 'Breakfast prep & service',
    category: 'Service',
    estimatedMinutes: 60,
    status: 'todo', // todo | in_progress | done | escalated
    dueTime: '08:00',
    notes: 'Prepare breakfast for guests in Rooms 1-5',
  },
  {
    id: 2,
    title: 'Guest room turnover',
    category: 'Housekeeping',
    estimatedMinutes: 90,
    status: 'in_progress',
    dueTime: '10:00',
    notes: 'Turnover Rooms 6-12',
  },
  {
    id: 3,
    title: 'Check boiler pressure',
    category: 'Maintenance',
    estimatedMinutes: 15,
    status: 'todo',
    dueTime: '09:00',
    notes: 'Check pressure gauge, record reading',
  },
  {
    id: 4,
    title: 'Lunch prep',
    category: 'Service',
    estimatedMinutes: 45,
    status: 'todo',
    dueTime: '12:00',
    notes: 'Lunch service at 13:00',
  },
  {
    id: 5,
    title: 'Laundry & linen service',
    category: 'Housekeeping',
    estimatedMinutes: 120,
    status: 'todo',
    dueTime: '14:00',
    notes: 'Collect & process bed linens, towels',
  },
]

export default function ShiftChecklist({ staff }) {
  const [tasks, setTasks] = useState(DEMO_TASKS)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [showPhoto, setShowPhoto] = useState(null)

  const completedCount = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length
  const progressPercent = (completedCount / totalTasks) * 100

  function updateTaskStatus(taskId, newStatus) {
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ))
  }

  function toggleExpanded(taskId) {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId)
  }

  function handlePhotoUpload(taskId, e) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setShowPhoto({ taskId, src: event.target.result })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="checklist-container">
      {/* HEADER */}
      <div className="checklist-header">
        <h1>Today's Shift</h1>
        <p className="checklist-subtitle">
          {completedCount} of {totalTasks} tasks completed
        </p>
      </div>

      {/* PROGRESS BAR */}
      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="progress-text">{Math.round(progressPercent)}% complete</p>
      </div>

      {/* TASKS LIST */}
      <div className="tasks-list">
        {tasks.map((task) => (
          <div key={task.id} className={`task-card task-status-${task.status}`}>
            {/* TASK HEADER */}
            <div
              className="task-header"
              onClick={() => toggleExpanded(task.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="task-checkbox">
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={(e) => {
                    e.stopPropagation()
                    updateTaskStatus(task.id, e.target.checked ? 'done' : 'todo')
                  }}
                />
              </div>

              <div className="task-content">
                <h3 className="task-title">{task.title}</h3>
                <p className="task-meta">
                  <span className="task-category">{task.category}</span>
                  <span className="task-time">{task.dueTime}</span>
                  <span className="task-duration">{task.estimatedMinutes} min</span>
                </p>
              </div>

              <div className="task-status-badge">
                <span className={`badge badge-${task.status}`}>
                  {task.status === 'todo' ? '📋' :
                   task.status === 'in_progress' ? '⏳' :
                   task.status === 'done' ? '✓' : '⚠️'}
                </span>
              </div>
            </div>

            {/* TASK DETAILS (EXPANDED) */}
            {expandedTaskId === task.id && (
              <div className="task-details">
                <div className="details-content">
                  <p className="task-notes">{task.notes}</p>

                  {/* ACTION BUTTONS */}
                  <div className="task-actions">
                    {task.status !== 'done' && (
                      <>
                        <button
                          className="btn-action btn-progress"
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        >
                          Start Task
                        </button>
                        <button
                          className="btn-action btn-escalate"
                          onClick={() => updateTaskStatus(task.id, 'escalated')}
                        >
                          Escalate
                        </button>
                      </>
                    )}

                    {task.status === 'in_progress' && (
                      <button
                        className="btn-action btn-complete"
                        onClick={() => updateTaskStatus(task.id, 'done')}
                      >
                        Mark Complete
                      </button>
                    )}

                    {task.status === 'escalated' && (
                      <p className="escalated-note">
                        🚨 Escalated to manager. Awaiting response.
                      </p>
                    )}

                    <label className="btn-action btn-photo">
                      📷 Add Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(task.id, e)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {/* PHOTO PREVIEW */}
                  {showPhoto?.taskId === task.id && (
                    <div className="photo-preview">
                      <img src={showPhoto.src} alt="Task photo" />
                      <button
                        className="btn-close"
                        onClick={() => setShowPhoto(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SYNC STATUS */}
      <div className="sync-status">
        <p className="sync-text">✓ All changes synced</p>
      </div>
    </div>
  )
}
