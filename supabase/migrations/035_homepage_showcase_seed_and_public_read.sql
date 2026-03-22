-- Ensure anonymous reads work for homepage showcase and seed an empty config row if missing.

DROP POLICY IF EXISTS "Public read homepage category showcase" ON public.admin_settings;
CREATE POLICY "Public read homepage category showcase"
  ON public.admin_settings FOR SELECT
  TO anon, authenticated
  USING (key = 'homepage_category_section');

INSERT INTO public.admin_settings (key, value_json)
VALUES (
  'homepage_category_section',
  jsonb_build_object(
    'section_active', true,
    'title', 'Shop by Category',
    'subtitle', 'Find your perfect style',
    'items', '[]'::jsonb
  )
)
ON CONFLICT (key) DO NOTHING;
