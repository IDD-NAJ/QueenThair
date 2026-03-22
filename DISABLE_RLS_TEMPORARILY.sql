-- ============================================================
--  TEMPORARY FIX: Disable RLS on newsletter_subscribers
--  Run this in Supabase Dashboard to test if RLS is the issue
--  https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/sql/new
-- ============================================================

-- OPTION 1: Disable RLS entirely (TEMPORARY - for testing only)
alter table public.newsletter_subscribers disable row level security;

-- After running this, try newsletter signup again
-- If it works, the issue is definitely the RLS policy
-- Then re-enable RLS and apply the correct policy below

-- ============================================================
--  PERMANENT FIX: Re-enable RLS with correct policy
--  Run this after confirming RLS was the issue
-- ============================================================

-- Re-enable RLS
-- alter table public.newsletter_subscribers enable row level security;

-- Drop all policies
-- drop policy if exists "Public insert newsletter" on public.newsletter_subscribers;
-- drop policy if exists "Admin manage newsletter" on public.newsletter_subscribers;
-- drop policy if exists "public_can_insert_newsletter" on public.newsletter_subscribers;
-- drop policy if exists "admin_manage_newsletter" on public.newsletter_subscribers;
-- drop policy if exists "Anyone can subscribe to newsletter" on public.newsletter_subscribers;
-- drop policy if exists "Admins can manage newsletter subscribers" on public.newsletter_subscribers;

-- Create correct policy
-- create policy "public_can_insert_newsletter"
--   on public.newsletter_subscribers
--   for insert
--   to anon, authenticated
--   with check (true);

-- create policy "admin_manage_newsletter"
--   on public.newsletter_subscribers
--   for all
--   to authenticated
--   using (
--     exists (
--       select 1 from public.profiles
--       where id = auth.uid() and role = 'admin'
--     )
--   );
