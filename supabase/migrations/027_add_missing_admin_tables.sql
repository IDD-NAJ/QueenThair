-- ============================================================
--  Add Missing Admin Tables (Banners, Blogs, Shipping, Taxes)
-- ============================================================

-- ── BANNERS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  link_text TEXT,
  button_style TEXT DEFAULT 'primary',
  text_color TEXT DEFAULT '#FFFFFF',
  text_position TEXT DEFAULT 'center',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON public.banners(start_date, end_date);

CREATE TRIGGER set_banners_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── BLOGS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON public.blogs(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON public.blogs(is_featured);
CREATE INDEX IF NOT EXISTS idx_blogs_author ON public.blogs(author_id);

CREATE TRIGGER set_blogs_updated_at BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── SHIPPING ZONES TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  countries TEXT[] NOT NULL,
  states TEXT[],
  postal_codes TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_zones_active ON public.shipping_zones(is_active);

CREATE TRIGGER set_shipping_zones_updated_at BEFORE UPDATE ON public.shipping_zones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── SHIPPING RATES TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rate_type TEXT NOT NULL DEFAULT 'flat', -- flat, weight_based, price_based
  base_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(10,2),
  max_order_amount NUMERIC(10,2),
  free_shipping_threshold NUMERIC(10,2),
  min_delivery_days INTEGER,
  max_delivery_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone ON public.shipping_rates(zone_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_active ON public.shipping_rates(is_active);

CREATE TRIGGER set_shipping_rates_updated_at BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── TAX RATES TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  state_region TEXT,
  city TEXT,
  postal_code TEXT,
  rate NUMERIC(5,2) NOT NULL, -- percentage (e.g., 8.50 for 8.5%)
  priority INTEGER NOT NULL DEFAULT 0,
  compound BOOLEAN NOT NULL DEFAULT false,
  shipping_taxable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_rates_location ON public.tax_rates(country, state_region, city);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON public.tax_rates(is_active);

CREATE TRIGGER set_tax_rates_updated_at BEFORE UPDATE ON public.tax_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ADMIN ACTIVITY LOGS TABLE (if not exists) ──────────────
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_entity ON public.admin_activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON public.admin_activity_logs(created_at DESC);

-- ── ADMIN SETTINGS TABLE (if not exists) ───────────────────
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value_text TEXT,
  value_json JSONB,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);

CREATE TRIGGER set_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE public.banners IS 'Homepage and promotional banners';
COMMENT ON TABLE public.blogs IS 'Blog posts and articles';
COMMENT ON TABLE public.shipping_zones IS 'Shipping zones by geographic location';
COMMENT ON TABLE public.shipping_rates IS 'Shipping rates for each zone';
COMMENT ON TABLE public.tax_rates IS 'Tax rates by location';
COMMENT ON TABLE public.admin_activity_logs IS 'Admin user activity tracking';
COMMENT ON TABLE public.admin_settings IS 'Global admin settings and preferences';
