// WhatsApp Send Helper Function
// Sends proactive WhatsApp messages from the app to staff
// Used for notifications about incidents, task assignments, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)

// Twilio credentials
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioPhoneNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

// Rate limiting: max 5 messages per minute per staff member
const rateLimitMap = new Map<string, number[]>()

/**
 * Check rate limit
 */
function checkRateLimit(staffId: string): boolean {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  const times = rateLimitMap.get(staffId) || []
  const recentMessages = times.filter(t => t > oneMinuteAgo)

  if (recentMessages.length >= 5) {
    return false
  }

  recentMessages.push(now)
  rateLimitMap.set(staffId, recentMessages)
  return true
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsAppMessage(toNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    return { success: false, error: 'Missing Twilio credentials' }
  }

  try {
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)
    const formData = new URLSearchParams()
    formData.append('From', twilioPhoneNumber)
    formData.append('To', toNumber.startsWith('whatsapp:') ? toNumber : `whatsapp:${toNumber}`)
    formData.append('Body', message)

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send message:', error)
      return { success: false, error }
    }

    const data = await response.json()
    return { success: true, messageId: data.sid }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  // Only POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body = await req.json()
    const { staffId, phoneNumber, message } = body

    if (!staffId || !phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: staffId, phoneNumber, message' }),
        { status: 400 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(staffId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded: max 5 messages per minute' }),
        { status: 429 }
      )
    }

    // Validate message length
    if (message.length > 1600) {
      return new Response(
        JSON.stringify({ error: 'Message too long (max 1600 characters)' }),
        { status: 400 }
      )
    }

    // Send message
    const result = await sendWhatsAppMessage(phoneNumber, message)

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500 }
      )
    }

    // Optional: log message in database
    try {
      await supabase
        .from('whatsapp_conversations')
        .insert({
          staff_id: staffId,
          staff_phone: phoneNumber.replace('whatsapp:', ''),
          question: '[SYSTEM MESSAGE]',
          answer: message,
          context: { system: true }
        })
    } catch (logError) {
      console.warn('Failed to log message:', logError)
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
        message: 'Message sent successfully'
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Handler error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
})
