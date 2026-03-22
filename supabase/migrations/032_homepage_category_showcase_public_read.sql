-- Allow anonymous and authenticated clients to read only the homepage
-- "Shop by Category" showcase JSON (stored in admin_settings).

DROP POLICY IF EXISTS "Public read homepage category showcase" ON public.admin_settings;
CREATE POLICY "Public read homepage category showcase"
  ON public.admin_settings FOR SELECT
  TO anon, authenticated
  USING (key = 'homepage_category_section');
