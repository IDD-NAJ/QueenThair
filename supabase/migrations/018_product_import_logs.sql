-- Product Import Logs Table
CREATE TABLE IF NOT EXISTS product_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  import_mode TEXT NOT NULL CHECK (import_mode IN ('upsert', 'full_sync', 'inventory_only', 'pricing_only')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  products_created INTEGER NOT NULL DEFAULT 0,
  products_updated INTEGER NOT NULL DEFAULT 0,
  variants_created INTEGER NOT NULL DEFAULT 0,
  variants_updated INTEGER NOT NULL DEFAULT 0,
  inventory_updated INTEGER NOT NULL DEFAULT 0,
  categories_created INTEGER NOT NULL DEFAULT 0,
  collections_created INTEGER NOT NULL DEFAULT 0,
  images_created INTEGER NOT NULL DEFAULT 0,
  images_updated INTEGER NOT NULL DEFAULT 0,
  report_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin user lookups
CREATE INDEX idx_product_import_logs_admin_user ON product_import_logs(admin_user_id);
CREATE INDEX idx_product_import_logs_created_at ON product_import_logs(created_at DESC);

-- RLS Policies
ALTER TABLE product_import_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view their own import logs
CREATE POLICY "Admins can view their import logs"
  ON product_import_logs
  FOR SELECT
  TO authenticated
  USING (
    admin_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert import logs
CREATE POLICY "Admins can insert import logs"
  ON product_import_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE product_import_logs IS 'Tracks all product CSV import operations for audit and traceability';
