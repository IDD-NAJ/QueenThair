-- ============================================================
--  SECURE NEWSLETTER: Re-enable RLS with Correct Policy
--  Run this in Supabase Dashboard to secure newsletter table
--  https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/sql/new
-- ============================================================

-- Re-enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start clean
DROP POLICY IF EXISTS "Public insert newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admin manage newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "public_can_insert_newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "admin_manage_newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can manage newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can view own newsletter subscription" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can update own newsletter subscription" ON public.newsletter_subscribers;

-- Create new policies
-- Allow anyone (anon + authenticated) to insert
CREATE POLICY "public_can_insert_newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admin can manage all
CREATE POLICY "admin_manage_newsletter"
  ON public.newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- After running this:
-- ✅ Newsletter signup will work for anonymous users
-- ✅ Newsletter signup will work for authenticated users
-- ✅ Only admins can view/manage subscriber list
-- ✅ Database is secure
-- ============================================================
