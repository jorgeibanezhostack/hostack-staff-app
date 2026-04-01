import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER')
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// ─── TEMPLATES MULTIIDIOMA ──────────────────────────────────────────────────
const T = {
  en: {
    not_registered: (p: string) => `❌ Your number (${p}) is not registered.\nContact your manager to add you to the system.`,
    tasks_header: (n: string) => `✅ *Active tasks for ${n}:*\n\n`,
    task_row: (title: string, status: string, time?: string) =>
      `▪ ${title}${time ? ` ⏰ ${time}` : ''}\n   Status: ${status}\n\n`,
    incidents_header: () => `⚠️ *Open incidents assigned to you:*\n\n`,
    incident_row: (sev: string, cat: string, desc: string) =>
      `[▲ ${sev}] ${cat}\n${desc.substring(0, 120)}\n\n`,
    results_header: (q: string) => `📖 *"${q}":*\n\n`,
    results_footer: () => `—\n_Open the app for full document._`,
    no_results_with_tasks: (q: string, count: number) =>
      `No exact info found for "${q}".\n\n📋 Your ${count} active task(s):\n`,
    no_results: (q: string) =>
      `No results for "${q}".\n\n_Try: "clean room", "breakfast setup", "plumbing", "my tasks"_`,
  },
  es: {
    not_registered: (p: string) => `❌ Tu número (${p}) no está registrado.\nContacta a tu manager para que te agregue al sistema.`,
    tasks_header: (n: string) => `✅ *Tareas activas de ${n}:*\n\n`,
    task_row: (title: string, status: string, time?: string) =>
      `▪ ${title}${time ? ` ⏰ ${time}` : ''}\n   Estado: ${status}\n\n`,
    incidents_header: () => `⚠️ *Incidentes abiertos asignados a ti:*\n\n`,
    incident_row: (sev: string, cat: string, desc: string) =>
      `[▲ ${sev}] ${cat}\n${desc.substring(0, 120)}\n\n`,
    results_header: (q: string) => `📖 *"${q}":*\n\n`,
    results_footer: () => `—\n_Abre la app para el documento completo._`,
    no_results_with_tasks: (q: string, count: number) =>
      `No encontré info exacta sobre "${q}".\n\n📋 Tus ${count} tarea(s) activa(s):\n`,
    no_results: (q: string) =>
      `Sin resultados para "${q}".\n\n_Prueba: "limpiar habitación", "desayuno", "plomería", "mis tareas"_`,
  },
  pt: {
    not_registered: (p: string) => `❌ Seu número (${p}) não está cadastrado.\nContate seu gerente para ser adicionado ao sistema.`,
    tasks_header: (n: string) => `✅ *Tarefas ativas de ${n}:*\n\n`,
    task_row: (title: string, status: string, time?: string) =>
      `▪ ${title}${time ? ` ⏰ ${time}` : ''}\n   Status: ${status}\n\n`,
    incidents_header: () => `⚠️ *Incidentes abertos atribuídos a você:*\n\n`,
    incident_row: (sev: string, cat: string, desc: string) =>
      `[▲ ${sev}] ${cat}\n${desc.substring(0, 120)}\n\n`,
    results_header: (q: string) => `📖 *"${q}":*\n\n`,
    results_footer: () => `—\n_Abra o app para o documento completo._`,
    no_results_with_tasks: (q: string, count: number) =>
      `Nenhuma info exata para "${q}".\n\n📋 Suas ${count} tarefa(s) ativa(s):\n`,
    no_results: (q: string) =>
      `Sem resultados para "${q}".\n\n_Tente: "limpar quarto", "café da manhã", "encanamento", "minhas tarefas"_`,
  },
}

type Lang = keyof typeof T

// ─── DETECCIÓN DE IDIOMA ────────────────────────────────────────────────────
function detectLanguage(text: string): Lang {
  const t = text.toLowerCase()
  // Portuguese markers (must check before Spanish — many words overlap)
  const ptScore = ['como fazer', 'limpar', 'café da manhã', 'quarto', 'tarefa', 'minhas', 'olá',
    'obrigado', 'precisar', 'pode me', 'bom dia', 'boa tarde', 'ajuda', 'como posso']
    .filter(w => t.includes(w)).length
  // Spanish markers
  const esScore = ['cómo', 'como', 'cómo puedo', 'limpiar', 'habitación', 'desayuno',
    'tareas', 'hola', 'gracias', 'necesito', 'puedo', 'qué', 'qué es', 'mis', 'ayuda']
    .filter(w => t.includes(w)).length

  if (ptScore > esScore && ptScore > 0) return 'pt'
  if (esScore > 0) return 'es'
  return 'en'
}

