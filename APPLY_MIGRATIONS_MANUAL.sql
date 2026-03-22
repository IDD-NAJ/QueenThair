-- ============================================================
--  QUEENTHAIR – User Dashboard Migrations (Combined)
--  Apply this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
--  PART 1: Create Tables
-- ============================================================

-- Create user_notification_preferences table
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

-- Create notifications table
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null default 'general',
  is_read    boolean not null default false,
  action_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id 
  on public.notifications(user_id);
create index if not exists idx_notifications_user_unread 
  on public.notifications(user_id, is_read) where is_read = false;

-- Create security_events table
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

-- Update profiles table
alter table public.profiles 
  add column if not exists avatar_path text,
  add column if not exists email text;

-- Update addresses table
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

-- Update contact_messages table
alter table public.contact_messages 
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_contact_messages_user_id 
  on public.contact_messages(user_id) where user_id is not null;

-- ============================================================
--  PART 2: Row-Level Security Policies
-- ============================================================

-- RLS: user_notification_preferences
alter table public.user_notification_preferences enable row level security;

drop policy if exists "Users can view own notification preferences" on public.user_notification_preferences;
create policy "Users can view own notification preferences"
  on public.user_notification_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notification preferences" on public.user_notification_preferences;
create policy "Users can insert own notification preferences"
  on public.user_notification_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification preferences" on public.user_notification_preferences;
create policy "Users can update own notification preferences"
  on public.user_notification_preferences for update
  using (auth.uid() = user_id);

-- RLS: notifications
alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- RLS: security_events
alter table public.security_events enable row level security;

drop policy if exists "Users can view own security events" on public.security_events;
create policy "Users can view own security events"
  on public.security_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own security events" on public.security_events;
create policy "Users can insert own security events"
  on public.security_events for insert
  with check (auth.uid() = user_id);

-- RLS: contact_messages (update)
drop policy if exists "Anyone can insert contact messages" on public.contact_messages;
drop policy if exists "Authenticated users can insert contact messages" on public.contact_messages;

create policy "Authenticated users can insert contact messages"
  on public.contact_messages for insert
  with check (
    auth.uid() is not null and 
    (user_id is null or user_id = auth.uid())
  );

drop policy if exists "Users can view own contact messages" on public.contact_messages;
create policy "Users can view own contact messages"
  on public.contact_messages for select
  using (user_id = auth.uid());

-- ============================================================
--  PART 3: Storage Bucket and Policies
-- ============================================================

-- Create avatars storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage Policies: avatars
drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Public can view avatars" on storage.objects;
create policy "Public can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ============================================================
--  Migration Complete!
-- ============================================================
