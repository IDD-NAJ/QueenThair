-- ============================================================
--  QUEENTHAIR – Migration 006: User Dashboard Tables
--  Tables for notification preferences, notifications, security events
-- ============================================================

-- ============================================================
--  TABLE: user_notification_preferences
-- ============================================================
create table if not exists public.user_notification_preferences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  email_notifications boolean not null default true,
  order_updates   boolean not null default true,
  promotional_emails boolean not null default false,
  newsletter      boolean not null default false,
  sms_notifications boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_user_notification_preferences_user_id 
  on public.user_notification_preferences(user_id);

create trigger trg_user_notification_preferences_updated_at
  before update on public.user_notification_preferences
  for each row execute function set_updated_at();

-- ============================================================
--  TABLE: notifications (already created in migration 011)
-- ============================================================
-- Table already exists from migration 011, just add missing columns if needed
alter table public.notifications 
  add column if not exists action_url text;

-- ============================================================
--  TABLE: security_events
-- ============================================================
create table if not exists public.security_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_user_id 
  on public.security_events(user_id);
create index if not exists idx_security_events_created_at 
  on public.security_events(created_at desc);

-- ============================================================
--  Update profiles table to add missing columns
-- ============================================================
alter table public.profiles 
  add column if not exists avatar_path text,
  add column if not exists email text;

-- ============================================================
--  Update addresses table to support separate default flags
-- ============================================================
alter table public.addresses 
  add column if not exists is_default_shipping boolean not null default false,
  add column if not exists is_default_billing boolean not null default false;

-- Migrate existing is_default to is_default_shipping for shipping addresses
update public.addresses 
set is_default_shipping = is_default 
where type = 'shipping' and is_default = true;

-- Migrate existing is_default to is_default_billing for billing addresses
update public.addresses 
set is_default_billing = is_default 
where type = 'billing' and is_default = true;

-- ============================================================
--  Update contact_messages to support user_id
-- ============================================================
alter table public.contact_messages 
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_contact_messages_user_id 
  on public.contact_messages(user_id) where user_id is not null;