// ─── MAIN HANDLER ───────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method !== 'POST') return new Response('OK', { status: 200 })

  try {
    const formData = await req.formData()
    const from = formData.get('From')?.toString() || ''
    const body = formData.get('Body')?.toString()?.trim() || ''
    const phone = from.replace('whatsapp:', '')

    console.log(`📱 [${phone}]: "${body}"`)

    // 1. Identificar staff
    const { data: staff } = await supabase
      .from('staff')
      .select('id, name, role, property_id, preferred_language')
      .eq('phone', phone)
      .single()

    if (!staff) {
      // Detect language even for unknown users
      const lang = detectLanguage(body)
      await sendWA(from, T[lang].not_registered(phone))
      return new Response('OK', { status: 200 })
    }

    // Determine language: staff preference > auto-detect from message
    const lang: Lang = (staff.preferred_language as Lang) ?? detectLanguage(body)
    const t = T[lang]

    console.log(`✓ Staff: ${staff.name} (${staff.role}) | lang: ${lang}`)

    // 2. Búsqueda de secciones con full-text search
    const { data: sections } = await supabase.rpc('search_sections', {
      query_text: body,
      prop_id: staff.property_id,
      max_results: 3
    })

    // 3. Tasks activas
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, description, status, due_date, due_time')
      .eq('assigned_to', staff.id)
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true })
      .limit(5)

    // 4. Incidents abiertos
    const { data: incidents } = await supabase
      .from('incidents')
      .select('description, severity, category, status')
      .eq('assigned_to', staff.id)
      .in('status', ['open', 'investigating'])
      .limit(3)

    // 5. Detectar intención
    const isTaskQuery = /\b(task|tasks|tarea|tareas|todo|pendiente|mis|my.*task|tarefa|tarefas|minhas)\b/i.test(body)
    const isIncidentQuery = /\b(incident|incidente|issue|problema|accident|happened|pasó|abiert|incidente)\b/i.test(body)

    // 6. Construir respuesta
    let response = ''

    if (isTaskQuery && tasks && tasks.length > 0) {
      response = t.tasks_header(staff.name)
      tasks.forEach(task => {
        response += t.task_row(task.title, task.status, task.due_time)
      })
    } else if (isIncidentQuery && incidents && incidents.length > 0) {
      response = t.incidents_header()
      incidents.forEach(i => {
        response += t.incident_row(i.severity, i.category, i.description)
      })
    } else if (sections && sections.length > 0) {
      const seen = new Set()
      response = t.results_header(body)
      for (const s of sections) {
        const key = `${s.playbook_title}:${s.section_title}`
        if (seen.has(key)) continue
        seen.add(key)
        response += `📌 *${s.playbook_title}*\n_${s.section_title}_\n${cleanContent(s.section_content)}\n\n`
      }
      response += t.results_footer()
    } else if (tasks && tasks.length > 0) {
      response = t.no_results_with_tasks(body, tasks.length)
      tasks.slice(0, 3).forEach(task => {
        response += `▪ ${task.title} [${task.status}]\n`
      })
    } else {
      response = t.no_results(body)
    }

    await sendWA(from, response)

    await supabase.from('whatsapp_conversations').insert({
      staff_id: staff.id,
      staff_phone: phone,
      question: body,
      answer: response,
      context: { lang, section_matches: sections?.length || 0, tasks: tasks?.length || 0 }
    })

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('❌ Error:', err.message)
    return new Response('OK', { status: 200 })
  }
})

function cleanContent(text: string): string {
  return text
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/^-\s+/gm, '• ')
    .replace(/\[\s*\]/g, '☐')
    .replace(/\[x\]/gi, '☑')
    .trim()
    .substring(0, 380)
}

async function sendWA(to: string, message: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
  const body = new URLSearchParams({
    From: TWILIO_WHATSAPP_NUMBER!,
    To: to.includes('whatsapp:') ? to : `whatsapp:${to}`,
    Body: message
  })
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })
  if (!res.ok) console.error(`Twilio ${res.status}: ${await res.text()}`)
}
