-- ============================================================
--  QUEENTHAIR – Newsletter Subscription Complete Setup
--  Ensures newsletter_subscribers table exists with proper RLS
-- ============================================================

-- ============================================================
--  TABLE: newsletter_subscribers
-- ============================================================
create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  source        text,
  is_active     boolean not null default true,
  subscribed_at timestamptz not null default now()
);

create index if not exists idx_newsletter_email 
  on public.newsletter_subscribers(email);

create index if not exists idx_newsletter_active 
  on public.newsletter_subscribers(is_active) 
  where is_active = true;

-- ============================================================
--  RLS POLICIES: newsletter_subscribers
-- ============================================================
alter table public.newsletter_subscribers enable row level security;

-- Allow anyone to subscribe (insert)
drop policy if exists "Public insert newsletter" on public.newsletter_subscribers;
create policy "Public insert newsletter"
  on public.newsletter_subscribers for insert
  with check (true);

-- Allow users to view their own subscription
drop policy if exists "Users can view own subscription" on public.newsletter_subscribers;
create policy "Users can view own subscription"
  on public.newsletter_subscribers for select
  using (true);

-- Allow users to update their own subscription (unsubscribe)
drop policy if exists "Users can update own subscription" on public.newsletter_subscribers;
create policy "Users can update own subscription"
  on public.newsletter_subscribers for update
  using (true);

-- Admin can manage all subscriptions
drop policy if exists "Admin manage newsletter" on public.newsletter_subscribers;
create policy "Admin manage newsletter"
  on public.newsletter_subscribers for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
--  HELPER FUNCTION: Get newsletter stats (admin only)
-- ============================================================
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
    raise exception 'Unauthorized';
  end if;

  select json_build_object(
    'total_subscribers', count(*),
    'active_subscribers', count(*) filter (where is_active = true),
    'inactive_subscribers', count(*) filter (where is_active = false),
    'subscriptions_today', count(*) filter (
      where subscribed_at >= current_date
    ),
    'subscriptions_this_week', count(*) filter (
      where subscribed_at >= current_date - interval '7 days'
    ),
    'subscriptions_this_month', count(*) filter (
      where subscribed_at >= date_trunc('month', current_date)
    )
  ) into result
  from public.newsletter_subscribers;

  return result;
end;
$$;

-- ============================================================
--  Newsletter Complete!
-- ============================================================
