// Deno / Supabase Edge Function: send-line-message
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const { toGroupId, messages, notificationType, entityType, entityId, destinationId } =
      await req.json()

    if (!toGroupId || !messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Missing toGroupId or messages array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const today = new Date().toISOString().split('T')[0]

    // Push to LINE
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: toGroupId,
        messages,
      }),
    })

    const isSuccess = res.ok
    let errorMessage: string | null = null
    if (!isSuccess) {
      const errJson = await res.json().catch(() => ({}))
      errorMessage = errJson.message || `HTTP ${res.status}`
    }

    // Log to notification_logs
    await supabase.from('notification_logs').insert({
      notification_type: notificationType || 'MANUAL',
      entity_type: entityType || 'manual',
      entity_id: entityId || '00000000-0000-0000-0000-000000000000',
      destination_id: destinationId || null,
      notification_date: today,
      status: isSuccess ? 'sent' : 'failed',
      message: JSON.stringify(messages).slice(0, 500),
      sent_at: isSuccess ? new Date().toISOString() : null,
      error_message: errorMessage,
    })

    return new Response(JSON.stringify({ success: isSuccess, error: errorMessage }), {
      status: isSuccess ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
