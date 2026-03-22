-- ============================================================
--  FIX NEWSLETTER RLS POLICY ISSUE
--  Run this in Supabase SQL Editor to fix newsletter subscription
-- ============================================================

-- Drop the problematic RLS policies that try to access auth.users
drop policy if exists "Users can view own newsletter subscription" on public.newsletter_subscribers;
drop policy if exists "Users can update own newsletter subscription" on public.newsletter_subscribers;

-- Create simplified policies that don't require auth.users access
-- Allow users to view their own subscription by user_id only (if authenticated)
create policy "Users can view own newsletter subscription"
  on public.newsletter_subscribers
  for select
  using (auth.uid() = user_id);

-- Allow users to update their own subscription by user_id only (if authenticated)
create policy "Users can update own newsletter subscription"
  on public.newsletter_subscribers
  for update
  using (auth.uid() = user_id);

-- Keep the existing insert policy (allows anyone to subscribe)
-- Keep the existing admin policy

-- ============================================================
--  VERIFICATION
-- ============================================================

-- Test that the policies work
-- This should show the current policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual 
from pg_policies 
where tablename = 'newsletter_subscribers';

-- ============================================================
--  EXPLANATION
-- ============================================================
-- The original policies tried to access auth.users.email to match by email,
-- but this requires permission to read the users table which fails for
-- unauthenticated users. The fixed policies only match by user_id when
-- authenticated, which is sufficient for the current use case.
-- 
-- The insert policy "Anyone can subscribe to newsletter" allows public
-- subscription without authentication, which is what we want for the
-- newsletter signup form.
-- ============================================================
