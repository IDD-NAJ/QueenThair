-- ============================================================
--  RLS Policies for New Admin Tables
-- ============================================================

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- ── BANNERS POLICIES ───────────────────────────────────────
DROP POLICY IF EXISTS "Banners are viewable by everyone" ON public.banners;
CREATE POLICY "Banners are viewable by everyone"
  ON public.banners FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
CREATE POLICY "Admins can manage banners"
  ON public.banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ── BLOGS POLICIES ─────────────────────────────────────────
DROP POLICY IF EXISTS "Published blogs are viewable by everyone" ON public.blogs;
CREATE POLICY "Published blogs are viewable by everyone"
  ON public.blogs FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can view all blogs" ON public.blogs;
CREATE POLICY "Admins can view all blogs"
  ON public.blogs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage blogs" ON public.blogs;
CREATE POLICY "Admins can manage blogs"
  ON public.blogs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ── SHIPPING ZONES POLICIES ────────────────────────────────
DROP POLICY IF EXISTS "Shipping zones are viewable by everyone" ON public.shipping_zones;
CREATE POLICY "Shipping zones are viewable by everyone"
  ON public.shipping_zones FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage shipping zones" ON public.shipping_zones;
CREATE POLICY "Admins can manage shipping zones"
  ON public.shipping_zones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ── SHIPPING RATES POLICIES ────────────────────────────────
DROP POLICY IF EXISTS "Shipping rates are viewable by everyone" ON public.shipping_rates;
CREATE POLICY "Shipping rates are viewable by everyone"
  ON public.shipping_rates FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage shipping rates" ON public.shipping_rates;
CREATE POLICY "Admins can manage shipping rates"
  ON public.shipping_rates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ── TAX RATES POLICIES ─────────────────────────────────────
DROP POLICY IF EXISTS "Tax rates are viewable by everyone" ON public.tax_rates;
CREATE POLICY "Tax rates are viewable by everyone"
  ON public.tax_rates FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage tax rates" ON public.tax_rates;
CREATE POLICY "Admins can manage tax rates"
  ON public.tax_rates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ── ADMIN ACTIVITY LOGS POLICIES ───────────────────────────
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON public.admin_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can insert activity logs"
  ON public.admin_activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ── ADMIN SETTINGS POLICIES ────────────────────────────────
DROP POLICY IF EXISTS "Admins can view settings" ON public.admin_settings;
CREATE POLICY "Admins can view settings"
  ON public.admin_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
CREATE POLICY "Admins can manage settings"
  ON public.admin_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
