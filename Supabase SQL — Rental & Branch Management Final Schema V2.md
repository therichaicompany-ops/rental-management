```sql
-- ============================================================
-- RENTAL & BRANCH MANAGEMENT SYSTEM
-- FINAL DATABASE SCHEMA V2
-- ============================================================
--
-- Stack:
-- PostgreSQL / Supabase
--
-- Covers:
-- 1. Rental Lead
-- 2. Negotiation
-- 3. Customer
-- 4. Landlord
-- 5. Location
-- 6. Rental Contract
-- 7. Rent Payment
-- 8. Partial Payment
-- 9. Documents
-- 10. Branch Opening Workflow
-- 11. Tasks
-- 12. Checklist
-- 13. Timeline / Activity Log
-- 14. LINE Destination
-- 15. Notification Log
-- 16. System Settings
-- 17. Users / Roles
--
-- Timezone:
-- Asia/Bangkok
-- ============================================================


-- ============================================================
-- 0. EXTENSION
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- 1. ENUMS
-- ============================================================

do $$
begin

  if not exists (
    select 1 from pg_type where typname = 'user_role'
  ) then
    create type public.user_role as enum (
      'owner',
      'admin',
      'accounting',
      'hr',
      'operation',
      'staff',
      'viewer'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'customer_type'
  ) then
    create type public.customer_type as enum (
      'individual',
      'company'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'lead_status'
  ) then
    create type public.lead_status as enum (
      'new',
      'contacting',
      'negotiating',
      'follow_up',
      'agreed',
      'lost',
      'cancelled',
      'converted'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'contact_method'
  ) then
    create type public.contact_method as enum (
      'phone',
      'line',
      'facebook',
      'email',
      'onsite',
      'other'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'rental_contract_status'
  ) then
    create type public.rental_contract_status as enum (
      'draft',
      'negotiating',
      'agreed',
      'active',
      'expiring',
      'expired',
      'cancelled'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'payment_type'
  ) then
    create type public.payment_type as enum (
      'payable',
      'receivable'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'rent_payment_status'
  ) then
    create type public.rent_payment_status as enum (
      'pending',
      'partial',
      'paid',
      'overdue',
      'cancelled'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'payment_method'
  ) then
    create type public.payment_method as enum (
      'cash',
      'bank_transfer',
      'promptpay',
      'cheque',
      'other'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'task_status'
  ) then
    create type public.task_status as enum (
      'todo',
      'in_progress',
      'waiting',
      'done',
      'skipped',
      'cancelled'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'opening_project_status'
  ) then
    create type public.opening_project_status as enum (
      'not_started',
      'in_progress',
      'on_hold',
      'ready_to_open',
      'opened',
      'cancelled'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'document_entity_type'
  ) then
    create type public.document_entity_type as enum (
      'lead',
      'contract',
      'rent_payment',
      'opening_project',
      'task',
      'customer',
      'location',
      'payment_transaction'
    );
  end if;


  if not exists (
    select 1 from pg_type where typname = 'activity_action'
  ) then
    create type public.activity_action as enum (
      'created',
      'updated',
      'status_changed',
      'assigned',
      'completed',
      'uploaded',
      'deleted',
      'commented'
    );
  end if;

end
$$;


-- ============================================================
-- 2. PRIVATE SCHEMA
-- ============================================================

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;


-- ============================================================
-- 3. UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 4. PROFILES
-- ============================================================

create table if not exists public.profiles (

  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text not null,

  email text,

  phone text,

  role public.user_role not null default 'staff',

  department text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 5. CUSTOMERS
-- ============================================================

create table if not exists public.customers (

  id uuid primary key
    default gen_random_uuid(),

  customer_code text unique,

  customer_type public.customer_type
    not null default 'company',

  name text,

  company_name text,

  tax_id text,

  contact_name text,

  phone text,

  email text,

  line_name text,

  address text,

  note text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 6. LANDLORDS
-- ============================================================

create table if not exists public.landlords (

  id uuid primary key
    default gen_random_uuid(),

  landlord_code text unique,

  name text,

  company_name text,

  tax_id text,

  contact_name text,

  phone text,

  email text,

  address text,

  bank_name text,

  bank_account_name text,

  bank_account_number text,

  note text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 7. LOCATIONS
-- ============================================================

create table if not exists public.locations (

  id uuid primary key
    default gen_random_uuid(),

  location_code text unique,

  house_no text,

  room_no text,

  location_name text,

  village_name text,

  address text,

  subdistrict text,

  district text,

  province text,

  postal_code text,

  google_maps_url text,

  latitude numeric(10,7),

  longitude numeric(10,7),

  landlord_id uuid
    references public.landlords(id)
    on delete set null,

  note text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 8. RENTAL LEADS
-- ============================================================
-- จุดเริ่มต้นของงานเช่า
-- ยังไม่มีสัญญาก็สามารถสร้าง record ได้
-- ============================================================

create table if not exists public.rental_leads (

  id uuid primary key
    default gen_random_uuid(),

  lead_no text unique not null,

  location_id uuid
    references public.locations(id)
    on delete set null,

  customer_id uuid
    references public.customers(id)
    on delete set null,

  landlord_id uuid
    references public.landlords(id)
    on delete set null,

  lead_name text,

  source text,

  first_contact_date date,

  expected_start_date date,

  expected_open_date date,

  proposed_monthly_rent numeric(12,2)
    not null default 0,

  proposed_deposit_amount numeric(12,2)
    not null default 0,

  proposed_advance_rent_amount numeric(12,2)
    not null default 0,

  proposed_service_amount numeric(12,2)
    not null default 0,

  need_branch_registration boolean
    not null default true,

  need_vat_registration boolean
    not null default false,

  need_employer_change boolean
    not null default false,

  need_signboard boolean
    not null default true,

  status public.lead_status
    not null default 'new',

  assigned_to uuid
    references public.profiles(id)
    on delete set null,

  next_follow_up_date date,

  note text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  check (proposed_monthly_rent >= 0),

  check (proposed_deposit_amount >= 0),

  check (proposed_advance_rent_amount >= 0),

  check (proposed_service_amount >= 0)
);


-- ============================================================
-- 9. NEGOTIATION LOGS
-- ============================================================
-- เก็บประวัติการโทร/เจรจาแต่ละครั้ง
-- ============================================================

create table if not exists public.negotiation_logs (

  id uuid primary key
    default gen_random_uuid(),

  lead_id uuid not null
    references public.rental_leads(id)
    on delete cascade,

  contact_date timestamptz not null default now(),

  contact_method public.contact_method
    not null default 'phone',

  contact_person text,

  contact_phone text,

  monthly_rent numeric(12,2),

  deposit_amount numeric(12,2),

  advance_rent_amount numeric(12,2),

  service_amount numeric(12,2),

  negotiation_detail text,

  result text,

  next_action text,

  next_follow_up_date date,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now()
);


-- ============================================================
-- 10. RENTAL CONTRACTS
-- ============================================================

create table if not exists public.rental_contracts (

  id uuid primary key
    default gen_random_uuid(),

  contract_no text unique not null,

  lead_id uuid
    references public.rental_leads(id)
    on delete set null,

  location_id uuid not null
    references public.locations(id)
    on delete restrict,

  customer_id uuid
    references public.customers(id)
    on delete set null,

  landlord_id uuid
    references public.landlords(id)
    on delete set null,

  contract_date date,

  start_date date,

  end_date date,

  monthly_rent numeric(12,2)
    not null default 0,

  deposit_amount numeric(12,2)
    not null default 0,

  advance_rent_amount numeric(12,2)
    not null default 0,

  payment_due_day integer,

  wht_enabled boolean
    not null default false,

  wht_rate numeric(5,2)
    not null default 0,

  recurring_rent_enabled boolean
    not null default true,

  other_service_amount numeric(12,2)
    not null default 0,

  status public.rental_contract_status
    not null default 'draft',

  need_branch_registration boolean
    not null default true,

  need_vat_registration boolean
    not null default false,

  need_employer_change boolean
    not null default false,

  need_signboard boolean
    not null default true,

  assigned_to uuid
    references public.profiles(id)
    on delete set null,

  note text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  check (monthly_rent >= 0),

  check (deposit_amount >= 0),

  check (advance_rent_amount >= 0),

  check (other_service_amount >= 0),

  check (wht_rate >= 0 and wht_rate <= 100),

  check (
    payment_due_day is null
    or payment_due_day between 1 and 31
  )
);


-- ============================================================
-- 11. WORKFLOW STAGES
-- ============================================================

create table if not exists public.workflow_stages (

  id uuid primary key
    default gen_random_uuid(),

  stage_code text unique not null,

  stage_name text not null,

  sequence integer not null,

  is_required boolean not null default true,

  is_active boolean not null default true,

  created_at timestamptz not null default now()
);


-- ============================================================
-- 12. OPENING PROJECTS
-- ============================================================

create table if not exists public.opening_projects (

  id uuid primary key
    default gen_random_uuid(),

  project_no text unique not null,

  contract_id uuid not null
    references public.rental_contracts(id)
    on delete cascade,

  current_stage_id uuid
    references public.workflow_stages(id)
    on delete set null,

  target_open_date date,

  assigned_to uuid
    references public.profiles(id)
    on delete set null,

  status public.opening_project_status
    not null default 'not_started',

  note text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  unique(contract_id)
);


-- ============================================================
-- 13. OPENING TASKS
-- ============================================================

create table if not exists public.opening_tasks (

  id uuid primary key
    default gen_random_uuid(),

  opening_project_id uuid not null
    references public.opening_projects(id)
    on delete cascade,

  stage_id uuid
    references public.workflow_stages(id)
    on delete set null,

  task_name text not null,

  description text,

  assigned_to uuid
    references public.profiles(id)
    on delete set null,

  due_date date,

  status public.task_status
    not null default 'todo',

  completed_at timestamptz,

  completed_by uuid
    references public.profiles(id)
    on delete set null,

  note text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 14. TASK CHECKLISTS
-- ============================================================

create table if not exists public.task_checklists (

  id uuid primary key
    default gen_random_uuid(),

  task_id uuid not null
    references public.opening_tasks(id)
    on delete cascade,

  item_name text not null,

  is_required boolean
    not null default true,

  is_checked boolean
    not null default false,

  checked_by uuid
    references public.profiles(id)
    on delete set null,

  checked_at timestamptz,

  created_at timestamptz not null default now()
);


-- ============================================================
-- 15. RENT PAYMENTS
-- ============================================================

create table if not exists public.rent_payments (

  id uuid primary key
    default gen_random_uuid(),

  contract_id uuid not null
    references public.rental_contracts(id)
    on delete cascade,

  payment_type public.payment_type not null,

  billing_period date not null,

  due_date date not null,

  rent_amount numeric(12,2)
    not null default 0,

  wht_amount numeric(12,2)
    not null default 0,

  service_amount numeric(12,2)
    not null default 0,

  other_amount numeric(12,2)
    not null default 0,

  gross_amount numeric(12,2)
    generated always as (
      rent_amount
      + service_amount
      + other_amount
    ) stored,

  net_amount numeric(12,2)
    generated always as (
      rent_amount
      + service_amount
      + other_amount
      - wht_amount
    ) stored,

  amount_paid numeric(12,2)
    not null default 0,

  balance_amount numeric(12,2)
    generated always as (
      greatest(
        (
          rent_amount
          + service_amount
          + other_amount
          - wht_amount
        ) - amount_paid,
        0
      )
    ) stored,

  status public.rent_payment_status
    not null default 'pending',

  payment_note text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  unique (
    contract_id,
    payment_type,
    billing_period
  ),

  check (rent_amount >= 0),

  check (wht_amount >= 0),

  check (service_amount >= 0),

  check (other_amount >= 0),

  check (amount_paid >= 0),

  check (
    wht_amount <= rent_amount
  )
);


-- ============================================================
-- 16. PAYMENT TRANSACTIONS
-- ============================================================

create table if not exists public.payment_transactions (

  id uuid primary key
    default gen_random_uuid(),

  rent_payment_id uuid not null
    references public.rent_payments(id)
    on delete cascade,

  transaction_date timestamptz
    not null default now(),

  amount numeric(12,2)
    not null,

  payment_method public.payment_method
    not null default 'bank_transfer',

  reference_no text,

  paid_by uuid
    references public.profiles(id)
    on delete set null,

  note text,

  created_at timestamptz
    not null default now(),

  check (amount > 0)
);


-- ============================================================
-- 17. DOCUMENTS
-- ============================================================

create table if not exists public.documents (

  id uuid primary key
    default gen_random_uuid(),

  entity_type public.document_entity_type
    not null,

  entity_id uuid not null,

  document_type text not null,

  file_name text not null,

  storage_bucket text
    not null default 'documents',

  storage_path text not null,

  file_size bigint,

  mime_type text,

  uploaded_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz
    not null default now()
);


-- ============================================================
-- 18. LINE DESTINATIONS
-- ============================================================

create table if not exists public.line_destinations (

  id uuid primary key
    default gen_random_uuid(),

  name text not null,

  destination_type text
    not null default 'group',

  line_group_id text not null unique,

  is_active boolean
    not null default true,

  created_at timestamptz
    not null default now(),

  check (
    destination_type = 'group'
  )
);


-- ============================================================
-- 19. NOTIFICATION LOGS
-- ============================================================

create table if not exists public.notification_logs (

  id uuid primary key
    default gen_random_uuid(),

  notification_type text not null,

  entity_type text not null,

  entity_id uuid not null,

  destination_id uuid
    references public.line_destinations(id)
    on delete set null,

  notification_date date not null,

  status text
    not null default 'pending',

  message text,

  sent_at timestamptz,

  error_message text,

  created_at timestamptz
    not null default now(),

  check (
    status in (
      'pending',
      'sent',
      'failed'
    )
  )
);


-- ============================================================
-- 20. ACTIVITY LOGS
-- ============================================================

create table if not exists public.activity_logs (

  id uuid primary key
    default gen_random_uuid(),

  entity_type text not null,

  entity_id uuid not null,

  action public.activity_action not null,

  description text,

  performed_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz
    not null default now()
);


-- ============================================================
-- 21. SYSTEM SETTINGS
-- ============================================================

create table if not exists public.system_settings (

  id uuid primary key
    default gen_random_uuid(),

  setting_key text unique not null,

  setting_value text,

  description text,

  updated_by uuid
    references public.profiles(id)
    on delete set null,

  updated_at timestamptz
    not null default now()
);


-- ============================================================
-- 22. INDEXES
-- ============================================================

create index if not exists idx_profiles_role
on public.profiles(role);


create index if not exists idx_profiles_active
on public.profiles(is_active);


create index if not exists idx_customers_code
on public.customers(customer_code);


create index if not exists idx_landlords_code
on public.landlords(landlord_code);


create index if not exists idx_locations_landlord
on public.locations(landlord_id);


create index if not exists idx_rental_leads_status
on public.rental_leads(status);


create index if not exists idx_rental_leads_assigned
on public.rental_leads(assigned_to);


create index if not exists idx_rental_leads_followup
on public.rental_leads(next_follow_up_date);


create index if not exists idx_negotiation_logs_lead
on public.negotiation_logs(lead_id);


create index if not exists idx_contracts_location
on public.rental_contracts(location_id);


create index if not exists idx_contracts_customer
on public.rental_contracts(customer_id);


create index if not exists idx_contracts_landlord
on public.rental_contracts(landlord_id);


create index if not exists idx_contracts_status
on public.rental_contracts(status);


create index if not exists idx_opening_projects_contract
on public.opening_projects(contract_id);


create index if not exists idx_opening_projects_status
on public.opening_projects(status);


create index if not exists idx_opening_tasks_project
on public.opening_tasks(opening_project_id);


create index if not exists idx_opening_tasks_assigned
on public.opening_tasks(assigned_to);


create index if not exists idx_opening_tasks_due
on public.opening_tasks(due_date);


create index if not exists idx_rent_payments_contract
on public.rent_payments(contract_id);


create index if not exists idx_rent_payments_due
on public.rent_payments(due_date);


create index if not exists idx_rent_payments_status
on public.rent_payments(status);


create index if not exists idx_rent_payments_type
on public.rent_payments(payment_type);


create index if not exists idx_payment_transactions_payment
on public.payment_transactions(rent_payment_id);


create index if not exists idx_documents_entity
on public.documents(entity_type, entity_id);


create index if not exists idx_notification_logs_entity
on public.notification_logs(entity_type, entity_id);


create index if not exists idx_notification_logs_date
on public.notification_logs(notification_date);


create index if not exists idx_activity_logs_entity
on public.activity_logs(entity_type, entity_id);


create index if not exists idx_activity_logs_created
on public.activity_logs(created_at);


-- ============================================================
-- 23. UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists trg_profiles_updated_at
on public.profiles;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


drop trigger if exists trg_customers_updated_at
on public.customers;

create trigger trg_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();


drop trigger if exists trg_landlords_updated_at
on public.landlords;

create trigger trg_landlords_updated_at
before update on public.landlords
for each row
execute function public.set_updated_at();


drop trigger if exists trg_locations_updated_at
on public.locations;

create trigger trg_locations_updated_at
before update on public.locations
for each row
execute function public.set_updated_at();


drop trigger if exists trg_rental_leads_updated_at
on public.rental_leads;

create trigger trg_rental_leads_updated_at
before update on public.rental_leads
for each row
execute function public.set_updated_at();


drop trigger if exists trg_contracts_updated_at
on public.rental_contracts;

create trigger trg_contracts_updated_at
before update on public.rental_contracts
for each row
execute function public.set_updated_at();


drop trigger if exists trg_opening_projects_updated_at
on public.opening_projects;

create trigger trg_opening_projects_updated_at
before update on public.opening_projects
for each row
execute function public.set_updated_at();


drop trigger if exists trg_opening_tasks_updated_at
on public.opening_tasks;

create trigger trg_opening_tasks_updated_at
before update on public.opening_tasks
for each row
execute function public.set_updated_at();


drop trigger if exists trg_rent_payments_updated_at
on public.rent_payments;

create trigger trg_rent_payments_updated_at
before update on public.rent_payments
for each row
execute function public.set_updated_at();


-- ============================================================
-- 24. AUTH -> PROFILE
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  insert into public.profiles
  (
    id,
    full_name,
    email,
    role,
    is_active
  )
  values
  (
    new.id,

    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'New User'
    ),

    new.email,

    'staff',

    true
  )

  on conflict (id)
  do nothing;

  return new;

end;
$$;


drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  update public.profiles

  set
    email = new.email,
    updated_at = now()

  where id = new.id;

  return new;

end;
$$;


drop trigger if exists on_auth_user_email_updated
on auth.users;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
execute function public.handle_user_email_update();


-- ============================================================
-- 25. PRIVATE RLS FUNCTIONS
-- ============================================================

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
    and is_active = true
  limit 1;
$$;


create or replace function private.has_full_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('owner', 'admin')
      and is_active = true
  );
$$;


create or replace function private.is_accounting()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('owner', 'admin', 'accounting')
      and is_active = true
  );
$$;


create or replace function private.is_hr()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('owner', 'admin', 'hr')
      and is_active = true
  );
$$;


create or replace function private.is_operation()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('owner', 'admin', 'operation')
      and is_active = true
  );
$$;


revoke all
on function private.current_user_role()
from public;

grant execute
on function private.current_user_role()
to authenticated;


revoke all
on function private.has_full_access()
from public;

grant execute
on function private.has_full_access()
to authenticated;


revoke all
on function private.is_accounting()
from public;

grant execute
on function private.is_accounting()
to authenticated;


revoke all
on function private.is_hr()
from public;

grant execute
on function private.is_hr()
to authenticated;


revoke all
on function private.is_operation()
from public;

grant execute
on function private.is_operation()
to authenticated;


-- ============================================================
-- 26. CHANGE USER ROLE
-- ============================================================

create or replace function public.change_user_role(
  p_user_id uuid,
  p_role public.user_role
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin

  if not private.has_full_access() then
    raise exception 'Permission denied';
  end if;

  update public.profiles

  set
    role = p_role,
    updated_at = now()

  where id = p_user_id;

  if not found then
    raise exception 'User not found';
  end if;

  return true;

end;
$$;


revoke all
on function public.change_user_role(uuid, public.user_role)
from public;

grant execute
on function public.change_user_role(uuid, public.user_role)
to authenticated;


-- ============================================================
-- 27. DEACTIVATE USER
-- ============================================================

create or replace function public.deactivate_user(
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin

  if not private.has_full_access() then
    raise exception 'Permission denied';
  end if;

  update public.profiles

  set
    is_active = false,
    updated_at = now()

  where id = p_user_id;

  if not found then
    raise exception 'User not found';
  end if;

  return true;

end;
$$;


revoke all
on function public.deactivate_user(uuid)
from public;

grant execute
on function public.deactivate_user(uuid)
to authenticated;


-- ============================================================
-- 28. RENT PAYMENT STATUS SYNC
-- ============================================================

create or replace function public.sync_rent_payment_status()
returns trigger
language plpgsql
as $$
declare
  v_net numeric(12,2);
begin

  if new.status = 'cancelled' then
    return new;
  end if;

  v_net := coalesce(
    new.rent_amount + new.service_amount + new.other_amount - new.wht_amount,
    new.net_amount,
    0
  );

  if new.amount_paid >= v_net and v_net > 0 then

    new.status := 'paid';

  elsif new.amount_paid > 0 then

    new.status := 'partial';

  elsif new.due_date < current_date then

    new.status := 'overdue';

  else

    new.status := 'pending';

  end if;

  return new;

end;
$$;


drop trigger if exists trg_sync_rent_payment_status
on public.rent_payments;

create trigger trg_sync_rent_payment_status
before insert or update of
  amount_paid,
  due_date,
  rent_amount,
  wht_amount,
  service_amount,
  other_amount,
  status

on public.rent_payments

for each row
execute function public.sync_rent_payment_status();


-- ============================================================
-- 29. UPDATE PAYMENT TOTAL
-- ============================================================

create or replace function public.refresh_rent_payment_total(
  p_rent_payment_id uuid
)
returns void
language sql
as $$
  update public.rent_payments rp

  set
    amount_paid = (
      select coalesce(sum(pt.amount), 0)

      from public.payment_transactions pt

      where pt.rent_payment_id = p_rent_payment_id
    ),

    updated_at = now()

  where rp.id = p_rent_payment_id;
$$;


create or replace function public.after_payment_transaction_change()
returns trigger
language plpgsql
as $$
declare
  v_rent_payment_id uuid;
begin

  v_rent_payment_id :=
    coalesce(new.rent_payment_id, old.rent_payment_id);

  perform public.refresh_rent_payment_total(
    v_rent_payment_id
  );

  return coalesce(new, old);

end;
$$;


drop trigger if exists trg_payment_transaction_refresh
on public.payment_transactions;

create trigger trg_payment_transaction_refresh

after insert or update or delete

on public.payment_transactions

for each row

execute function public.after_payment_transaction_change();


-- ============================================================
-- 30. MARK OVERDUE
-- ============================================================

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


-- ============================================================
-- 31. WORKFLOW SEED
-- ============================================================

insert into public.workflow_stages
(
  stage_code,
  stage_name,
  sequence,
  is_required
)

values

('NEGOTIATION',
 'โทรเจรจาการเช่า',
 1,
 true),

('AGREED',
 'ตกลงเช่า',
 2,
 true),

('DEPOSIT',
 'รับมัดจำ / ค่าเช่าล่วงหน้า',
 3,
 true),

('CONTRACT',
 'นัดทำสัญญาเช่า',
 4,
 true),

('DOCUMENT_CHECK',
 'ตรวจสอบเอกสาร',
 5,
 true),

('SEND_ACCOUNTING',
 'ส่งเรื่องให้บัญชี',
 6,
 true),

('BRANCH_REGISTRATION',
 'จดสาขา',
 7,
 false),

('SIGNBOARD',
 'ทำป้ายบริษัท',
 8,
 false),

('EMPLOYMENT_CHANGE',
 'เปลี่ยนนายจ้าง / ประเภทงาน',
 9,
 false),

('JOB_APPROVAL',
 'รออนุมัติจากระบบจัดหางาน',
 10,
 false),

('PRE_OPEN_SIGN',
 'เซ็นเอกสารก่อนเปิดร้าน',
 11,
 true),

('READY_TO_OPEN',
 'พร้อมเปิดร้าน',
 12,
 true),

('OPENED',
 'เปิดร้านแล้ว',
 13,
 true)

on conflict (stage_code)
do nothing;


-- ============================================================
-- 32. DEFAULT SYSTEM SETTINGS
-- ============================================================

insert into public.system_settings
(
  setting_key,
  setting_value,
  description
)

values

(
  'timezone',
  'Asia/Bangkok',
  'Timezone ของระบบ'
),

(
  'rent_reminder_days',
  '7',
  'แจ้งเตือนค่าเช่าล่วงหน้ากี่วัน'
),

(
  'rent_reminder_enabled',
  'true',
  'เปิด/ปิดระบบแจ้งเตือนค่าเช่า'
),

(
  'rent_reminder_time',
  '09:00',
  'เวลาส่งแจ้งเตือน'
),

(
  'overdue_reminder_enabled',
  'true',
  'แจ้งเตือนเมื่อค่าเช่าเกินกำหนด'
)

on conflict (setting_key)
do nothing;


-- ============================================================
-- 33. ENABLE RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.landlords enable row level security;
alter table public.locations enable row level security;
alter table public.rental_leads enable row level security;
alter table public.negotiation_logs enable row level security;
alter table public.rental_contracts enable row level security;
alter table public.workflow_stages enable row level security;
alter table public.opening_projects enable row level security;
alter table public.opening_tasks enable row level security;
alter table public.task_checklists enable row level security;
alter table public.rent_payments enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.documents enable row level security;
alter table public.line_destinations enable row level security;
alter table public.notification_logs enable row level security;
alter table public.activity_logs enable row level security;
alter table public.system_settings enable row level security;


-- ============================================================
-- 34. REVOKE ANON ACCESS
-- ============================================================

revoke all on table
  public.profiles,
  public.customers,
  public.landlords,
  public.locations,
  public.rental_leads,
  public.negotiation_logs,
  public.rental_contracts,
  public.workflow_stages,
  public.opening_projects,
  public.opening_tasks,
  public.task_checklists,
  public.rent_payments,
  public.payment_transactions,
  public.documents,
  public.line_destinations,
  public.notification_logs,
  public.activity_logs,
  public.system_settings

from anon;


-- ============================================================
-- 35. GRANT AUTHENTICATED
-- ============================================================

grant select, insert, update, delete
on public.customers,
   public.landlords,
   public.locations,
   public.rental_leads,
   public.negotiation_logs,
   public.rental_contracts,
   public.opening_projects,
   public.opening_tasks,
   public.task_checklists,
   public.documents,
   public.activity_logs

to authenticated;


grant select
on public.workflow_stages,
   public.notification_logs,
   public.line_destinations,
   public.system_settings

to authenticated;


grant select, insert, update, delete
on public.rent_payments,
   public.payment_transactions

to authenticated;


grant select, insert, update, delete
on public.profiles
to authenticated;


-- ============================================================
-- 36. PROFILES POLICIES
-- ============================================================

drop policy if exists profiles_select
on public.profiles;

create policy profiles_select

on public.profiles

for select
to authenticated

using (
  id = (select auth.uid())
  or
  (select private.has_full_access())
);


drop policy if exists profiles_update_self
on public.profiles;

create policy profiles_update_self

on public.profiles

for update
to authenticated

using (
  id = (select auth.uid())
)

with check (
  id = (select auth.uid())
);


drop policy if exists profiles_update_admin
on public.profiles;

create policy profiles_update_admin

on public.profiles

for update
to authenticated

using (
  (select private.has_full_access())
)

with check (
  (select private.has_full_access())
);


drop policy if exists profiles_insert_admin
on public.profiles;

create policy profiles_insert_admin

on public.profiles

for insert
to authenticated

with check (
  (select private.has_full_access())
);


drop policy if exists profiles_delete_admin
on public.profiles;

create policy profiles_delete_admin

on public.profiles

for delete
to authenticated

using (
  (select private.has_full_access())
);


-- ============================================================
-- 37. GENERIC AUTHENTICATED POLICIES
-- ============================================================

create policy customers_select
on public.customers
for select
to authenticated
using ((select auth.uid()) is not null);


create policy customers_insert
on public.customers
for insert
to authenticated
with check ((select auth.uid()) is not null);


create policy customers_update
on public.customers
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);


create policy customers_delete
on public.customers
for delete
to authenticated
using ((select private.has_full_access()));


create policy landlords_select
on public.landlords
for select
to authenticated
using ((select auth.uid()) is not null);


create policy landlords_insert
on public.landlords
for insert
to authenticated
with check ((select auth.uid()) is not null);


create policy landlords_update
on public.landlords
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);


create policy landlords_delete
on public.landlords
for delete
to authenticated
using ((select private.has_full_access()));


create policy locations_select
on public.locations
for select
to authenticated
using ((select auth.uid()) is not null);


create policy locations_insert
on public.locations
for insert
to authenticated
with check ((select auth.uid()) is not null);


create policy locations_update
on public.locations
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);


create policy locations_delete
on public.locations
for delete
to authenticated
using ((select private.has_full_access()));


create policy rental_leads_select
on public.rental_leads
for select
to authenticated
using ((select auth.uid()) is not null);


create policy rental_leads_insert
on public.rental_leads
for insert
to authenticated
with check ((select auth.uid()) is not null);


create policy rental_leads_update
on public.rental_leads
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);


create policy rental_leads_delete
on public.rental_leads
for delete
to authenticated
using ((select private.has_full_access()));


create policy negotiation_logs_select
on public.negotiation_logs
for select
to authenticated
using ((select auth.uid()) is not null);


create policy negotiation_logs_insert
on public.negotiation_logs
for insert
to authenticated
with check ((select auth.uid()) is not null);


create policy negotiation_logs_update
on public.negotiation_logs
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);


create policy negotiation_logs_delete
on public.negotiation_logs
for delete
to authenticated
using ((select private.has_full_access()));


create policy contracts_select
on public.rental_contracts
for select
to authenticated
using ((select auth.uid()) is not null);


create policy contracts_insert
on public.rental_contracts
for insert
to authenticated
with check ((select auth.uid()) is not null);


create policy contracts_update
on public.rental_contracts
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);


create policy contracts_delete
on public.rental_contracts
for delete
to authenticated
using ((select private.has_full_access()));


create policy workflow_select
on public.workflow_stages
for select
to authenticated
using (is_active = true);


create policy opening_projects_select
on public.opening_projects
for select
to authenticated
using ((select auth.uid()) is not null);


create policy opening_projects_insert
on public.opening_projects
for insert
to authenticated
with check ((select auth.uid()) is not null);


create policy opening_projects_update
on public.opening_projects
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);


create policy opening_projects_delete
on public.opening_projects
for delete
to authenticated
using ((select private.has_full_access()));


create policy opening_tasks_select
on public.opening_tasks
for select
to authenticated
using ((select auth.uid()) is not null);


create policy opening_tasks_insert
on public.opening_tasks
for insert
to authenticated
with check ((select auth.uid()) is not null);


create policy opening_tasks_update
on public.opening_tasks
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);


create policy opening_tasks_delete
on public.opening_tasks
for delete
to authenticated
using ((select private.has_full_access()));


create policy checklist_select
on public.task_checklists
for select
to authenticated
using ((select auth.uid()) is not null);


create policy checklist_insert
on public.task_checklists
for insert
to authenticated
with check ((select auth.uid()) is not null);


create policy checklist_update
on public.task_checklists
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);


create policy checklist_delete
on public.task_checklists
for delete
to authenticated
using ((select private.has_full_access()));


-- ============================================================
-- 38. RENT PAYMENT POLICIES
-- ============================================================

create policy rent_payments_select
on public.rent_payments
for select
to authenticated
using ((select auth.uid()) is not null);


create policy rent_payments_insert
on public.rent_payments
for insert
to authenticated
with check (
  (select private.is_accounting())
  or
  (select private.has_full_access())
);


create policy rent_payments_update
on public.rent_payments
for update
to authenticated
using (
  (select private.is_accounting())
  or
  (select private.has_full_access())
)
with check (
  (select private.is_accounting())
  or
  (select private.has_full_access())
);


create policy rent_payments_delete
on public.rent_payments
for delete
to authenticated
using (
  (select private.has_full_access())
);


create policy payment_transactions_select
on public.payment_transactions
for select
to authenticated
using (
  (select private.is_accounting())
  or
  (select private.has_full_access())
);


create policy payment_transactions_insert
on public.payment_transactions
for insert
to authenticated
with check (
  (select private.is_accounting())
  or
  (select private.has_full_access())
);


create policy payment_transactions_update
on public.payment_transactions
for update
to authenticated
using (
  (select private.is_accounting())
  or
  (select private.has_full_access())
)
with check (
  (select private.is_accounting())
  or
  (select private.has_full_access())
);


create policy payment_transactions_delete
on public.payment_transactions
for delete
to authenticated
using (
  (select private.has_full_access())
);


-- ============================================================
-- 39. DOCUMENT POLICIES
-- ============================================================

create policy documents_select
on public.documents
for select
to authenticated
using ((select auth.uid()) is not null);


create policy documents_insert
on public.documents
for insert
to authenticated
with check ((select auth.uid()) is not null);


create policy documents_update
on public.documents
for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);


create policy documents_delete
on public.documents
for delete
to authenticated
using ((select private.has_full_access()));


-- ============================================================
-- 40. LINE / NOTIFICATION
-- ============================================================

create policy line_destinations_select
on public.line_destinations
for select
to authenticated
using ((select private.has_full_access()));


create policy notification_logs_select
on public.notification_logs
for select
to authenticated
using ((select private.has_full_access()));


create policy activity_logs_select
on public.activity_logs
for select
to authenticated
using ((select auth.uid()) is not null);


create policy activity_logs_insert
on public.activity_logs
for insert
to authenticated
with check ((select auth.uid()) is not null);


-- ============================================================
-- 41. SYSTEM SETTINGS
-- ============================================================

create policy settings_select
on public.system_settings
for select
to authenticated
using ((select private.has_full_access()));


create policy settings_insert
on public.system_settings
for insert
to authenticated
with check ((select private.has_full_access()));


create policy settings_update
on public.system_settings
for update
to authenticated
using ((select private.has_full_access()))
with check ((select private.has_full_access()));


create policy settings_delete
on public.system_settings
for delete
to authenticated
using ((select private.has_full_access()));


-- ============================================================
-- 42. STORAGE BUCKET
-- ============================================================
-- Private bucket
-- ============================================================

insert into storage.buckets
(
  id,
  name,
  public
)

values
(
  'documents',
  'documents',
  false
)

on conflict (id)
do update set
  public = false;


-- ============================================================
-- 43. STORAGE POLICIES
-- ============================================================

drop policy if exists documents_storage_select
on storage.objects;

create policy documents_storage_select

on storage.objects

for select

to authenticated

using (
  bucket_id = 'documents'
);


drop policy if exists documents_storage_insert
on storage.objects;

create policy documents_storage_insert

on storage.objects

for insert

to authenticated

with check (
  bucket_id = 'documents'
);


drop policy if exists documents_storage_update
on storage.objects;

create policy documents_storage_update

on storage.objects

for update

to authenticated

using (
  bucket_id = 'documents'
)

with check (
  bucket_id = 'documents'
);


drop policy if exists documents_storage_delete
on storage.objects;

create policy documents_storage_delete

on storage.objects

for delete

to authenticated

using (
  bucket_id = 'documents'
  and
  (select private.has_full_access())
);


-- ============================================================
-- 44. RENT SUMMARY VIEW
-- ============================================================

create or replace view public.v_rent_payment_summary
with (security_invoker = true)

as

select

  rp.id,

  rp.contract_id,

  rc.contract_no,

  rp.payment_type,

  rp.billing_period,

  rp.due_date,

  l.location_code,

  l.house_no,

  l.room_no,

  l.location_name,

  l.village_name,

  c.id as customer_id,

  c.name as customer_name,

  c.company_name as customer_company_name,

  ll.id as landlord_id,

  ll.name as landlord_name,

  ll.company_name as landlord_company_name,

  rp.rent_amount,

  rp.wht_amount,

  rp.service_amount,

  rp.other_amount,

  rp.gross_amount,

  rp.net_amount,

  rp.amount_paid,

  rp.balance_amount,

  rp.status,

  (rp.due_date - current_date)
    as days_until_due

from public.rent_payments rp

join public.rental_contracts rc
  on rc.id = rp.contract_id

join public.locations l
  on l.id = rc.location_id

left join public.customers c
  on c.id = rc.customer_id

left join public.landlords ll
  on ll.id = rc.landlord_id;


-- ============================================================
-- 45. OPENING PROGRESS VIEW
-- ============================================================

create or replace view public.v_opening_project_progress
with (security_invoker = true)

as

select

  op.id,

  op.project_no,

  op.contract_id,

  rc.contract_no,

  l.location_name,

  l.house_no,

  l.room_no,

  l.village_name,

  op.target_open_date,

  op.status,

  ws.stage_code as current_stage_code,

  ws.stage_name as current_stage_name,

  count(ot.id) as total_tasks,

  count(ot.id)
    filter (
      where ot.status = 'done'
    ) as completed_tasks,

  count(ot.id)
    filter (
      where ot.status not in (
        'done',
        'skipped',
        'cancelled'
      )
    ) as remaining_tasks

from public.opening_projects op

join public.rental_contracts rc
  on rc.id = op.contract_id

join public.locations l
  on l.id = rc.location_id

left join public.workflow_stages ws
  on ws.id = op.current_stage_id

left join public.opening_tasks ot
  on ot.opening_project_id = op.id

group by

  op.id,
  op.project_no,
  op.contract_id,
  rc.contract_no,
  l.location_name,
  l.house_no,
  l.room_no,
  l.village_name,
  op.target_open_date,
  op.status,
  ws.stage_code,
  ws.stage_name;


-- ============================================================
-- 46. ACTIVE USERS VIEW
-- ============================================================

create or replace view public.v_active_users
with (security_invoker = true)

as

select

  id,
  full_name,
  email,
  phone,
  role,
  department,
  is_active,
  created_at

from public.profiles

where is_active = true;


-- ============================================================
-- 47. COMMENTS
-- ============================================================

comment on table public.rental_leads is
'ข้อมูลเริ่มต้นของงานเช่าก่อนทำสัญญา';

comment on table public.negotiation_logs is
'ประวัติการโทรและเจรจาเช่าแต่ละครั้ง';

comment on table public.rental_contracts is
'ข้อมูลสัญญาเช่าหลัก';

comment on table public.rent_payments is
'รายการค่าเช่าแต่ละงวด ทั้งบริษัทจ่ายและบริษัทรับ';

comment on table public.payment_transactions is
'ประวัติการชำระเงินจริง รองรับ partial payment';

comment on table public.opening_projects is
'โครงการติดตามการเปิดสาขา';

comment on table public.opening_tasks is
'งานย่อยในแต่ละขั้นตอน';

comment on table public.documents is
'เอกสารและไฟล์แนบ';

comment on table public.notification_logs is
'ประวัติการส่ง LINE Notification';

comment on table public.activity_logs is
'ประวัติการเปลี่ยนแปลงข้อมูล';

```