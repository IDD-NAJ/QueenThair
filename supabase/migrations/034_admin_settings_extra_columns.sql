-- admin_settings: 001_schema created a minimal table; 027 intended value_text/description/created_at
-- but CREATE TABLE IF NOT EXISTS skipped them when the table already existed.
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS value_text TEXT;

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
