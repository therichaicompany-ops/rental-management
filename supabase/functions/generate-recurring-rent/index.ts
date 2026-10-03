// Deno / Supabase Edge Function: generate-recurring-rent (Phase 10)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const APP_URL = Deno.env.get('APP_URL') || 'https://rental-management-topaz-one.vercel.app'
const CRON_SECRET = Deno.env.get('CRON_SECRET') || ''

serve(async (req) => {
  try {
    const apiEndpoint = `${APP_URL}/api/cron/recurring-rent`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (CRON_SECRET) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ source: 'supabase-cron-recurring-rent' }),
    })

    const data = await response.json().catch(() => ({}))

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown Edge Function Error'
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
