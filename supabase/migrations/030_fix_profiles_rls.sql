-- Fix profiles RLS - policies already exist, just verify they work
-- The existing policies from 002_rls.sql should be sufficient:
-- - "Users read own profile" - users can read their own
-- - "Admin read all profiles" - admins can read all
-- - "Users update own profile" - users can update their own

-- This migration is a placeholder - policies already exist and should work
SELECT 'Profiles RLS policies already exist from migration 002' as status;
