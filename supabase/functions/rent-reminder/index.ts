// Deno / Supabase Edge Function: rent-reminder
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const APP_URL = Deno.env.get('APP_URL') || 'https://rental-management-topaz-one.vercel.app'
const CRON_SECRET = Deno.env.get('CRON_SECRET') || ''

serve(async (req) => {
  // Allow POST and GET
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // 1. Mark Overdue Rent Payments
    await supabase.rpc('mark_overdue_rent_payments')

    // 2. Delegate to Next.js API automation handler or call directly
    const apiEndpoint = `${APP_URL}/api/cron/rent-reminder`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (CRON_SECRET) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ source: 'supabase-cron' }),
    })

    const data = await response.json().catch(() => ({}))

    return new Response(JSON.stringify({ success: true, delegated: true, data }), {
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
