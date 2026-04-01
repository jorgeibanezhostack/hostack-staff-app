// Bot Engine for Hostack Staff App
// Handles searching playbooks, tasks, and incidents with keyword matching

// Role-based access control mapping
export const ROLE_PERMISSIONS = {
  'Team Leader': ['housekeeping', 'breakfast', 'team_leader', 'operations'],
  'Manager': ['housekeeping', 'breakfast', 'team_leader', 'operations', 'maintenance'],
  'Volunteer': ['housekeeping', 'breakfast', 'guest_service'],
  'Kitchen Staff': ['breakfast', 'guest_service'],
  'Housekeeping': ['housekeeping', 'guest_service'],
  'Maintenance': ['maintenance', 'operations'],
}

// Stop words to filter out from questions
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'am', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'can', 'como',
  'que', 'el', 'la', 'los', 'las', 'de', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'pero', 'en', 'a', 'por', 'para'
])

/**
 * Tokenize question into keywords, removing stop words
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .match(/\b[\w\u00C0-\u017F]+\b/g) // Support Spanish characters
    ?.filter(word => !STOP_WORDS.has(word))
    .filter(word => word.length > 2) // Minimum 3 characters
    || []
}

/**
 * Calculate keyword match score for a text
 */
function calculateMatchScore(text, keywords) {
  if (!text || !keywords.length) return 0

  let score = 0
  const textLower = text.toLowerCase()

  keywords.forEach(keyword => {
    // Count occurrences
    const matches = (textLower.match(new RegExp(keyword, 'g')) || []).length
    score += matches * 2 // Weight each match

    // Bonus for whole word matches in title/headers
    if (textLower.match(new RegExp(`\\b${keyword}\\b`, 'i'))) {
      score += 3
    }
  })

  return score
}

/**
 * Search playbooks by keywords
 * Respects role-based access control
 */
export function searchPlaybooks(question, playbooks, userRole = 'All') {
  const keywords = tokenize(question)
  if (keywords.length === 0) return []

  // Get user permissions
  const userPermissions = userRole && userRole !== 'All'
    ? ROLE_PERMISSIONS[userRole] || []
    : null

  const results = playbooks
    .map(playbook => {
      // Check role-based access
      if (userPermissions) {
        const hasAccess = playbook.access_keys?.some(key => userPermissions.includes(key))
        if (!hasAccess) return null
      }

      // Calculate match scores
      const titleScore = calculateMatchScore(playbook.title, keywords) * 3
      const contentScore = calculateMatchScore(playbook.content_text, keywords)
      const categoryScore = keywords.some(k =>
        playbook.category.toLowerCase().includes(k)
      ) ? 5 : 0

      const totalScore = titleScore + contentScore + categoryScore

      if (totalScore === 0) return null

      // Extract relevant section from content
      const relevantSection = extractRelevantSection(playbook.content_text, keywords)

      return {
        type: 'playbook',
        id: playbook.id,
        title: playbook.title,
        category: playbook.category,
        subcategory: playbook.subcategory,
        content_type: playbook.content_type,
        relevantSection,
        score: totalScore,
        fullContent: playbook.content_text
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)

  return results
}

/**
 * Search active tasks by keywords
 */
export function searchActiveTasks(question, tasks, staffId = null) {
  const keywords = tokenize(question)
  if (keywords.length === 0) return []

  const results = tasks
    .map(task => {
      // Filter by user if needed (demo mode uses null)
      if (staffId && task.staff_id !== staffId) return null

      // Don't show completed tasks
      if (task.status === 'done' || task.status === 'completed') return null

      const titleScore = calculateMatchScore(task.title, keywords) * 3
      const categoryScore = calculateMatchScore(task.category, keywords) * 2
      const notesScore = calculateMatchScore(task.notes || '', keywords)

      const totalScore = titleScore + categoryScore + notesScore

      if (totalScore === 0) return null

      return {
        type: 'task',
        id: task.id,
        title: task.title,
        category: task.category,
        status: task.status,
        due_time: task.due_time,
        estimated_minutes: task.estimated_minutes,
        notes: task.notes,
        score: totalScore
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)

  return results
}

/**
 * Search incidents by keywords
 */
export function searchIncidents(question, incidents, staffId = null) {
  const keywords = tokenize(question)
  if (keywords.length === 0) return []

  const results = incidents
    .map(incident => {
      // Filter by user if needed
      if (staffId && incident.staff_id !== staffId && incident.assigned_to !== staffId) {
        return null
      }

      const categoryScore = calculateMatchScore(incident.category, keywords) * 2
      const descriptionScore = calculateMatchScore(incident.description, keywords)
      const severityScore = keywords.some(k =>
        incident.severity.toLowerCase().includes(k)
      ) ? 3 : 0

      const totalScore = categoryScore + descriptionScore + severityScore

      if (totalScore === 0) return null

      return {
        type: 'incident',
        id: incident.id,
        category: incident.category,
        severity: incident.severity,
        description: incident.description,
        status: incident.status,
        created_at: incident.created_at,
        score: totalScore
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)

  return results
}

/**
 * Rank and combine all results
 */
export function rankResults(playbookResults, taskResults, incidentResults, weights = {}) {
  const { playbook: pw = 3, task: tw = 2, incident: iw = 1.5 } = weights

  const allResults = [
    ...playbookResults.map(r => ({ ...r, weight: pw })),
    ...taskResults.map(r => ({ ...r, weight: tw })),
    ...incidentResults.map(r => ({ ...r, weight: iw }))
  ]

  // Adjust scores by weight and limit to top results
  return allResults
    .map(r => ({ ...r, weightedScore: r.score * r.weight }))
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 5) // Return top 5 results
}

/**
 * Extract relevant section from playbook content
 */
export function extractRelevantSection(content, keywords) {
  if (!content) return ''

  const lines = content.split('\n')
  const relevantLines = []
  let currentSection = ''
  let inRelevantSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineScore = calculateMatchScore(line, keywords)

    if (lineScore > 0) {
      // Include section header if we find relevant content
      if (currentSection && !relevantLines.includes(currentSection)) {
        relevantLines.push(currentSection)
      }
      relevantLines.push(line)
      inRelevantSection = true
    } else if (line.startsWith('##') || line.startsWith('###')) {
      // Track section headers
      currentSection = line
      inRelevantSection = false
    }
  }

  return relevantLines.slice(0, 10).join('\n') // Return first 10 relevant lines
}

/**
 * Format response for display
 */
export function formatResponse(results) {
  if (!results || results.length === 0) {
    return {
      message: 'No results found. Try a different question or browse the Playbooks section.',
      results: []
    }
  }

  const message = `Found ${results.length} relevant result${results.length > 1 ? 's' : ''}`

  return {
    message,
    results
  }
}

/**
 * Main search function - orchestrates all searches
 */
export function searchAll(question, playbooks, tasks, incidents, userRole = 'All', staffId = null) {
  const playbookResults = searchPlaybooks(question, playbooks, userRole)
  const taskResults = searchActiveTasks(question, tasks, staffId)
  const incidentResults = searchIncidents(question, incidents, staffId)

  const rankedResults = rankResults(playbookResults, taskResults, incidentResults)
  const formattedResponse = formatResponse(rankedResults)

  return {
    ...formattedResponse,
    rawResults: {
      playbooks: playbookResults,
      tasks: taskResults,
      incidents: incidentResults
    },
    rankedResults
  }
}
