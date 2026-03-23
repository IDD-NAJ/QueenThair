-- Migration to fix shipping tables schema to match frontend expectations
-- The frontend expects 'active' column but the tables have 'is_active'

-- Add 'active' column to shipping_zones (sync with is_active)
ALTER TABLE public.shipping_zones 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Sync active with is_active for existing data
UPDATE public.shipping_zones SET active = is_active WHERE active IS NULL;

-- Add 'active' column to shipping_rates (sync with is_active)  
ALTER TABLE public.shipping_rates
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Sync active with is_active for existing data
UPDATE public.shipping_rates SET active = is_active WHERE active IS NULL;

-- Create trigger to keep active and is_active in sync for shipping_zones
CREATE OR REPLACE FUNCTION sync_shipping_zone_active()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- If active changed, update is_active
    IF NEW.active IS DISTINCT FROM OLD.active THEN
      NEW.is_active := NEW.active;
    -- If is_active changed, update active  
    ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      NEW.active := NEW.is_active;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_zone_active ON public.shipping_zones;
CREATE TRIGGER sync_zone_active
  BEFORE INSERT OR UPDATE ON public.shipping_zones
  FOR EACH ROW EXECUTE FUNCTION sync_shipping_zone_active();

-- Create trigger to keep active and is_active in sync for shipping_rates
CREATE OR REPLACE FUNCTION sync_shipping_rate_active()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- If active changed, update is_active
    IF NEW.active IS DISTINCT FROM OLD.active THEN
      NEW.is_active := NEW.active;
    -- If is_active changed, update active  
    ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      NEW.active := NEW.is_active;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_rate_active ON public.shipping_rates;
CREATE TRIGGER sync_rate_active
  BEFORE INSERT OR UPDATE ON public.shipping_rates
  FOR EACH ROW EXECUTE FUNCTION sync_shipping_rate_active();

-- Add RLS policies for shipping_zones
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin full access on shipping_zones" ON public.shipping_zones;
CREATE POLICY "Allow admin full access on shipping_zones"
ON public.shipping_zones
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add RLS policies for shipping_rates
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin full access on shipping_rates" ON public.shipping_rates;
CREATE POLICY "Allow admin full access on shipping_rates"
ON public.shipping_rates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow public read access to active shipping rates (for checkout)
DROP POLICY IF EXISTS "Allow public read access to active shipping rates" ON public.shipping_rates;
CREATE POLICY "Allow public read access to active shipping rates"
ON public.shipping_rates
FOR SELECT
USING (active = true);

DROP POLICY IF EXISTS "Allow public read access to active shipping zones" ON public.shipping_zones;
CREATE POLICY "Allow public read access to active shipping zones"
ON public.shipping_zones
FOR SELECT
USING (active = true);
