-- ============================================================
--  QUEENTHAIR – Enhanced Newsletter Subscription System
--  Production-ready newsletter with full status management
-- ============================================================

-- ============================================================
--  TABLE: newsletter_subscribers (Enhanced)
-- ============================================================
-- Table already exists from migration 009, add missing columns
alter table public.newsletter_subscribers 
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists status text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Migrate is_active to status column
update public.newsletter_subscribers 
set status = case when is_active then 'active' else 'unsubscribed' end
where status is null;

-- Make status not null and set default
alter table public.newsletter_subscribers 
  alter column status set not null,
  alter column status set default 'active';

-- Add status constraint
alter table public.newsletter_subscribers 
  drop constraint if exists newsletter_subscribers_status_check;
  
alter table public.newsletter_subscribers 
  add constraint newsletter_subscribers_status_check
    check (status in ('active', 'unsubscribed', 'bounced'));

-- Update source column default
alter table public.newsletter_subscribers 
  alter column source set default 'homepage_vip_list';

-- ============================================================
--  INDEXES
-- ============================================================

-- Unique index on normalized email (lowercase + trimmed)
create unique index if not exists newsletter_subscribers_email_unique_idx
  on public.newsletter_subscribers (lower(trim(email)));

-- Index for active subscribers
create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status)
  where status = 'active';

-- Index for user_id lookups
create index if not exists newsletter_subscribers_user_id_idx
  on public.newsletter_subscribers (user_id)
  where user_id is not null;

-- Index for source analytics
create index if not exists newsletter_subscribers_source_idx
  on public.newsletter_subscribers (source);

-- Index for time-based queries
create index if not exists newsletter_subscribers_subscribed_at_idx
  on public.newsletter_subscribers (subscribed_at desc);

-- ============================================================
--  UPDATED_AT TRIGGER
-- ============================================================

-- Create or replace the updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists newsletter_subscribers_updated_at on public.newsletter_subscribers;

-- Create trigger for updated_at
create trigger newsletter_subscribers_updated_at
  before update on public.newsletter_subscribers
  for each row
  execute function public.update_updated_at_column();

-- ============================================================
--  RLS POLICIES
-- ============================================================

alter table public.newsletter_subscribers enable row level security;

-- Drop all existing policies to recreate them
drop policy if exists "Public insert newsletter" on public.newsletter_subscribers;
drop policy if exists "Users can view own subscription" on public.newsletter_subscribers;
drop policy if exists "Users can update own subscription" on public.newsletter_subscribers;
drop policy if exists "Admin manage newsletter" on public.newsletter_subscribers;

-- Allow anyone to subscribe (public insert)
create policy "Anyone can subscribe to newsletter"
  on public.newsletter_subscribers
  for insert
  with check (true);

-- Users can view their own subscription by email or user_id
create policy "Users can view own newsletter subscription"
  on public.newsletter_subscribers
  for select
  using (
    auth.uid() = user_id
    or email = lower(trim((select email from auth.users where id = auth.uid())))
  );

-- Users can update their own subscription (e.g., unsubscribe)
create policy "Users can update own newsletter subscription"
  on public.newsletter_subscribers
  for update
  using (
    auth.uid() = user_id
    or email = lower(trim((select email from auth.users where id = auth.uid())))
  );

-- Admins can manage all newsletter subscriptions
create policy "Admins can manage all newsletter subscriptions"
  on public.newsletter_subscribers
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
--  HELPER FUNCTIONS
-- ============================================================

-- Get newsletter statistics (admin only)
create or replace function public.get_newsletter_stats()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  -- Check if user is admin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  select json_build_object(
    'total_subscribers', count(*),
    'active_subscribers', count(*) filter (where status = 'active'),
    'unsubscribed', count(*) filter (where status = 'unsubscribed'),
    'bounced', count(*) filter (where status = 'bounced'),
    'subscriptions_today', count(*) filter (
      where subscribed_at >= current_date
    ),
    'subscriptions_this_week', count(*) filter (
      where subscribed_at >= current_date - interval '7 days'
    ),
    'subscriptions_this_month', count(*) filter (
      where subscribed_at >= date_trunc('month', current_date)
    ),
    'by_source', (
      select json_object_agg(source, count)
      from (
        select source, count(*) as count
        from public.newsletter_subscribers
        where status = 'active'
        group by source
      ) sources
    )
  ) into result
  from public.newsletter_subscribers;

  return result;
end;
$$;

-- Export active subscribers (admin only)
create or replace function public.export_newsletter_subscribers(
  p_status text default 'active'
)
returns table (
  email text,
  first_name text,
  last_name text,
  source text,
  subscribed_at timestamptz
)
language plpgsql
security definer
as $$
begin
  -- Check if user is admin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
  select 
    ns.email,
    ns.first_name,
    ns.last_name,
    ns.source,
    ns.subscribed_at
  from public.newsletter_subscribers ns
  where ns.status = p_status
  order by ns.subscribed_at desc;
end;
$$;

-- ============================================================
--  MIGRATION COMPLETE
-- ============================================================
-- This migration enhances the newsletter_subscribers table with:
-- ✓ user_id linking for authenticated users
-- ✓ status field with constraint (active, unsubscribed, bounced)
-- ✓ metadata jsonb for extensibility
-- ✓ updated_at with automatic trigger
-- ✓ normalized email unique index
-- ✓ comprehensive RLS policies
-- ✓ admin helper functions
-- ============================================================
