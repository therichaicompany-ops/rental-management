-- Migration: Supabase Cron for Daily Rent Reminder Automation (Phase 9)
-- Schedule: Daily at 09:00 Asia/Bangkok (02:00 UTC) -> '0 2 * * *'

-- 1. Ensure mark_overdue_rent_payments function is up to date
create or replace function public.mark_overdue_rent_payments()
returns void
language sql
as $$
  update public.rent_payments
  set
    status = 'overdue',
    updated_at = now()
  where
    status in ('pending', 'partial')
    and due_date < current_date
    and amount_paid < net_amount;
$$;

-- 2. Enable pg_cron and pg_net extensions if not already enabled
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 3. Unschedule existing job if already scheduled
select cron.unschedule('daily-rent-reminder')
where exists (
  select 1 from cron.job where jobname = 'daily-rent-reminder'
);

-- 4. Create cron schedule:
-- Runs daily at 02:00 UTC (09:00 AM Bangkok Time)
-- Calls mark_overdue_rent_payments() first, then triggers the Edge Function or Webhook API
select cron.schedule(
  'daily-rent-reminder',
  '0 2 * * *',
  $$
    select public.mark_overdue_rent_payments();
    select net.http_post(
      url := 'https://rental-management-topaz-one.vercel.app/api/cron/rent-reminder',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"source": "supabase-cron"}'::jsonb
    );
  $$
);
