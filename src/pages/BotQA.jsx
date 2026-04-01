import { useState, useEffect } from 'react'
import { searchAll, ROLE_PERMISSIONS } from '../lib/botEngine'
import '../styles/BotQA.css'

// Demo tasks for testing
const DEMO_TASKS = [
  {
    id: '1',
    staff_id: 'demo-staff',
    title: 'Breakfast prep & service',
    category: 'Service',
    status: 'todo',
    due_time: '08:00',
    estimated_minutes: 60,
    notes: 'Prepare dining area and food service'
  },
  {
    id: '2',
    staff_id: 'demo-staff',
    title: 'Guest room turnover',
    category: 'Housekeeping',
    status: 'in_progress',
    due_time: '10:00',
    estimated_minutes: 90,
    notes: 'Change beds, clean bathroom, restock amenities'
  },
  {
    id: '3',
    staff_id: 'demo-staff',
    title: 'Check boiler pressure',
    category: 'Maintenance',
    status: 'todo',
    due_time: '09:00',
    estimated_minutes: 15,
    notes: 'Regular maintenance check'
  }
]

// Demo incidents for testing
const DEMO_INCIDENTS = [
  {
    id: 'inc-1',
    staff_id: 'demo-staff',
    category: 'Maintenance',
    severity: 'medium',
    description: 'Shower in Main Bedroom not draining properly. Needs plumber inspection.',
    status: 'open',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'inc-2',
    staff_id: 'demo-staff',
    category: 'Guest Complaint',
    severity: 'low',
    description: 'Guest requested extra towels and shampoo for Cottage 1.',
    status: 'open',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
]

export default function BotQA() {
  const [question, setQuestion] = useState('')
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const [playbooks, setPlaybooks] = useState([])
  const [userRole, setUserRole] = useState('All')

  // Load playbooks and conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('staff_playbooks')
    if (saved) {
      setPlaybooks(JSON.parse(saved))
    }

    const savedConversations = localStorage.getItem('staff_bot_conversations')
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations))
    }
  }, [])

  // Handle question submission
  async function handleAskQuestion(e) {
    e.preventDefault()
    if (!question.trim()) return

    setLoading(true)

    // Simulate slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      // Perform search
      const response = searchAll(
        question,
        playbooks,
        DEMO_TASKS,
        DEMO_INCIDENTS,
        userRole,
        'demo-staff'
      )

      // Create conversation entry
      const conversation = {
        id: Date.now(),
        question: question.trim(),
        response,
        timestamp: new Date().toISOString(),
        userRole
      }

      const updatedConversations = [conversation, ...conversations]
      setConversations(updatedConversations)
      localStorage.setItem('staff_bot_conversations', JSON.stringify(updatedConversations))

      // Clear input
      setQuestion('')
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  // Copy text to clipboard
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="bot-qa-container">
      <div className="bot-qa-header">
        <h1>💬 Bot Assistant</h1>
        <p>Ask questions about operations, tasks, and incidents. The bot searches across playbooks, your current tasks, and recent incidents.</p>
      </div>

      {/* Role Filter */}
      <div className="bot-role-filter">
        <label htmlFor="role-select">Your Role:</label>
        <select
          id="role-select"
          value={userRole}
          onChange={(e) => setUserRole(e.target.value)}
          className="role-select"
        >
          <option value="All">All (Show all content)</option>
          {Object.keys(ROLE_PERMISSIONS).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {/* Question Input */}
      <form className="bot-question-form" onSubmit={handleAskQuestion}>
        <input
          type="text"
          placeholder="Ask anything: 'How do I clean a guest room?' or 'What are my tasks?' or 'What happened with the shower issue?'"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="bot-question-input"
          disabled={loading}
        />
        <button
          type="submit"
          className="bot-submit-btn"
          disabled={loading || !question.trim()}
        >
          {loading ? 'Searching...' : 'Ask'}
        </button>
      </form>

      {/* Conversation History */}
      <div className="bot-conversations">
        {conversations.length === 0 ? (
          <div className="bot-empty-state">
            <p>No questions yet</p>
            <small>Start by asking a question above</small>
          </div>
        ) : (
          conversations.map(conv => (
            <div key={conv.id} className="bot-conversation-item">
              <div className="bot-question-box">
                <p className="bot-question-text">You: {conv.question}</p>
                <small className="bot-question-meta">Role: {conv.userRole}</small>
              </div>

              {/* Response Section */}
              <div className="bot-response-box">
                <p className="bot-response-header">🤖 {conv.response.message}</p>

                {conv.response.rankedResults.length > 0 ? (
                  <div className="bot-results">
                    {conv.response.rankedResults.map((result, idx) => (
                      <div key={idx} className={`bot-result-item bot-result-${result.type}`}>
                        <div className="bot-result-header">
                          <span className="bot-result-type">
                            {result.type === 'playbook' && '📖'}
                            {result.type === 'task' && '✓'}
                            {result.type === 'incident' && '⚠️'}
                          </span>
                          <span className="bot-result-title">{result.title || result.category}</span>
                          <span className="bot-result-score">{Math.round(result.weightedScore || result.score)}</span>
                        </div>

                        {/* Playbook Results */}
                        {result.type === 'playbook' && (
                          <div className="bot-result-content">
                            <p className="bot-meta">
                              <strong>{result.category}</strong>
                              {result.subcategory && ` • ${result.subcategory}`}
                            </p>
                            {result.relevantSection && (
                              <div className="bot-relevant-section">
                                {result.relevantSection.split('\n').map((line, i) => {
                                  if (line.startsWith('##')) {
                                    return <h4 key={i}>{line.replace('## ', '')}</h4>
                                  }
                                  if (line.startsWith('###')) {
                                    return <h5 key={i}>{line.replace('### ', '')}</h5>
                                  }
                                  if (line.startsWith('- ')) {
                                    return <li key={i}>{line.replace('- ', '')}</li>
                                  }
                                  if (line.trim()) {
                                    return <p key={i}>{line}</p>
                                  }
                                  return null
                                })}
                              </div>
                            )}
                            <button
                              className="bot-copy-btn"
                              onClick={() => copyToClipboard(result.fullContent)}
                              title="Copy full content to clipboard"
                            >
                              📋 Copy Full Content
                            </button>
                          </div>
                        )}

                        {/* Task Results */}
                        {result.type === 'task' && (
                          <div className="bot-result-content">
                            <p className="bot-meta">
                              Status: <strong>{result.status.toUpperCase()}</strong> • Due: {result.due_time}
                            </p>
                            {result.notes && (
                              <p className="bot-notes">📝 {result.notes}</p>
                            )}
                          </div>
                        )}

                        {/* Incident Results */}
                        {result.type === 'incident' && (
                          <div className="bot-result-content">
                            <p className="bot-meta">
                              Severity: <strong>{result.severity.toUpperCase()}</strong> • Status: {result.status}
                            </p>
                            <p className="bot-incident-desc">{result.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="bot-no-results">No relevant results found. Try rephrasing your question.</p>
                )}

                <small className="bot-timestamp">
                  {new Date(conv.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bot-info">
        <h3>💡 Tips</h3>
        <ul>
          <li>Ask natural questions: "How do I prepare breakfast?" or "What are my tasks?"</li>
          <li>The bot searches playbooks, your current tasks, and recent incidents</li>
          <li>Results are filtered by your role (select above)</li>
          <li>Scroll up to see previous questions and answers</li>
        </ul>
      </div>
    </div>
  )
}
