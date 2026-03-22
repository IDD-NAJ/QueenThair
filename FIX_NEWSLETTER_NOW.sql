-- ============================================================
--  IMMEDIATE FIX: Run this in Supabase Dashboard NOW
--  https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/sql/new
-- ============================================================

-- Step 1: Disable RLS temporarily
ALTER TABLE public.newsletter_subscribers DISABLE ROW LEVEL SECURITY;

-- Now test newsletter signup - it should work
-- If it works, continue with steps below to re-enable RLS properly

-- Step 2: Re-enable RLS with correct policy (run after testing)
-- Uncomment and run these lines after confirming signup works:

/*
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admin manage newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "public_can_insert_newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "admin_manage_newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can manage newsletter subscribers" ON public.newsletter_subscribers;

CREATE POLICY "public_can_insert_newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

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
*/
