// Deno / Supabase Edge Function: line-webhook
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET') || ''
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature || !LINE_CHANNEL_SECRET) return false
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(LINE_CHANNEL_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
  return base64Signature === signature
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-line-signature')

  const isValid = await verifySignature(rawBody, signature)
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const body = JSON.parse(rawBody)
  const events = body.events || []

  for (const event of events) {
    const groupId = event.source?.groupId
    if (event.type === 'join' && groupId) {
      await supabase.from('line_destinations').upsert(
        {
          name: `กลุ่ม LINE (${new Date().toLocaleDateString('th-TH')})`,
          destination_type: 'group',
          line_group_id: groupId,
          is_active: true,
        },
        { onConflict: 'line_group_id' }
      )
    }
  }

  return new Response(JSON.stringify({ success: true, count: events.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
