-- ============================================================
--  QUEENTHAIR - Complete Dashboard System Migrations
--  Apply this file in Supabase SQL Editor to set up dashboards
-- ============================================================

-- ============================================================
--  MIGRATION 007: Admin Activity Logs
-- ============================================================

create table if not exists public.admin_activity_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references public.profiles(id) on delete cascade,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  details     jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_admin_logs_admin_id on public.admin_activity_logs(admin_id);
create index if not exists idx_admin_logs_entity on public.admin_activity_logs(entity_type, entity_id);
create index if not exists idx_admin_logs_created on public.admin_activity_logs(created_at desc);

-- Function to log admin activity
create or replace function log_admin_activity(
  p_admin_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_details jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_log_id uuid;
begin
  insert into public.admin_activity_logs (
    admin_id, action, entity_type, entity_id, details
  ) values (
    p_admin_id, p_action, p_entity_type, p_entity_id, p_details
  )
  returning id into v_log_id;
  
  return v_log_id;
end;
$$;

-- ============================================================
--  MIGRATION 008: User Preferences
-- ============================================================

create table if not exists public.user_preferences (
  id                      uuid primary key references public.profiles(id) on delete cascade,
  email_notifications     boolean not null default true,
  sms_notifications       boolean not null default false,
  order_updates           boolean not null default true,
  promotional_emails      boolean not null default true,
  newsletter              boolean not null default false,
  theme                   text not null default 'light',
  language                text not null default 'en',
  currency                char(3) not null default 'USD',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function set_updated_at();

-- Auto-create preferences when profile is created
create or replace function create_user_preferences()
returns trigger language plpgsql as $$
begin
  insert into public.user_preferences (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_create_user_preferences
  after insert on public.profiles
  for each row execute function create_user_preferences();

-- ============================================================
--  MIGRATION 009: Enhanced RLS Policies
-- ============================================================

-- Enable RLS on new tables
alter table public.admin_activity_logs enable row level security;
alter table public.user_preferences enable row level security;

-- Helper function to check if user is admin
create or replace function is_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id
    and role = 'admin'
  );
$$;

-- ============================================================
--  USER PREFERENCES - Users manage their own
-- ============================================================
drop policy if exists "Users can manage own preferences" on public.user_preferences;
create policy "Users can manage own preferences" on public.user_preferences
  for all using (id = auth.uid());

-- ============================================================
--  ADMIN ACTIVITY LOGS - Admins only
-- ============================================================
drop policy if exists "Admins can view activity logs" on public.admin_activity_logs;
create policy "Admins can view activity logs" on public.admin_activity_logs
  for select using (is_admin());

drop policy if exists "Admins can create activity logs" on public.admin_activity_logs;
create policy "Admins can create activity logs" on public.admin_activity_logs
  for insert with check (is_admin());

-- ============================================================
--  ENHANCED POLICIES FOR EXISTING TABLES
-- ============================================================

-- PROFILES - Users can read their own, admins can read all
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Admins can manage all profiles" on public.profiles;
create policy "Admins can manage all profiles" on public.profiles
  for all using (is_admin());

-- ORDERS - Users view their own, admins manage all
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders" on public.orders
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists "Admins can manage all orders" on public.orders;
create policy "Admins can manage all orders" on public.orders
  for all using (is_admin());

-- REVIEWS - Users manage their own, admins moderate all
drop policy if exists "Anyone can view approved reviews" on public.reviews;
create policy "Anyone can view approved reviews" on public.reviews
  for select using (is_approved = true or user_id = auth.uid() or is_admin());

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews" on public.reviews
  for insert with check (user_id = auth.uid());

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews" on public.reviews
  for update using (user_id = auth.uid() or is_admin());

drop policy if exists "Admins can manage all reviews" on public.reviews;
create policy "Admins can manage all reviews" on public.reviews
  for all using (is_admin());

-- ============================================================
--  SETUP COMPLETE
-- ============================================================

-- Create preferences for existing users
insert into public.user_preferences (id)
select id from public.profiles
where id not in (select id from public.user_preferences)
on conflict (id) do nothing;

-- Success message
do $$
begin
  raise notice '✅ Dashboard migrations applied successfully!';
  raise notice '📝 Next step: Set admin role for your user';
  raise notice 'Run: UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, ''{}''::jsonb), ''{role}'', ''"admin"'') WHERE email = ''your-email@example.com'';';
end $$;
